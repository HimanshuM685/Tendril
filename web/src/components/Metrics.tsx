import { useEffect, useMemo, useState } from "react";
import type { MetricPoint, Metrics as MetricsData, RankRow } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import { fetchMetrics } from "../api";

const shortAddr = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

function fmtUsdc(atomic: unknown): string {
  const n = Number(atomic);
  return formatUsdc(Number.isFinite(n) ? n : 0);
}
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function Metrics() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics()
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading metrics…</p>;

  return (
    <section className="metrics">
      <h2 className="metrics-title">
        <span className="metrics-kicker">// PLATFORM</span>
        METRICS
      </h2>

      <div className="stat-grid">
        <div className="stat">
          <p className="muted small">Total top-up</p>
          <p className="metric-big">{fmtUsdc(data.totalTopupAtomic)}</p>
        </div>
        <div className="stat">
          <p className="muted small">Total spend</p>
          <p className="metric-big">{fmtUsdc(data.totalSpendAtomic)}</p>
        </div>
      </div>

      <LineCard title="Users over time" series={data.usersOverTime} now={data.totalUsers} />

      <Board
        title="Top users"
        tabs={[
          { label: "Top-up amount", rows: data.topUsers.topup, fmt: (v) => formatUsdc(v) },
          { label: "Lease time", rows: data.topUsers.leaseTime, fmt: fmtDur },
          { label: "Lease span", rows: data.topUsers.leaseSpan, fmt: (v) => `${v} leases` },
        ]}
      />

      <Board
        title="Top contributors"
        tabs={[
          { label: "Time served", rows: data.topContributors.timeServed, fmt: fmtDur },
          { label: "Times served", rows: data.topContributors.timesServed, fmt: (v) => `${v}×` },
        ]}
      />
    </section>
  );
}

// ─────────────────────────── line chart ───────────────────────────
// Inline SVG. X is wall-clock time so gaps between events are real.

type ChartRange = "all" | "month";

function monthStartMs(now: number): number {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Window a cumulative series onto [t0, t1], carrying the last count before t0. */
function windowSeries(
  series: MetricPoint[],
  range: ChartRange,
  nowMs: number,
): { plot: MetricPoint[]; events: MetricPoint[]; t0: number; t1: number } {
  const t1 = nowMs;
  const t0 = range === "month" ? monthStartMs(nowMs) : (series[0]?.t ?? nowMs);

  let carry = 0;
  const events: MetricPoint[] = [];
  for (const p of series) {
    if (p.t < t0) carry = p.count;
    else if (p.t <= t1) events.push(p);
  }

  const plot: MetricPoint[] = [{ t: t0, count: carry }, ...events];
  const last = plot[plot.length - 1];
  if (last.t < t1) plot.push({ t: t1, count: last.count });
  return { plot, events, t0, t1 };
}

function LineCard({ title, series, now }: { title: string; series: MetricPoint[]; now: number }) {
  const W = 900;
  const H = 240;
  const pad = { l: 12, r: 12, t: 20, b: 34 };
  const [range, setRange] = useState<ChartRange>("all");
  const nowMs = Date.now();
  const { plot, events, t0, t1 } = windowSeries(series, range, nowMs);

  const tabs = (
    <div className="board-tabs chart-range">
      {(["all", "month"] as const).map((r) => (
        <button
          key={r}
          type="button"
          className={range === r ? "board-tab active" : "board-tab"}
          onClick={() => setRange(r)}
        >
          {r === "all" ? "All time" : "This month"}
        </button>
      ))}
    </div>
  );

  if (series.length === 0) {
    return (
      <div className="panel chart-card">
        <div className="chart-head">
          <h3>{title}</h3>
          <span className="metric-big">0</span>
        </div>
        {tabs}
        <p className="muted small">No data yet.</p>
      </div>
    );
  }

  const vMax = Math.max(...plot.map((p) => p.count), 1);
  const top = vMax * 1.15;
  const span = Math.max(t1 - t0, 1);
  const x = (t: number) => pad.l + ((t - t0) / span) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / top) * (H - pad.t - pad.b);

  const step = plot
    .map((p, i) =>
      i === 0
        ? `M${x(p.t).toFixed(1)},${y(p.count).toFixed(1)}`
        : `H${x(p.t).toFixed(1)} L${x(p.t).toFixed(1)},${y(p.count).toFixed(1)}`,
    )
    .join(" ");
  const last = plot[plot.length - 1];
  const area = `${step} L${x(last.t).toFixed(1)},${H - pad.b} L${x(plot[0].t).toFixed(1)},${H - pad.b} Z`;

  const hours = span / 3_600_000;
  const tickOpts: Intl.DateTimeFormatOptions =
    hours < 36
      ? { hour: "2-digit", minute: "2-digit" }
      : hours < 24 * 40
        ? { month: "short", day: "numeric" }
        : { month: "short", year: "numeric" };
  const fmtDate = (ms: number) => new Date(ms).toLocaleString(undefined, tickOpts);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }, (_, k) => t0 + (k * span) / (tickCount - 1));

  return (
    <div className="panel chart-card">
      <div className="chart-head">
        <h3>{title}</h3>
        <span className="metric-big">{now}</span>
      </div>
      {tabs}
      <figure className="balance-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          <line className="bc-grid" x1={pad.l} y1={y(vMax)} x2={W - pad.r} y2={y(vMax)} />
          <path className="bc-area" d={area} />
          <path className="bc-line" d={step} />
          {events.map((p, i) => (
            <circle key={`${p.t}-${i}`} className="bc-dot" cx={x(p.t)} cy={y(p.count)} r={3} />
          ))}
          <circle className="bc-dot bc-dot-now" cx={x(last.t)} cy={y(last.count)} r={5} />
          <text className="bc-vlabel" x={pad.l} y={y(vMax) - 7}>{vMax}</text>
          {ticks.map((t, i) => (
            <text
              key={t}
              className="bc-tlabel"
              x={x(t)}
              y={H - 10}
              textAnchor={i === 0 ? "start" : i === tickCount - 1 ? "end" : "middle"}
            >
              {fmtDate(t)}
            </text>
          ))}
        </svg>
      </figure>
    </div>
  );
}

// ─────────────────────────── leaderboard ───────────────────────────

interface BoardTab {
  label: string;
  rows: RankRow[];
  fmt: (v: number) => string;
}

function Board({ title, tabs }: { title: string; tabs: BoardTab[] }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const max = useMemo(() => Math.max(...tab.rows.map((r) => r.value), 1), [tab]);

  return (
    <div className="panel board-card">
      <h3>{title}</h3>
      <div className="board-tabs">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            className={i === active ? "board-tab active" : "board-tab"}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab.rows.length === 0 ? (
        <p className="muted small">No entries yet.</p>
      ) : (
        <ol className="board-list">
          {tab.rows.map((r, i) => (
            <li key={r.address} className="board-row">
              <span className="board-rank">{i + 1}</span>
              <span className="board-addr">{shortAddr(r.address)}</span>
              <span className="board-bar">
                <span className="board-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
              <span className="board-val">{tab.fmt(r.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
