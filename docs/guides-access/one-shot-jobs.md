# One-shot Jobs

`POST /x402/run` executes a script without an interactive SSH lease. Tendril selects the best-value idle machine, runs the workload in a disposable sandbox, returns its result, and tears down the container.

## Request a quote

A plain request shows the x402 payment challenge:

```bash
curl -X POST "$API/x402/run" \
  -H 'content-type: application/json' \
  -d '{"payload":"print(sum(range(100)))"}'
```

An unpaid request returns `402`, not execution output. Use an x402 signer to retry with the quoted payment or use [MCP tools](/docs/build/mcp).

## Execute & collect output

After successful payment verification, the registry dispatches the job to a contributor. Read the endpoint's response and polling instructions to collect stdout, stderr, and exit status.

The full request schema, timeouts, and error responses are in [POST /x402/run](/docs/api/x402#post-x402run).

## Notebook jobs

Upload a Python nbformat 4 `.ipynb` in Explore, or send `{ "notebook": <notebook>, "lane": "contributor" }`.
Choose `"priority"` for Modal CPU. Both use a real IPython kernel, including `%pip`, shell/cell magics,
top-level `await`, inline plots, and process pools. Standard images include NumPy, pandas, matplotlib,
SciPy, scikit-learn, Pillow, requests, and psutil; custom images must provide their own dependencies.

The paid POST returns `jobId` and `jobToken`. Poll `GET /x402/run/:id` with
`Authorization: Bearer <jobToken>` until `run` or `error` arrives. An `ended`/`failed` status alone can
precede the result. Outputs and small files are displayed for successful and failed executions.

Limits: 1.5 MB upload, 500 cells, 2 MB cell output, 4 MB artifacts **total**, and 12 MB transport.
Execution stops at `RUN_TIMEOUT_MS` (default 120 seconds; at most 15 minutes) or the prepaid budget,
whichever is shorter. One notebook can use a payer's credit at a time; release active sessions first.
Syntax preflight reports bad indentation without rewriting source. Runtime failures keep earlier
outputs when possible; hard timeout or sandbox failure can prevent partial-result collection.

Write downloadable files under `/work`. Hidden paths, symlinks, special files, and files exceeding
the artifact budget are skipped. Results are ephemeral: download within one hour, and sooner under
cache pressure (32 jobs or 64 MB total). Evicted jobs return `404`.

The gate fee settles before provisioning; a later startup failure does not undo it. Execution time
is billed only after readiness, including failed executed cells. Use
`example-buyer/notebooks/tendril_benchmark.ipynb` in the repository for a bounded scientific Python example.

## Machine selection

Available hardware is ranked by useful CPU and RAM capacity relative to its hourly price. A slower machine with a lower advertised rate is not necessarily the cheapest way to complete a job.

See [Best-Value Scoring](/docs/build#best-value) for the formula.

## Sandbox lifetime

One-shot sandboxes are disposable. Return or collect the artifacts you need before teardown. For longer interactive work, use [a metered SSH lease](/docs/guides-access/ssh-access-keys).
