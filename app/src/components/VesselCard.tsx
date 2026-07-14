import { useState } from 'react';
import type { VesselWithTier } from '../types';
import { TIER, devColor, fmtDev, fmtPct, fmtStw } from '../lib/calc';
import { MiniSpark } from './MiniSpark';

interface Props {
  vessel: VesselWithTier;
  onClick: () => void;
}

export function VesselCard({ vessel: c, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const T = TIER[c.tier];
  const cL2 = /l2/i.test(String(c.level || ''));
  const cL1 = /l1/i.test(String(c.level || ''));
  const hasLevel = cL2 || cL1;
  const epSrcShort = c.epSource === 'Hindcast sensor' ? 'sensor' : (c.epSource === 'Hindcast noon' ? 'noon' : '—');

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff', border: '1px solid #e1e8e9', borderLeft: '4px solid ' + T.c, borderRadius: 12,
        padding: '14px 15px', cursor: 'pointer',
        boxShadow: hover ? '0 10px 28px rgba(0,49,67,.15)' : '0 1px 2px rgba(0,49,67,.05)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow .18s,transform .18s', display: 'flex', flexDirection: 'column', gap: 11,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#003143', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.vessel}</div>
            {hasLevel ? (
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: cL2 ? '#deefe9' : '#eef2f2', color: cL2 ? '#2f7d5f' : '#5d7780', whiteSpace: 'nowrap', flex: 'none', letterSpacing: '.03em' }}>
                {cL2 ? 'L2' : 'L1'}
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 11.5, color: '#5d7780', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.owner} · IMO {c.imo}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flex: 'none' }}>
          <span style={{ background: T.soft, color: T.txt, fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '.02em', textTransform: 'uppercase' }}>{T.label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: T.c, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{fmtPct(c.ep)}</div>
          <div style={{ fontSize: 10.5, color: '#80a1aa', letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>ME excess power · {epSrcShort}</div>
        </div>
        <MiniSpark series={c.series} color={T.c} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', borderTop: '1px solid #f0f3f3', paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Δ since 6 months</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: devColor(c.dev6m), lineHeight: 1.2 }}>{c.dev6m == null ? 'N/A' : fmtDev(c.dev6m)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Δ since last hull activity</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: devColor(c.devAct), lineHeight: 1.2 }}>{c.devAct == null ? 'N/A' : fmtDev(c.devAct)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Hindcast−log STW deviation</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a4a55', lineHeight: 1.2 }}>{fmtStw(c.stwDev)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Vessel age</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a4a55', lineHeight: 1.2 }}>{c.age == null ? '—' : c.age + ' yr'}</div>
        </div>
      </div>
    </div>
  );
}
