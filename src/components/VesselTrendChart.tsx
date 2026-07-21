import { useId } from 'react';
import { spark } from '../lib/calc';

interface Props {
  series: (number | null)[];
  months: string[];
  color: string;
}

export function VesselTrendChart({ series, months, color }: Props) {
  const w = 340, h = 66;
  const sp = spark(series, w, h);
  const gradId = 'spk-' + useId().replace(/[:]/g, '');
  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: 74 }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 74, display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={sp.area} fill={`url(#${gradId})`} />
          <polyline points={sp.points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {sp.coords.map((p) => (
          <div
            key={p.i}
            className="zndot"
            style={{ position: 'absolute', left: (p.x / w * 100) + '%', top: (p.y / h * 100) + '%', width: 16, height: 16, marginLeft: -8, marginTop: -8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,49,67,.28)', cursor: 'pointer' }} />
            <div
              className="zntip"
              style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6,
                background: '#003143', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', boxShadow: '0 4px 12px rgba(0,49,67,.25)',
              }}
            >
              {months[p.i] || ''} · {series[p.i]!.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#80a1aa', marginTop: 2 }}>
        {months.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  );
}
