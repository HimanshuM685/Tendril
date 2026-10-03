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

## Machine selection

Available hardware is ranked by useful CPU and RAM capacity relative to its hourly price. A slower machine with a lower advertised rate is not necessarily the cheapest way to complete a job.

See [Best-Value Scoring](/docs/build#best-value) for the formula.

## Sandbox lifetime

One-shot sandboxes are disposable. Return or collect the artifacts you need before teardown. For longer interactive work, use [a metered SSH lease](/docs/guides-access/ssh-access-keys).
