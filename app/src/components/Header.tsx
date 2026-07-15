import type { CSSProperties } from 'react';
import logo from '../assets/logo-wide-white.png';

// Injected by Vite at build time (see vite.config.ts) — ISO 8601 UTC string of the build/deploy time.
declare const __BUILD_DATE__: string;

interface Props {
  monthLabels: string[];
}

const wrap: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
  padding: '14px 28px', background: '#003143', color: '#fff', flex: 'none',
  boxShadow: '0 2px 12px rgba(0,49,67,.25)', zIndex: 5,
};

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Rendered in the viewer's local timezone (the system the link is opened on).
// __BUILD_DATE__ is a UTC ISO string; the local getters below convert it.
function formatBuildDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  let tz = '';
  try {
    const part = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(d)
      .find((x) => x.type === 'timeZoneName');
    if (part) tz = ' ' + part.value;
  } catch { /* ignore */ }
  return `${p(d.getDate())} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}${tz}`;
}

export function Header({ monthLabels }: Props) {
  const latest = monthLabels[monthLabels.length - 1] || '—';
  const range = monthLabels.length <= 1 ? latest : `${monthLabels[0]} – ${latest}`;
  const updated = formatBuildDate(__BUILD_DATE__);
  return (
    <header style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
        <img src={logo} alt="ZeroNorth" style={{ height: 26, width: 'auto', display: 'block', flex: 'none' }} />
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.22)', flex: 'none' }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.1 }}>Fleet performance monitoring : CMA CGM</div>
          <div style={{ fontSize: 12, color: '#a8d7c5', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ME excess power · Speed · hull activity · Machinery Performance [ {range} ]
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#a8d7c5' }}>Reporting month</span>
          <span style={{ fontSize: 13, fontWeight: 600, background: 'rgba(80,177,140,.22)', color: '#a8d7c5', padding: '5px 12px', borderRadius: 999 }}>
            {latest}
          </span>
        </div>
        {updated ? (
          <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
            <div style={{ fontSize: 10, color: '#7fa6b0', letterSpacing: '.05em', textTransform: 'uppercase' }}>Last updated</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a8d7c5', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{updated}</div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
