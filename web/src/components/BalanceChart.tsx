import type { Charge, TopUp } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";

interface Props {
  topups: TopUp[];
  charges: Charge[];
  /** Current balance — the series is anchored so its last point equals this. */
  currentBalance: number;
}

interface Pt {
  t: number;
  v: number;
}

/**
 * Reconstruct historical balance from deposits (+) and charges (−), anchored so
 * the final point matches the live balance. Drawn as an on-palette inline SVG
 * area+line chart (no charting dependency).
 */
export function BalanceChart({ topups, charges, currentBalance }: Props) {
  // Each deposit raises the balance, each charge lowers it.
  const events = [
    ...topups.map((t) => ({ t: t.createdAt, delta: t.amountAtomic })),
    ...charges.map((c) => ({ t: c.createdAt, delta: -c.amountAtomic })),
  ].sort((a, b) => a.t - b.t);

  if (events.length === 0) {
    return (
      <div className="balance-chart-empty">
        <p className="empty-title">No balance activity yet</p>
        <p className="empty-sub">Top up to start building your balance history.</p>
      </div>
    );
  }

  // balanceAfter[k] = (current - totalDelta) + cumulativeDelta up to k.
  const total = events.reduce((s, e) => s + e.delta, 0);
  const start = currentBalance - total; // balance just before the earliest event shown
  const pts: Pt[] = [{ t: events[0].t, v: start }];
  let running = start;
  for (const e of events) {
    running += e.delta;
    pts.push({ t: e.t, v: running });
  }

  // ── geometry ──────────────────────────────────────────────────────────
  // X is the change index, not wall-clock time: every balance change gets the
  // same width, so a burst of activity in one hour reads as clearly as a month
  // of idling. Tick labels carry the real timestamps.
  const W = 760;
  const H = 240;
  const pad = { l: 86, r: 18, t: 18, b: 34 };
  const tMin = pts[0].t;
  const tMax = pts[pts.length - 1].t;
  const values = pts.map((p) => p.v);
  const dataMax = Math.max(...values);
  const dataMin = Math.min(...values);
  const dataRange = dataMax - dataMin;
  const domainPad = dataRange > 0 ? dataRange * 0.12 : Math.max(Math.abs(dataMax) * 0.15, 100_000);
  const vMax = dataMax + domainPad;
  const vMin = dataMin >= 0 ? 0 : dataMin - domainPad;
  const span = vMax - vMin || 1;

  // Single-event series: hold a flat line across the width so it still reads.
  const xy = pts.length === 1 ? [pts[0], pts[0]] : pts;
  const iMax = xy.length - 1 || 1;
  const x = (i: number) => pad.l + (i / iMax) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - ((v - vMin) / span) * (H - pad.t - pad.b);

  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(iMax).toFixed(1)},${(H - pad.b).toFixed(1)} L${x(0).toFixed(1)},${(H - pad.b).toFixed(1)} Z`;
  const last = pts[pts.length - 1];
  const gridValues = [vMax, (vMax + vMin) / 2, vMin];

  // Label granularity follows the span the changes cover: hours, days, months.
  const hours = (tMax - tMin) / 3_600_000;
  const tickOpts: Intl.DateTimeFormatOptions =
    hours < 36
      ? { hour: "2-digit", minute: "2-digit" }
      : hours < 24 * 365
        ? { month: "short", day: "numeric" }
        : { month: "short", year: "numeric" };
  const fmtDate = (ms: number) => new Date(ms).toLocaleString(undefined, tickOpts);

  // Up to 4 evenly-spaced ticks over the change indices.
  const tickCount = Math.min(4, xy.length);
  const ticks = Array.from(new Set(
    Array.from({ length: tickCount }, (_, k) => Math.round((k * iMax) / Math.max(1, tickCount - 1))),
  ));

  return (
    <div className="balance-chart-content">
      <figure className="balance-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Historical balance">
          {/* Three reference lines keep the vertical scale legible at a glance. */}
          {gridValues.map((value, index) => (
            <g key={index}>
              <line className="bc-grid" x1={pad.l} y1={y(value)} x2={W - pad.r} y2={y(value)} />
              <text className="bc-vlabel" x={pad.l - 10} y={y(value) + 3} textAnchor="end">
                {formatUsdc(value)}
              </text>
            </g>
          ))}

          <path className="bc-area" d={area} />
          <path className="bc-line" d={line} />

          {/* point markers — one per balance change */}
          {xy.map((p, i) => (
            <circle key={i} className="bc-dot" cx={x(i)} cy={y(p.v)} r={2.6} />
          ))}
          {/* highlight the live balance */}
          <circle className="bc-dot bc-dot-now" cx={x(iMax)} cy={y(last.v)} r={4.5} />

          {/* time labels at the change positions */}
          {ticks.map((i) => (
            <text
              key={i}
              className="bc-tlabel"
              x={x(i)}
              y={H - 8}
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
