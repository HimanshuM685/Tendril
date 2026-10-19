/** Limits are shared by upload validation, sandbox runners, and result transport. */
export const NOTEBOOK_MAX_BYTES = 1_500_000;
export const NOTEBOOK_MAX_CELLS = 500;
export const NOTEBOOK_OUTPUT_BYTES = 2_000_000;
export const NOTEBOOK_ARTIFACT_BYTES = 4_000_000;
export const JOB_RESULT_MAX_BYTES = 12_000_000;
export const JOB_LOG_MAX_BYTES = 32_000;
export const RUN_MAX_TIMEOUT_MS = 15 * 60_000;
export const RUN_DEFAULT_TIMEOUT_MS = 120_000;

/** Bounds for caller-supplied runtime settings. These are transport limits, not
 * notebook output/artifact limits. */
export const NOTEBOOK_MAX_ENV_VARS = 32;
export const NOTEBOOK_MAX_ENV_VALUE_BYTES = 4_096;
export const NOTEBOOK_MAX_PIP_PACKAGES = 32;
export const NOTEBOOK_MAX_PIP_SPEC_BYTES = 256;

/** Settings applied only to one notebook run. */
export interface NotebookRuntimeOptions {
  /** Environment variables exposed to notebook code. */
  env?: Record<string, string>;
  /** PEP 508-ish package requirements installed before execution. */
  pipPackages?: string[];
  /** Alias accepted by clients that call requirements simply packages. */
  packages?: string[];
  /** Optional approved sandbox image selected by the server policy. */
  image?: string;
  /** Optional per-run execution cap. */
  timeoutMs?: number;
}

/** Backwards-compatible shorthand for callers that call these run settings options. */
export type NotebookRunOptions = NotebookRuntimeOptions;

export interface NormalizedNotebookRuntimeOptions {
  env: Record<string, string>;
  pipPackages: string[];
  timeoutMs: number;
}

export function boundedRunTimeoutMs(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(RUN_MAX_TIMEOUT_MS, Math.max(1_000, Math.floor(value)))
    : RUN_DEFAULT_TIMEOUT_MS;
}

/** Resolve timeout from either legacy scalar input or runtime options. */
export function notebookTimeoutMs(value?: number | null | NotebookRuntimeOptions): number {
  return boundedRunTimeoutMs(value !== null && typeof value === "object" ? value.timeoutMs : value);
}

/** Seconds form used by generated Python runner source. */
export function notebookTimeoutSeconds(value?: number | null | NotebookRuntimeOptions): number {
  return notebookTimeoutMs(value) / 1_000;
}

const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PIP_SPEC = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*(?:\[[A-Za-z0-9.,_-]+\])?(?:\s*(?:===|==|!=|~=|>=|<=|>|<)\s*[A-Za-z0-9.*+!_-]+(?:\s*,\s*(?:===|==|!=|~=|>=|<=|>|<)\s*[A-Za-z0-9.*+!_-]+)*)?)$/;
const UNSAFE_ENV_NAMES = new Set([
  "HOME", "PATH", "PYTHONHOME", "PYTHONPATH", "PYTHONEXECUTABLE", "PYTHONSTARTUP",
  "IPYTHONDIR", "MPLBACKEND", "LD_PRELOAD", "LD_LIBRARY_PATH",
]);
const utf8Bytes = (value: string): number => new TextEncoder().encode(value).byteLength;

/** Return validation text for per-run settings, or null when settings are safe. */
export function notebookRuntimeOptionsError(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return "notebook runtime options must be an object";
  const options = value as Record<string, unknown>;

  if (options.env !== undefined) {
    if (!options.env || typeof options.env !== "object" || Array.isArray(options.env)) {
      return "notebook runtime env must be an object";
    }
    const env = options.env as Record<string, unknown>;
    const entries = Object.entries(env);
    if (entries.length > NOTEBOOK_MAX_ENV_VARS) return `notebook runtime env exceeds ${NOTEBOOK_MAX_ENV_VARS} variables`;
    let totalBytes = 0;
    for (const [name, raw] of entries) {
      if (!ENV_NAME.test(name) || UNSAFE_ENV_NAMES.has(name)) return `invalid notebook runtime env name "${name}"`;
      if (typeof raw !== "string" || raw.includes("\0")) return `notebook runtime env "${name}" must be text without NUL bytes`;
      const bytes = utf8Bytes(raw);
      if (bytes > NOTEBOOK_MAX_ENV_VALUE_BYTES) return `notebook runtime env "${name}" exceeds ${NOTEBOOK_MAX_ENV_VALUE_BYTES} bytes`;
      totalBytes += bytes;
    }
    if (totalBytes > NOTEBOOK_MAX_ENV_VARS * NOTEBOOK_MAX_ENV_VALUE_BYTES) {
      return "notebook runtime env exceeds its total size limit";
    }
  }

  const pipPackages = options.pipPackages ?? options.packages;
  if (options.pipPackages !== undefined && options.packages !== undefined) {
    return "provide only one of notebook runtime pipPackages or packages";
  }
  if (pipPackages !== undefined) {
    if (!Array.isArray(pipPackages)) return "notebook runtime pipPackages must be an array";
    if (pipPackages.length > NOTEBOOK_MAX_PIP_PACKAGES) return `notebook runtime pipPackages exceeds ${NOTEBOOK_MAX_PIP_PACKAGES} packages`;
    for (const spec of pipPackages) {
      if (typeof spec !== "string" || !PIP_SPEC.test(spec) || spec.startsWith("-")) {
        return `invalid notebook runtime pip package spec "${String(spec).slice(0, 80)}"`;
      }
      if (utf8Bytes(spec) > NOTEBOOK_MAX_PIP_SPEC_BYTES) {
        return `notebook runtime pip package spec exceeds ${NOTEBOOK_MAX_PIP_SPEC_BYTES} bytes`;
      }
    }
  }

  if (options.timeoutMs !== undefined && typeof options.timeoutMs !== "number") {
    return "notebook runtime timeoutMs must be a number";
  }
  if (options.image !== undefined &&
      (typeof options.image !== "string" || options.image.length === 0 || options.image.length > 256 || options.image.includes("\0"))) {
    return "notebook runtime image must be a non-empty image reference under 256 characters";
  }
  return null;
}

/** Validate and fill defaults before settings enter generated runner code. */
export function normalizeNotebookRuntimeOptions(
  value?: number | null | NotebookRuntimeOptions,
): NormalizedNotebookRuntimeOptions {
  const options: NotebookRuntimeOptions = typeof value === "number" ? { timeoutMs: value } : value ?? {};
  const error = notebookRuntimeOptionsError(options);
  if (error) throw new Error(error);
  return {
    env: { ...(options.env ?? {}) },
    pipPackages: [...(options.pipPackages ?? options.packages ?? [])],
    timeoutMs: notebookTimeoutMs(options),
  };
}

/** Validate structure, not Python syntax: IPython transforms magics at execution. */
export function notebookError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "notebook must be a JSON object";
  const nb = value as Record<string, unknown>;
  if (nb.nbformat !== 4 || !Array.isArray(nb.cells)) return "upload an nbformat 4 notebook";
  if (nb.cells.length > NOTEBOOK_MAX_CELLS) return `notebook exceeds ${NOTEBOOK_MAX_CELLS} cells`;
  if (!nb.metadata || typeof nb.metadata !== "object" || Array.isArray(nb.metadata)) return "notebook metadata must be an object";
  const metadata = nb.metadata as Record<string, unknown>;
  const language = (metadata.language_info as { name?: unknown } | undefined)?.name
    ?? (metadata.kernelspec as { language?: unknown } | undefined)?.language;
  if (typeof language === "string" && language.toLowerCase() !== "python") return "only Python notebooks are supported";
  for (const [index, cell] of nb.cells.entries()) {
    if (!cell || typeof cell !== "object" || Array.isArray(cell)) return `cell ${index + 1} must be an object`;
    const c = cell as Record<string, unknown>;
    if (!["code", "markdown", "raw"].includes(String(c.cell_type))) return `cell ${index + 1} has an invalid type`;
    if (!(typeof c.source === "string" || (Array.isArray(c.source) && c.source.every((s) => typeof s === "string")))) {
      return `cell ${index + 1} source must be text`;
    }
  }
  return null;
}
