import type { CSSProperties } from 'react';
import logo from '../assets/logo-wide-white.png';

interface Props {
  monthLabels: string[];
}

const wrap: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
  padding: '14px 28px', background: '#003143', color: '#fff', flex: 'none',
  boxShadow: '0 2px 12px rgba(0,49,67,.25)', zIndex: 5,
};

export function Header({ monthLabels }: Props) {
  const latest = monthLabels[monthLabels.length - 1] || '—';
  const range = monthLabels.length <= 1 ? latest : `${monthLabels[0]} – ${latest}`;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
        <span style={{ fontSize: 12, color: '#a8d7c5' }}>Reporting month</span>
        <span style={{ fontSize: 13, fontWeight: 600, background: 'rgba(80,177,140,.22)', color: '#a8d7c5', padding: '5px 12px', borderRadius: 999 }}>
          {latest}
        </span>
      </div>
    </header>
  );
}
