import { useEffect, useMemo, useState } from "react";
import type { MetricPoint, Metrics as MetricsData, RankRow } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import { fetchMetrics } from "../api";

const shortAddr = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

function fmtDur(seconds: number): string {
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
// Inline SVG (same approach as BalanceChart — no charting dependency).

function LineCard({ title, series, now }: { title: string; series: MetricPoint[]; now: number }) {
  const W = 900;
  const H = 240;
  const pad = { l: 12, r: 12, t: 20, b: 34 };

  if (series.length === 0) {
    return (
      <div className="panel chart-card">
        <div className="chart-head">
          <h3>{title}</h3>
          <span className="metric-big">0</span>
        </div>
        <p className="muted small">No data yet.</p>
      </div>
    );
  }

  // X is the change index, not wall-clock time (same as BalanceChart): every
  // step gets the same width, so a day of signups reads as clearly as a year.
  // Single point holds a flat line across the width so it still reads.
  const xy = series.length === 1 ? [series[0], series[0]] : series;
  const vMax = Math.max(...xy.map((p) => p.count), 1);
  const top = vMax * 1.15; // headroom so the line doesn't glue to the top edge
  const iMax = xy.length - 1 || 1;
  const x = (i: number) => pad.l + (i / iMax) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / top) * (H - pad.t - pad.b);

  const line = xy
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(iMax).toFixed(1)},${H - pad.b} L${x(0).toFixed(1)},${H - pad.b} Z`;
  const last = xy[xy.length - 1];

  // Label granularity follows the span the changes cover: hours, days, months.
  const hours = (xy[xy.length - 1].t - xy[0].t) / 3_600_000;
  const tickOpts: Intl.DateTimeFormatOptions =
    hours < 36
      ? { hour: "2-digit", minute: "2-digit" }
      : hours < 24 * 365
        ? { month: "short", day: "numeric" }
        : { month: "short", year: "numeric" };
  const fmtDate = (ms: number) => new Date(ms).toLocaleString(undefined, tickOpts);

  // Up to 4 evenly-spaced ticks over the change indices.
  const tickCount = Math.min(4, xy.length);
  const ticks = Array.from(
    new Set(
      Array.from({ length: tickCount }, (_, k) => Math.round((k * iMax) / Math.max(1, tickCount - 1))),
    ),
  );

  return (
    <div className="panel chart-card">
      <div className="chart-head">
        <h3>{title}</h3>
        <span className="metric-big">{now}</span>
      </div>
      <figure className="balance-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          <line className="bc-grid" x1={pad.l} y1={y(vMax)} x2={W - pad.r} y2={y(vMax)} />
          <path className="bc-area" d={area} />
          <path className="bc-line" d={line} />
          {/* one marker per change */}
          {series.length > 1 &&
            xy.map((p, i) => <circle key={i} className="bc-dot" cx={x(i)} cy={y(p.count)} r={3} />)}
          <circle className="bc-dot bc-dot-now" cx={x(iMax)} cy={y(last.count)} r={5} />
          <text className="bc-vlabel" x={pad.l} y={y(vMax) - 7}>{vMax}</text>
          {ticks.map((i) => (
            <text
              key={i}
              className="bc-tlabel"
              x={x(i)}
              y={H - 10}
              textAnchor={i === 0 ? "start" : i === iMax ? "end" : "middle"}
            >
              {fmtDate(xy[i].t)}
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
