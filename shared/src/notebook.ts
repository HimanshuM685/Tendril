/** Limits are shared by upload validation, sandbox runners, and result transport. */
export const NOTEBOOK_MAX_BYTES = 1_500_000;
export const NOTEBOOK_MAX_CELLS = 500;
export const NOTEBOOK_OUTPUT_BYTES = 2_000_000;
export const NOTEBOOK_ARTIFACT_BYTES = 4_000_000;
export const JOB_RESULT_MAX_BYTES = 12_000_000;
export const JOB_LOG_MAX_BYTES = 32_000;
export const RUN_MAX_TIMEOUT_MS = 15 * 60_000;

export function boundedRunTimeoutMs(value: number): number {
  return Number.isFinite(value) && value > 0
    ? Math.min(RUN_MAX_TIMEOUT_MS, Math.max(1_000, Math.floor(value)))
    : 120_000;
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
