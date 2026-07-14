import type { CSSProperties } from 'react';
import type { Vessel } from '../types';
import { authOf, devColorEng, fmtEng, isL2 } from '../lib/engineCalc';
import { EngineTrendChart } from './EngineTrendChart';
import { useRemark } from '../hooks/useRemark';

interface Props {
  vessel: Vessel;
  onClose: () => void;
}

type Kind = 'dev' | 'boiler' | 'plain';

interface RowDef { label: string; sensor: string | null; noon: string | null; kind: Kind; }

function rowView(r: RowDef, useS: boolean) {
  const fs = fmtEng(r.sensor), fn = fmtEng(r.noon);
  const colOf = (f: { v: string; data: boolean }, authoritative: boolean): CSSProperties => {
    let color: string;
    if (!f.data) color = '#c3ccce';
    else if (!authoritative) color = '#9fb0b4';
    else if (r.kind === 'dev') color = devColorEng(parseFloat(f.v));
    else if (r.kind === 'boiler') color = parseFloat(f.v) > 0 ? '#c44a14' : '#2f7d5f';
    else color = '#003143';
    return { fontSize: 13, fontWeight: authoritative && f.data ? 700 : 500, color, fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1.1, background: authoritative ? '#eef5f3' : 'transparent', borderRadius: 5, padding: '2px 6px' };
  };
  return { label: r.label, sensor: fs.v, noon: fn.v, sensorStyle: colOf(fs, useS), noonStyle: colOf(fn, !useS) };
}

interface BlockDef {
  subLabel: string;
  bigS: string | null; bigN: string | null; kind: Kind;
  series: (number | null)[];
  rows: RowDef[];
  accent: string;
  unit: string;
}

function bigOf(c: Vessel, bigS: string | null, bigN: string | null, kind: Kind) {
  const big = authOf(c, bigS, bigN);
  const color = !big.has ? '#b8c4c7' : (kind === 'dev' ? devColorEng(big.num) : (kind === 'boiler' ? (big.num! > 0 ? '#c44a14' : '#2f7d5f') : '#003143'));
  return { bigVal: big.v, bigSub: big.has ? big.src.toLowerCase() : 'no data', bigColor: color };
}

function cleanCmt(s: string | null): string {
  if (s == null) return '';
  const t = String(s).trim();
  return /^(na|n\/a|-|—|nan|none|null)$/i.test(t) ? '' : t;
}

export function EngineDetailDrawer({ vessel: c, onClose }: Props) {
  const remark = useRemark(c.imo);
  const useS = isL2(c);

  const groups: { title: string; sub: string; accent: string; comment: string; blocks: BlockDef[] }[] = [
    {
      title: 'ME performance', sub: 'Main engine', accent: '#156e80', comment: cleanCmt(c.meCmt) || '—',
      blocks: [
        { subLabel: 'SFOC', bigS: c.meDevS, bigN: c.meDevN, kind: 'dev', series: c.meDevSeries, accent: '#156e80', unit: ' g/kWh', rows: [
          { label: 'ME load (%)', sensor: c.meLoadS, noon: c.meLoadN, kind: 'plain' },
          { label: 'ME SFOC (g/kWh)', sensor: c.meSfocS, noon: c.meSfocN, kind: 'plain' },
          { label: 'Shop trial SFOC (g/kWh)', sensor: c.meShopS, noon: c.meShopN, kind: 'plain' },
          { label: 'SFOC deviation (g/kWh)', sensor: c.meDevS, noon: c.meDevN, kind: 'dev' },
        ] },
        { subLabel: 'SCOC · cyl. oil', bigS: c.scocS, bigN: c.scocN, kind: 'plain', series: c.scocSeries, accent: '#156e80', unit: ' g/kWh', rows: [
          { label: 'ME SCOC (g/kWh)', sensor: c.scocS, noon: c.scocN, kind: 'plain' },
        ] },
      ],
    },
    {
      title: 'AE performance', sub: 'Auxiliary / generator engines', accent: '#50b18c', comment: cleanCmt(c.aeCmt) || '—',
      blocks: [
        { subLabel: '', bigS: c.axDevS, bigN: c.axDevN, kind: 'dev', accent: '#50b18c', unit: ' g/kWh',
          series: (c.aeDevSeries || []).filter((v) => v != null).length >= 2 ? c.aeDevSeries : c.aeSfocSeries,
          rows: [
            { label: 'AE load (%)', sensor: c.axLoadS, noon: c.axLoadN, kind: 'plain' },
            { label: 'GE SFOC (g/kWh)', sensor: c.axSfocS, noon: c.axSfocN, kind: 'plain' },
            { label: 'Shop trial SFOC (g/kWh)', sensor: c.axShopS, noon: c.axShopN, kind: 'plain' },
            { label: 'SFOC deviation (g/kWh)', sensor: c.axDevS, noon: c.axDevN, kind: 'dev' },
          ] },
      ],
    },
    {
      title: 'Boiler performance', sub: 'Auxiliary boiler', accent: '#b88a00', comment: cleanCmt(c.boCmt) || '—',
      blocks: [
        { subLabel: '', bigS: c.boilS, bigN: c.boilN, kind: 'boiler', series: c.boilSeries, accent: '#b88a00', unit: ' t',
          rows: [{ label: 'Excess consumption (t)', sensor: c.boilS, noon: c.boilN, kind: 'boiler' }] },
      ],
    },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,49,67,.4)', zIndex: 40, animation: 'znfade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 560, maxWidth: '94vw', background: '#fff', boxShadow: '-12px 0 40px rgba(0,49,67,.22)', display: 'flex', flexDirection: 'column', animation: 'znslide .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e1e8e9', flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#156e80', background: '#deefe9', padding: '3px 9px', borderRadius: 999 }}>Machinery performance</span>
                <span style={{ background: '#eef2f2', color: '#2a4a55', fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999, letterSpacing: '.02em' }}>{c.level ? 'Level : ' + c.level : 'Level : —'}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#003143', marginTop: 8, lineHeight: 1.1 }}>{c.vessel}</div>
              <div style={{ fontSize: 13, color: '#5d7780', marginTop: 2 }}>{c.owner} · IMO {c.imo}</div>
            </div>
            <button onClick={onClose} className="zn-close-hover" style={{ border: 'none', background: '#eef2f2', color: '#003143', width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', flex: 'none', lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map((g) => {
            const split = g.blocks.length > 1;
            const head = g.blocks[0];
            const headBig = bigOf(c, head.bigS, head.bigN, head.kind);
            return (
              <div key={g.title} style={{ background: '#fff', border: '1px solid #cdd9dd', borderTop: '3px solid ' + g.accent, borderRadius: 10, boxShadow: '0 1px 2px rgba(0,49,67,.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 13px', background: '#f7faf9', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: g.accent, flex: 'none', display: 'inline-block' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#003143', lineHeight: 1.1 }}>{g.title}</div>
                      <div style={{ fontSize: 10, color: '#80a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.sub}</div>
                    </div>
                  </div>
                  {!split ? (
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div style={{ fontSize: 22, fontWeight: 600, color: headBig.bigColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{headBig.bigVal}</div>
                      <div style={{ fontSize: 8.5, color: '#80a1aa', textTransform: 'uppercase', letterSpacing: '.04em' }}>{headBig.bigSub}</div>
                    </div>
                  ) : null}
                </div>
                {g.blocks.map((b, bi) => {
                  const big = bigOf(c, b.bigS, b.bigN, b.kind);
                  return (
                    <div key={bi}>
                      {b.subLabel ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 13px', borderTop: '1px solid #eef2f2', background: '#fbfdfc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: b.accent, flex: 'none', display: 'inline-block' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2a4a55', letterSpacing: '.05em', textTransform: 'uppercase' }}>{b.subLabel}</span>
                          </div>
                          <div style={{ textAlign: 'right', flex: 'none' }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: big.bigColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{big.bigVal}</div>
                            <div style={{ fontSize: 8.5, color: '#80a1aa', textTransform: 'uppercase', letterSpacing: '.04em' }}>{big.bigSub}</div>
                          </div>
                        </div>
                      ) : null}
                      <EngineTrendChart series={b.series} color={b.accent} unit={b.unit} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px 74px', gap: 8, padding: '6px 13px', background: '#fff', fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase', color: '#80a1aa', fontWeight: 600, borderTop: '1px solid #f0f3f3' }}>
                        <div>Parameter</div>
                        <div style={{ textAlign: 'right', color: useS ? '#156e80' : '#80a1aa', fontWeight: useS ? 700 : 600 }}>Sensor</div>
                        <div style={{ textAlign: 'right', color: useS ? '#80a1aa' : '#156e80', fontWeight: useS ? 600 : 700 }}>Noon</div>
                      </div>
                      {b.rows.map((r, ri) => {
                        const rv = rowView(r, useS);
                        return (
                          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px 74px', gap: 8, alignItems: 'center', padding: '7px 13px', borderTop: '1px solid #f0f3f3' }}>
                            <div style={{ fontSize: 12, color: '#2a4a55' }}>{rv.label}</div>
                            <div style={rv.sensorStyle}>{rv.sensor}</div>
                            <div style={rv.noonStyle}>{rv.noon}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div style={{ padding: '11px 13px 13px', borderTop: '1px solid #eef2f2', background: '#fbfdfc' }}>
                  <div style={{ fontSize: 10, color: g.accent, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 5 }}>Analyst notes &amp; recommendation</div>
                  <div style={{ fontSize: 12.5, color: '#2a4a55', lineHeight: 1.5 }}>{g.comment}</div>
                </div>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid #e1e8e9', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: '#156e80', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}>Remarks</div>
            <textarea
              value={remark.value}
              onChange={(e) => remark.onChange(e.target.value)}
              placeholder="Add a remark for this vessel — observations, actions taken, follow-ups…"
              style={{ width: '100%', minHeight: 90, resize: 'vertical', border: '1px solid #cdd9dd', borderRadius: 10, padding: '11px 13px', font: 'inherit', fontSize: 13, color: '#003143', lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              {remark.saved ? <span style={{ fontSize: 12, color: '#2f7d5f', fontWeight: 600 }}>✓ Saved</span> : null}
              <button onClick={remark.onSave} className="zn-btn-primary" style={{ border: 'none', background: '#156e80', color: '#fff', font: 'inherit', fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 999, cursor: 'pointer' }}>Save remark</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
