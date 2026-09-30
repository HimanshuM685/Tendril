import { useEffect, useRef, useState } from "react";
import type { RunArtifact, RunResponse } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import { runNotebook } from "../api";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { Session } from "../App";
import { isCustodialSession } from "../lib/session";

const NOTEBOOK_MAX_BYTES = 1_500_000;
const OUTPUT_TEXT_CAP = 12_000;

type TrainLane = "contributor" | "priority";

interface Props {
  session: Session | null;
  activeAddress: string | null;
  signTransactions: SignTransactions;
  /** A lane can take the notebook: a peer is online, or Modal is configured. */
  notebooks: boolean;
  /** Priority lane. Modal image includes numpy, pandas, matplotlib, requests. */
  priority: boolean;
  /** Contributor lane. Uses a live peer and that node's own Python image. */
  peers: boolean;
  checking: boolean;
  onOpenConnectWallet?: () => void;
  onWalletChanged?: () => void;
}

interface PendingNotebook {
  name: string;
  notebook: Record<string, unknown>;
  cells: number;
  codeCells: number;
}

type ShownOutput =
  | { kind: "text"; text: string }
  | { kind: "error"; text: string }
  | { kind: "image"; mediaType: string; base64: string };

interface ShownCell {
  index: number;
  source: string;
  outputs: ShownOutput[];
}

interface NotebookView {
  fileName: string;
  ok: boolean;
  log: string;
  seconds?: number;
  costAtomic?: string;
  cells: ShownCell[];
  artifacts: RunArtifact[];
  notebook?: Record<string, unknown>;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) return value.join("");
  return "";
}

function clip(text: string): string {
  if (text.length <= OUTPUT_TEXT_CAP) return text;
  return `${text.slice(0, OUTPUT_TEXT_CAP)}\n… output truncated`;
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function outputsFrom(raw: unknown): ShownOutput[] {
  if (!Array.isArray(raw)) return [];
  const shown: ShownOutput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const output = item as Record<string, unknown>;
    if (output.output_type === "stream") {
      const text = stripAnsi(asText(output.text)).trimEnd();
      if (text) shown.push({ kind: "text", text: clip(text) });
      continue;
    }
    if (output.output_type === "error") {
      const head = [output.ename, output.evalue].filter((v) => typeof v === "string").join(": ");
      const text = stripAnsi([head, asText(output.traceback)].filter(Boolean).join("\n")).trim();
      if (text) shown.push({ kind: "error", text: clip(text) });
      continue;
    }
    if (output.output_type !== "execute_result" && output.output_type !== "display_data") continue;
    const data = output.data;
    if (!data || typeof data !== "object") continue;
    const fields = data as Record<string, unknown>;
    for (const mediaType of ["image/png", "image/jpeg", "image/gif", "image/webp"]) {
      const encoded = fields[mediaType];
      if (typeof encoded === "string" && encoded.length > 0) {
        shown.push({ kind: "image", mediaType, base64: encoded });
        break;
      }
    }
    const plain = stripAnsi(asText(fields["text/plain"])).trimEnd();
    if (plain) shown.push({ kind: "text", text: clip(plain) });
  }
  return shown;
}

function cellsFrom(notebook: Record<string, unknown> | undefined): ShownCell[] {
  const cells = notebook?.cells;
  if (!Array.isArray(cells)) return [];
  const shown: ShownCell[] = [];
  let codeIndex = 0;
  for (const cell of cells) {
    if (!cell || typeof cell !== "object") continue;
    const record = cell as Record<string, unknown>;
    if (record.cell_type !== "code") continue;
    codeIndex += 1;
    const outputs = outputsFrom(record.outputs);
    if (outputs.length === 0) continue;
    shown.push({
      index: codeIndex,
      source: clip(asText(record.source).trimEnd()),
      outputs,
    });
  }
  return shown;
}

function parseNotebookFile(name: string, text: string): PendingNotebook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not a Jupyter notebook.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("That file is not a Jupyter notebook.");
  }
  const notebook = parsed as Record<string, unknown>;
  if (!Array.isArray(notebook.cells)) {
    throw new Error("That file is not a Jupyter notebook.");
  }
  if (text.length > NOTEBOOK_MAX_BYTES) {
    throw new Error("Notebooks must be under 1.5 MB.");
  }
  const cells = notebook.cells.length;
  const codeCells = notebook.cells.filter(
    (cell) => !!cell && typeof cell === "object" && (cell as { cell_type?: string }).cell_type === "code",
  ).length;
  return { name, notebook, cells, codeCells };
}

function fmtBytes(base64: string): string {
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.split("/").pop() || "download";
  a.click();
  URL.revokeObjectURL(url);
}

function availabilityCopy(checking: boolean, notebooks: boolean): string {
  if (checking) return "Checking which machines can run a notebook.";
  if (notebooks) {
    return "Upload a .ipynb. Contributor training uses a live peer. Priority training runs on Modal with numpy, pandas, matplotlib, and requests already installed. Both bill by the second from credit and stop when it runs out.";
  }
  return "No contributor node is online, and priority training is not configured.";
}

export function NotebookSection({
  session,
  activeAddress,
  signTransactions,
  notebooks,
  priority,
  peers,
  checking,
  onOpenConnectWallet,
  onWalletChanged,
}: Props) {
  const { runCustodialAction } = useCustodialSign();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingNotebook | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<PayStage | "confirming" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<NotebookView | null>(null);
  const [lane, setLane] = useState<TrainLane>("contributor");
  useEffect(() => {
    if (lane === "priority" && !priority && peers) setLane("contributor");
    if (lane === "contributor" && !peers && priority) setLane("priority");
  }, [lane, peers, priority]);

  const isCustodial = isCustodialSession(session);
  const canPick = notebooks && !uploading;

  function takeFile(file: File | undefined) {
    if (!file || !canPick) return;
    setError(null);
    void file.text().then(
      (text) => {
        try {
          setPending(parseNotebookFile(file.name, text));
        } catch (e) {
          setPending(null);
          setError((e as Error).message);
        }
      },
      () => setError("Could not read that file."),
    );
    if (fileRef.current) fileRef.current.value = "";
  }

  async function run() {
    if (!pending) return;
    if (!activeAddress) {
      if (onOpenConnectWallet) onOpenConnectWallet();
      else setError("Connect a wallet to run a notebook.");
      return;
    }
    if (isCustodial && !session) {
      setError("Sign in to run a notebook.");
      return;
    }
    setUploading(true);
    setError(null);
    setView(null);
    setStage(null);
    try {
      let res: RunResponse;
      if (isCustodial && session) {
        setStage("confirming");
        res = (await runCustodialAction(session.token, {
          action: "run",
          notebook: pending.notebook,
          lane,
        })) as RunResponse;
      } else {
        res = await runNotebook(
          session?.token ?? null,
          activeAddress,
          signTransactions,
          pending.notebook,
          lane,
          setStage,
        );
      }
      setView({
        fileName: pending.name,
        ok: res.ok,
        log: stripAnsi(res.result ?? "").trim(),
        seconds: res.execution?.seconds,
        costAtomic: res.execution?.costAtomic,
        cells: cellsFrom(res.notebook),
        artifacts: res.artifacts ?? [],
        notebook: res.notebook,
      });
      onWalletChanged?.();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    } finally {
      setUploading(false);
      setStage(null);
    }
  }

  const runLabel = uploading
    ? stage === "signing"
      ? "Waiting for wallet…"
      : stage === "settling"
        ? "Settling payment…"
        : stage === "confirming"
          ? "Confirming…"
          : "Running cells…"
    : lane === "priority"
      ? "Run priority"
      : "Run on contributor";

  const costLabel =
    view?.costAtomic !== undefined && Number.isFinite(Number(view.costAtomic))
      ? formatUsdc(Number(view.costAtomic))
      : null;

  return (
    <section className="notebook-section" id="run-notebook">
      <div className="explore-card-head">
        <div>
          <h2 className="card-head-title">Run a notebook</h2>
          <p className="card-head-sub">{availabilityCopy(checking, notebooks)}</p>
        </div>
      </div>

      <div className="notebook-layout">
        <div className="notebook-upload">
          <label
            className={`notebook-drop${dragOver ? " is-over" : ""}${canPick ? "" : " is-disabled"}`}
            onDragEnter={(e) => {
              e.preventDefault();
              if (canPick) setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (canPick) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".ipynb,application/json"
              disabled={!canPick}
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
            <span className="notebook-drop-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <span className="notebook-drop-title">
              {canPick ? "Drop a .ipynb here" : checking ? "Checking…" : "Upload unavailable"}
            </span>
            <span className="notebook-drop-sub">
              {canPick
                ? "or click to choose a file · 1.5 MB max"
                : checking
                  ? "Checking machines"
                  : "No peer online and priority is off"}
            </span>
          </label>

          {pending && (
            <div className="notebook-file">
              <div>
                <div className="notebook-file-name">{pending.name}</div>
                <div className="notebook-file-meta">
                  {pending.cells} {pending.cells === 1 ? "cell" : "cells"}
                  {pending.codeCells !== pending.cells ? ` · ${pending.codeCells} code` : ""}
                </div>
              </div>
              <button
                type="button"
                className="btn-tiny"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Change
              </button>
            </div>
          )}

          <div className="notebook-lanes" role="radiogroup" aria-label="Where to run the notebook">
            <button
              type="button"
              role="radio"
              aria-checked={lane === "contributor"}
              className={`notebook-lane${lane === "contributor" ? " is-on" : ""}`}
              disabled={uploading || !peers}
              onClick={() => setLane("contributor")}
            >
              <span>Contributor training</span>
              <small>Live peer. That node's rate.</small>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={lane === "priority"}
              className={`notebook-lane${lane === "priority" ? " is-on" : ""}`}
              disabled={uploading || !priority}
              onClick={() => setLane("priority")}
            >
              <span>Priority training</span>
              <small>Modal. numpy, pandas, matplotlib, requests.</small>
            </button>
          </div>

          <button
            type="button"
            className="ca-btn ca-btn-primary notebook-run-btn"
            disabled={!pending || uploading || !notebooks || (lane === "priority" ? !priority : !peers)}
            onClick={() => void run()}
          >
            {runLabel}
          </button>

          {error && <p className="notebook-error">{error}</p>}
        </div>

        <div className="notebook-results" aria-live="polite">
          <div className="notebook-results-label">Results</div>
          {uploading && (
            <p className="notebook-results-empty">Running the notebook. Outputs will show here when it finishes.</p>
          )}
          {!uploading && !view && (
            <p className="notebook-results-empty">
              Cell output, plots, and files the notebook writes show up here after a run. Nothing is downloaded until you ask.
            </p>
          )}
          {!uploading && view && (
            <>
              <div className="notebook-summary">
                <span className={`pill-badge ${view.ok ? "pill-running" : "pill-failed"}`}>
                  {view.ok ? "Finished" : "Failed"}
                </span>
                {view.seconds !== undefined && (
                  <span className="notebook-chip">{view.seconds}s billed</span>
                )}
                {costLabel && <span className="notebook-chip">{costLabel}</span>}
                <span className="notebook-chip notebook-chip-name">{view.fileName}</span>
                {view.notebook && (
                  <button
                    type="button"
                    className="btn-tiny"
                    onClick={() =>
                      downloadBlob(
                        view.fileName.replace(/\.ipynb$/i, "") + ".executed.ipynb",
                        new Blob([JSON.stringify(view.notebook, null, 2)], { type: "application/json" }),
                      )
                    }
                  >
                    Download notebook
                  </button>
                )}
              </div>

              {view.cells.length === 0 && !view.log && view.artifacts.length === 0 && (
                <p className="notebook-results-empty">The notebook finished with no cell output.</p>
              )}

              {view.cells.map((cell) => (
                <article className="notebook-cell" key={cell.index}>
                  <div className="notebook-cell-label">Cell {cell.index}</div>
                  {cell.source && <pre className="notebook-source">{cell.source}</pre>}
                  {cell.outputs.map((output, i) => {
                    if (output.kind === "image") {
                      return (
                        <img
                          key={i}
                          className="notebook-image"
                          alt={`Cell ${cell.index} output`}
                          src={`data:${output.mediaType};base64,${output.base64}`}
                        />
                      );
                    }
                    return (
                      <pre
                        key={i}
                        className={output.kind === "error" ? "notebook-output is-error" : "notebook-output"}
                      >
                        {output.text}
                      </pre>
                    );
                  })}
                </article>
              ))}

              {view.artifacts.length > 0 && (
                <div className="notebook-artifacts">
                  <div className="notebook-cell-label">Files</div>
                  {view.artifacts.map((art) => (
                    <div className="notebook-artifact" key={art.name}>
                      <div>
                        <div className="notebook-file-name">{art.name}</div>
                        <div className="notebook-file-meta">{fmtBytes(art.base64)}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-tiny"
                        onClick={() => {
                          const bytes = Uint8Array.from(atob(art.base64), (c) => c.charCodeAt(0));
                          downloadBlob(art.name, new Blob([bytes], { type: art.mediaType }));
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {view.log && (
                <details className="notebook-log">
                  <summary>Runner log</summary>
                  <pre className="notebook-output">{view.log}</pre>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
