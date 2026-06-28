/** Static documentation page — presentational only. */
export function Docs() {
  return (
    <section className="page">
      <div className="section-head">
        <p className="kicker">// MANUAL</p>
        <h2 className="display section-title">DOCS</h2>
      </div>
      <div className="rule"></div>

      <div className="prose">
        <p>
          Tendril is a prepaid marketplace for renting real machines by the hour, settled in native
          ALGO on Algorand. Top up once, rent a node, get a sandboxed SSH box, and pay only for the
          time you actually use — billed when you release.
        </p>

        <h3>1 · Connect &amp; sign in</h3>
        <p>
          Connect Pera or Defly (Algorand testnet) from the top bar, then <strong>Sign in</strong>.
          Signing a one-time login challenge proves you control the address — no funds move. It mints
          a session so only you can spend your balance.
        </p>

        <h3>2 · Top up</h3>
        <p>
          Open the wallet panel and deposit ALGO. You sign one <code>pay</code> transaction to the
          platform's custodial address; the registry confirms it on-chain and credits your prepaid
          balance. Every deposit is kept as history.
        </p>

        <h3>3 · Rent &amp; connect over SSH</h3>
        <p>
          Pick a node in <strong>Explore</strong> and hit Rent (no popup — it just checks your
          balance). You get a copyable SSH command; your <strong>wallet address is the password</strong>:
        </p>
        <pre className="cmd">ssh root@&lt;host&gt; -p &lt;port&gt;   # password = your wallet address</pre>
        <p>The sandbox is a throwaway, hardened Docker container — destroyed the moment the lease ends.</p>

        <h3>Billing</h3>
        <ul>
          <li>Nodes are priced per <strong>hour</strong> (USD), converted to ALGO at a configurable rate.</li>
          <li>Usage is tracked continuously but <strong>charged once</strong>, when you release — prorated to the exact seconds used.</li>
          <li>If your balance runs out, the session stops automatically.</li>
          <li>The contributor is paid on-chain to their address when the lease ends, minus a small platform fee.</li>
        </ul>

        <h3>Contributing compute</h3>
        <p>Run the contributor daemon on the machine you want to share — it advertises specs, proves ownership, and launches sandboxes on demand:</p>
        <pre className="cmd">AVM_PRIVATE_KEY=&lt;your-key&gt; PRICE_PER_HOUR_USD=1.0 npm run contributor</pre>
        <p>Renters reach the box through a bore tunnel that runs inside the sandbox — nothing to open on your host.</p>

        <h3>Safety</h3>
        <ul>
          <li>No host filesystem mounts, no host network, nearly all Linux capabilities dropped.</li>
          <li>Hard CPU / memory / PID caps.</li>
          <li>The container is destroyed when the lease ends — every time.</li>
        </ul>
      </div>
    </section>
  );
}
