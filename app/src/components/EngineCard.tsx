import { useState } from 'react';
import type { Vessel } from '../types';
import { authOf, devColorEng, isL1, isL2 } from '../lib/engineCalc';
import type { SaFilterKey } from './SmartAnalyticsTab';

interface Props {
  vessel: Vessel;
  filter: SaFilterKey;
  onClick: () => void;
}

const HERO_MAP: Record<Exclude<SaFilterKey, 'all'>, { k: 'sfocDev' | 'auxDev' | 'boiler' | 'scoc'; lbl: string }> = {
  me: { k: 'sfocDev', lbl: 'ME SFOC deviation' },
  aux: { k: 'auxDev', lbl: 'Aux GE SFOC deviation' },
  boiler: { k: 'boiler', lbl: 'Boiler excess (t)' },
  scoc: { k: 'scoc', lbl: 'ME SCOC (g/kWh)' },
};

export function EngineCard({ vessel: c, filter, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const L2 = isL2(c), L1 = isL1(c);
  const sfocDev = authOf(c, c.meDevS, c.meDevN);
  const meSfoc = authOf(c, c.meSfocS, c.meSfocN);
  const auxDev = authOf(c, c.axDevS, c.axDevN);
  const scoc = authOf(c, c.scocS, c.scocN);
  const boiler = authOf(c, c.boilS, c.boilN);

  const hero = HERO_MAP[filter as Exclude<SaFilterKey, 'all'>] ?? HERO_MAP.me;
  const h = { sfocDev, auxDev, boiler, scoc }[hero.k];
  const heroColor = hero.k === 'boiler' ? (boiler.num! > 0 ? '#c44a14' : '#2a4a55') : (hero.k === 'scoc' ? devColorEng(sfocDev.num) : devColorEng(h.num));
  const stripe = (hero.k === 'sfocDev' || hero.k === 'auxDev') ? devColorEng(h.num) : devColorEng(sfocDev.num);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff', border: '1px solid #e1e8e9', borderLeft: '4px solid ' + stripe, borderRadius: 12,
        padding: '14px 15px', cursor: 'pointer',
        boxShadow: hover ? '0 10px 28px rgba(0,49,67,.15)' : '0 1px 2px rgba(0,49,67,.05)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow .18s,transform .18s', display: 'flex', flexDirection: 'column', gap: 11,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#003143', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.vessel}</div>
          <div style={{ fontSize: 11.5, color: '#5d7780', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.owner} · IMO {c.imo}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: L2 ? '#deefe9' : '#eef2f2', color: L2 ? '#2f7d5f' : '#5d7780', whiteSpace: 'nowrap', flex: 'none', letterSpacing: '.02em' }}>
          {L2 ? 'L2' : (L1 ? 'L1' : '—')}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 600, color: heroColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{h.v}</div>
        <div style={{ fontSize: 10.5, color: '#80a1aa', letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>{hero.lbl} · {h.src}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', borderTop: '1px solid #f0f3f3', paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>ME SFOC (g/kWh)</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a4a55', lineHeight: 1.2 }}>{meSfoc.v}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Aux GE SFOC dev</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: devColorEng(auxDev.num), lineHeight: 1.2 }}>{auxDev.v}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>ME SCOC (g/kWh)</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2a4a55', lineHeight: 1.2 }}>{scoc.v}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#80a1aa', letterSpacing: '.03em', textTransform: 'uppercase' }}>Boiler excess (t)</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: boiler.num! > 0 ? '#c44a14' : '#2a4a55', lineHeight: 1.2 }}>{boiler.v}</div>
        </div>
      </div>
    </div>
  );
}
