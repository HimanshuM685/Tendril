/** Single registry owns leases. Claim before async ledger/settlement work. */
const notebookPayers = new Set<string>();

export function notebookPayerBusy(address: string): boolean {
  return notebookPayers.has(address);
}

export function claimNotebookPayer(address: string): (() => void) | null {
  if (notebookPayers.has(address)) return null;
  notebookPayers.add(address);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    notebookPayers.delete(address);
  };
}

/** Covers execution AND result collection. Callers tear down on rejection. */
export async function withRunDeadline<T>(run: Promise<T>, timeoutMs: number, message = "Notebook time limit reached; sandbox stopped."): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
