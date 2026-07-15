import { useId } from 'react';
import { spark } from '../lib/calc';

interface Props {
  series: (number | null)[];
  months: string[];
  color: string;
  unit: string; // e.g. ' g/kWh' or ' t'
}

export function EngineTrendChart({ series, months, color, unit }: Props) {
  const w = 300, h = 42;
  const present = series.filter((v) => v != null);
  if (present.length < 2) return null;
  const sp = spark(series, w, h);
  const gradId = 'espk-' + useId().replace(/[:]/g, '');
  const monthLabels = months.slice(0, series.length);

  return (
    <div style={{ padding: '9px 13px 5px', borderTop: '1px solid #f0f3f3' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9.5, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Trend · past {present.length} months</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={color} stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path d={sp.area} fill={color} fillOpacity={0.12} />
          <polyline points={sp.points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {sp.coords.map((p, ci, arr) => {
          const edge = ci === 0 ? 'first' : (ci === arr.length - 1 ? 'last' : 'mid');
          const tip = edge === 'first' ? { left: 0 } : edge === 'last' ? { right: 0, left: 'auto' as const } : { left: '50%', transform: 'translateX(-50%)' };
          return (
            <div
              key={p.i}
              className="zndot"
              style={{ position: 'absolute', left: (p.x / w * 100) + '%', top: (p.y / h * 100) + '%', width: 18, height: 18, marginLeft: -9, marginTop: -9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,49,67,.28)', cursor: 'pointer' }} />
              <div
                className="zntip"
                style={{
                  position: 'absolute', bottom: '100%', marginBottom: 6,
                  background: '#003143', color: '#fff', fontSize: 10.5, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                  whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', boxShadow: '0 4px 12px rgba(0,49,67,.25)',
                  ...tip,
                }}
              >
                {(months[p.i] || '')} · {series[p.i]!.toFixed(1)}{unit}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#80a1aa', marginTop: 1 }}>
        {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  );
}
