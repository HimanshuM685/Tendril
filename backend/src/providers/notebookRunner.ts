const SENTINEL = "\n__TENDRIL_NB__\n";

/**
 * Contributor sandboxes only accept a Python payload. This script executes the
 * notebook's code cells in-process and prints the executed notebook after a
 * sentinel so the registry can hand cell output back to the UI.
 */
export function notebookToPayload(notebook: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(notebook), "utf8").toString("base64");
  return `import ast, base64, io, json, os, sys, traceback, subprocess, types
os.makedirs("/work", exist_ok=True)
os.chdir("/work")
nb = json.loads(base64.b64decode(${JSON.stringify(encoded)}))
# Cells run as a real __main__ module: pickle (ProcessPoolExecutor, multiprocessing)
# resolves functions by sys.modules["__main__"], and a bare dict would not be found.
# A fresh module, not this script's own, so cell variables cannot clobber runner state.
main = types.ModuleType("__main__")
sys.modules["__main__"] = main
ns = main.__dict__
current = []
_show = None
try:
    import matplotlib
    matplotlib.use("Agg", force=True)
    import matplotlib.pyplot as plt
    def _show(*_a, **_k):
        for num in list(plt.get_fignums()):
            fig = plt.figure(num)
            bio = io.BytesIO()
            fig.savefig(bio, format="png", bbox_inches="tight")
            current.append({"output_type":"display_data","metadata":{},"data":{"image/png": base64.b64encode(bio.getvalue()).decode(), "text/plain":"<Figure>"}})
        plt.close("all")
    plt.show = _show
    ns["plt"] = plt
except Exception:
    pass

def src(cell):
    raw = cell.get("source") or ""
    return "".join(raw) if isinstance(raw, list) else str(raw)

def shell(line):
    proc = subprocess.run(line[1:], shell=True, capture_output=True, text=True)
    text = (proc.stdout or "") + (proc.stderr or "")
    if proc.returncode:
        raise RuntimeError(text.strip() or f"shell exited {proc.returncode}")
    return text

def emit(text, name="stdout"):
    if not text:
        return
    if not text.endswith("\\n"):
        text += "\\n"
    current.append({"output_type":"stream","name":name,"text":text})

ok = True
count = 0
for cell in nb.get("cells") or []:
    if cell.get("cell_type") != "code":
        continue
    count += 1
    current = []
    cell["execution_count"] = count
    text = src(cell)
    try:
        if _show is not None:
            mod = sys.modules.get("matplotlib.pyplot")
            if mod is not None:
                mod.show = _show
            if "plt" in ns:
                ns["plt"].show = _show
        py = []
        for line in text.splitlines():
            if line.startswith("!"):
                if py:
                    exec(compile("\\n".join(py), "<cell>", "exec"), ns)
                    py = []
                emit(shell(line))
            else:
                py.append(line)
        body = "\\n".join(py).strip()
        if body:
            tree = ast.parse(body)
            last = tree.body.pop() if tree.body and isinstance(tree.body[-1], ast.Expr) else None
            buf = io.StringIO()
            old = sys.stdout
            sys.stdout = buf
            try:
                if tree.body:
                    exec(compile(tree, "<cell>", "exec"), ns)
                value = eval(compile(ast.Expression(last.value), "<cell>", "eval"), ns) if last is not None else None
            finally:
                sys.stdout = old
            emit(buf.getvalue())
            if value is not None:
                current.append({"output_type":"execute_result","execution_count":count,"metadata":{},"data":{"text/plain":repr(value)}})
    except Exception as exc:
        ok = False
        err = traceback.format_exc()
        current.append({"output_type":"error","ename":type(exc).__name__,"evalue":str(exc),"traceback":err.splitlines(True)})
    cell["outputs"] = current

sys.stdout.write(${JSON.stringify(SENTINEL)} + json.dumps({"ok": ok, "notebook": nb}))
sys.exit(0)
`;
}

export function parseNotebookRun(output: string): {
  ok: boolean;
  notebook?: Record<string, unknown>;
  log: string;
} {
  const at = output.lastIndexOf(SENTINEL);
  if (at < 0) return { ok: false, log: output.trim() };
  const log = output.slice(0, at).trim();
  try {
    const parsed = JSON.parse(output.slice(at + SENTINEL.length)) as {
      ok?: boolean;
      notebook?: Record<string, unknown>;
    };
    return { ok: !!parsed.ok, notebook: parsed.notebook, log };
  } catch {
    return { ok: false, log: output.trim() };
  }
}
