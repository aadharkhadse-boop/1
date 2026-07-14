import { useState, type ReactNode } from 'react';

export interface KpiTileProps {
  label: string;
  value: string;
  sub: string;
  info?: string;
  active: boolean;
  accent: string;
  big?: boolean;
  inactiveValueColor?: string;
  onClick?: () => void;
}

export function KpiTile({ label, value, sub, info, active, accent, big, inactiveValueColor, onClick }: KpiTileProps) {
  const [hover, setHover] = useState(false);
  const iColor = active ? 'rgba(255,255,255,.7)' : '#8aa2a9';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? accent : '#fff',
        border: '1px solid ' + (active ? accent : (big ? '#e8b6ab' : '#cdd9dd')),
        borderRadius: 12, padding: '14px 16px',
        boxShadow: hover ? '0 6px 18px rgba(0,49,67,.12)' : (big ? '0 4px 16px rgba(194,73,62,.14)' : '0 1px 2px rgba(0,49,67,.06)'),
        transform: hover ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer',
        transition: 'box-shadow .15s,transform .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: active ? 'rgba(255,255,255,.85)' : '#5d7780', letterSpacing: '.03em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
        {info ? <InfoDot color={iColor} text={info} /> : null}
      </div>
      <div style={{ fontSize: big ? 34 : 30, fontWeight: 600, color: active ? '#fff' : (inactiveValueColor ?? accent), lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{value}</div>
      <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,.82)' : '#5d7780', lineHeight: 1.3 }}>{sub}</div>
    </div>
  );
}

export function InfoDot({ color, text, width = 210 }: { color: string; text: ReactNode; width?: number }) {
  return (
    <span
      className="kpi-i"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 15, height: 15, borderRadius: '50%', border: '1px solid ' + color, color,
        fontSize: 9.5, fontWeight: 700, fontStyle: 'italic', cursor: 'help', flex: 'none',
      }}
    >
      i
      <span
        className="kpi-info"
        style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width,
          background: '#003143', color: '#fff', fontSize: 11, fontWeight: 400, fontStyle: 'normal',
          lineHeight: 1.35, letterSpacing: 0, textTransform: 'none', padding: '8px 10px', borderRadius: 8,
          boxShadow: '0 6px 18px rgba(0,49,67,.3)',
        }}
      >
        {text}
      </span>
    </span>
  );
}
