import { ArchDiagram } from "./ArchDiagram";

/** Static documentation page — presentational only. */
export function Docs() {
  return (
    <section className="page">
      <div className="section-head">
        <p className="kicker">// MANUAL</p>
        <h2 className="display section-title">DOCS</h2>
      </div>
      <div className="rule"></div>

      <div className="prose panel">
        <p>
          Tendril rents real machines by the second, paid in <strong>USDC over x402</strong> on
          Algorand. Top up once, then either rent a box and SSH into it, or skip renting entirely and
          throw a script at <code>POST /x402/run</code>. You pay for the seconds you actually use,
          billed at the end — never for a block of time you booked and didn't need.
        </p>
        <p className="muted small">
          The facilitator sponsors the network fee, so a payer needs USDC and <strong>zero ALGO</strong>.
        </p>

        <h3>Architecture</h3>
        <p>
          Three independent pieces talk to one central registry. A <strong>consumer</strong> (a person
          in this UI, or a headless agent) tops up and rents. The <strong>registry</strong> holds the
          off-chain balance ledger in Neon, verifies payments through the x402 facilitator and pays
          out on Algorand, and brokers leases to <strong>contributors</strong> over a WebSocket. The
          rented box itself is reached directly — the renter's SSH traffic rides a bore tunnel
          straight into the sandbox.
        </p>

        <ArchDiagram />

        <h3>1 · Connect &amp; sign in</h3>
        <p>
          Connect Pera or Defly from the top bar, then <strong>Sign in</strong>. Signing a one-time
          login challenge proves you control the address — no funds move. It mints a session so only
          you can spend your balance.
        </p>

        <h3>2 · Top up</h3>
        <p>
          Open the wallet panel and deposit any amount of USDC. You sign one x402 payment to the
          platform address; the facilitator settles it and the registry credits your prepaid balance.
          Crediting is idempotent per transaction id — a deposit can never be counted twice. Every
          deposit is kept as history.
        </p>

        <h3>3 · Rent &amp; connect over SSH</h3>
        <p>
          Pick a node in <strong>Explore</strong> and hit Rent. You pay a small flat{" "}
          <strong>gate fee</strong> (0.01 USDC) that opens the session; that is the only thing that
          goes on-chain up front. The session then runs open-ended for as long as your credit covers
          the node's hourly rate. You get a copyable SSH command; your{" "}
          <strong>wallet address is the password</strong> unless you hand over a public key:
        </p>
        <pre className="cmd">ssh root@&lt;host&gt; -p &lt;port&gt;   # password = your wallet address</pre>
        <p>
          The host and port resolve through a bore tunnel that runs inside the sandbox, so the
          contributor never opens a port on their own host. The sandbox is a throwaway, hardened
          Docker container — destroyed the moment the lease ends.
        </p>

        <h3>Or: run one job, no lease</h3>
        <p>
          Renting is overkill for a single script. <code>POST /x402/run</code> takes Python, finds the
          best-value idle machine, runs it in a throwaway sandbox, hands back stdout and destroys the
          box. No node to choose, nothing to release.
        </p>
        <pre className="cmd">{`curl -X POST $API/x402/run -H 'content-type: application/json' \\
  -d '{"payload":"print(sum(range(100)))"}'`}</pre>
        <p>
          <strong>Best value, not cheapest.</strong> Nodes are scored{" "}
          <code>(cores + RAM_GB / 4) / pricePerHourUsd</code>, highest first. A machine at half the
          rate that takes three times as long is not a saving, and you have no way to see that
          happen.
        </p>

        <h3>Billing</h3>
        <ul>
          <li>Nodes are priced per <strong>hour</strong> in USD. USDC is a dollar, so there is no exchange rate anywhere.</li>
          <li>
            Usage is metered continuously but <strong>charged once</strong>, when the lease closes —
            prorated to the exact seconds used.
          </li>
          <li>
            <strong>Run out mid-session and you get a grace window</strong> — one dollar of runtime at
            your own node's rate, so it is the same goodwill on a cheap box as an expensive one. Save
            your work; then the sandbox is destroyed. The platform absorbs it.
          </li>
          <li>
            A one-shot <code>/x402/run</code> is never killed part-way, so it can take you{" "}
            <strong>negative</strong>: 0.50 USDC of credit against a 0.60 job finishes, and you owe
            0.10. A negative balance blocks renting until you top up by at least what you owe.
          </li>
          <li>The contributor is paid on-chain in USDC when the lease ends, minus a small platform fee.</li>
        </ul>

        <h3>For agents — the three endpoints</h3>
        <p>The whole flow is reachable headlessly; a bot only needs these:</p>
        <ul>
          <li><code>GET /explorer</code> — free, so an agent can survey live nodes (specs + price) and choose for itself.</li>
          <li>
            <code>POST /x402/rent?nodeId=…</code> — opens a metered session, billed once at release.
          </li>
          <li>
            <code>POST /x402/run</code> — one job, no lease, no setup. Tendril picks the machine.
          </li>
        </ul>
        <p className="muted small">
          Full request/response shapes, error codes and copy-paste curl live on the <strong>API</strong> page.
        </p>

        <h3>Contributing compute</h3>
        <p>
          Mint an API key on the <strong>Contribute</strong> page, then run the daemon on the machine
          you want to share — it advertises specs, heartbeats, and launches sandboxes on demand:
        </p>
        <pre className="cmd">TENDRIL_API_KEY=&lt;your-key&gt; PRICE_PER_HOUR_USD=1.0 npm run contributor</pre>
        <p>
          The machine holds no wallet key: the wallet that minted the API key owns the node and
          collects its earnings. Renters reach the box through a bore tunnel that runs inside the
          sandbox — nothing to open on your host.
        </p>

        <h3>Safety</h3>
        <ul>
          <li>No host filesystem mounts, no host network, nearly all Linux capabilities dropped.</li>
          <li>Hard CPU / memory / PID caps.</li>
          <li>The container is destroyed when the lease ends — every time.</li>
        </ul>

        <h3>Notes &amp; limits</h3>
        <ul>
          <li>
            <strong>Custodial:</strong> top-ups pool at one platform address and balances live as an
            off-chain ledger in Neon. Renter credit has no withdrawal path — it is spent on compute.
            Contributor earnings do: withdraw them to your wallet, $5 minimum.
          </li>
          <li>
            <strong>Metering granularity:</strong> charges land at close; a depleted balance is caught
            on the next watchdog tick, so worst-case over-use is one tick of compute.
          </li>
          <li>
            <strong>One job is capped</strong> at <code>RUN_TIMEOUT_MS</code> (120s by default), which
            is also the cap on how far a single run can overdraw you.
          </li>
        </ul>
      </div>
    </section>
  );
}
