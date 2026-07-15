import type { CSSProperties } from 'react';
import type { VesselWithTier } from '../types';
import { TIER, fmtDev, fmtPct, fmtStw, monthsTxt } from '../lib/calc';
import { VesselTrendChart } from './VesselTrendChart';
import { useRemark } from '../hooks/useRemark';

interface Props {
  vessel: VesselWithTier;
  onClose: () => void;
}

const devClr = (v: number | null) => (v == null ? '#5d7780' : (v > 10 ? '#c44a14' : (v < -10 ? '#2f7d5f' : '#2a4a55')));
const devBoxBg = (v: number | null): CSSProperties => ({
  background: v == null ? '#eef2f2' : (v > 10 ? '#fde2d6' : (v < -10 ? '#deefe9' : '#f7faf9')),
  borderRadius: 10, padding: '12px 14px',
});
const dirWord = (v: number) => (v > 0 ? 'higher' : (v < 0 ? 'lower' : 'unchanged'));
const actColor = (v: number | null) => (v == null ? '#c44a14' : (v > 18 ? '#c44a14' : (v > 12 ? '#b88a00' : '#003143')));

export function VesselDetailDrawer({ vessel: c, onClose }: Props) {
  const T = TIER[c.tier];
  const remark = useRemark(c.imo);

  const epRowsDef: [string, number | null][] = [['Hindcast (L2)', c.epSensor], ['Hindcast (L1)', c.epNoon], ['AI Model (L2)', c.ai]];
  const present = epRowsDef.filter((r): r is [string, number] => r[1] != null);
  const maxV = Math.max(1, ...present.map((r) => Math.abs(r[1])));

  let exp6: string;
  if (c.dev6m == null) exp6 = 'Not enough monthly data in the window to measure a 6-month change.';
  else exp6 = `Excess power is ${Math.abs(c.dev6m).toFixed(1)}% ${dirWord(c.dev6m)} than ${c.refMonth6}, the earliest reading in the window.`;

  let expAct: string;
  if (c.lastActMonths == null) expAct = 'No dry dock, hull cleaning or propeller polishing on record for this vessel.';
  else if (c.devAct == null) expAct = `The last hull activity (${c.lastActType || 'activity'}, ${monthsTxt(c.lastActMonths)} ago) has too little post-event data to measure a change.`;
  else expAct = `Excess power is ${Math.abs(c.devAct).toFixed(1)}% ${dirWord(c.devAct)} than at the last hull activity (${c.lastActType || 'activity'}, ${monthsTxt(c.lastActMonths)} ago), baseline ${c.refMonthAct}.`;

  const lvs = (c.levelSeries || []).map((lv, i) => ({ m: c.monthLabels[i], lv })).filter((x): x is { m: string; lv: string } => !!x.lv);
  let levelChanged = false, levelChangeText = '';
  if (lvs.length >= 2) {
    const curLv = lvs[lvs.length - 1].lv;
    let k = lvs.length - 1;
    while (k > 0 && lvs[k - 1].lv === curLv) k--;
    if (k > 0) { levelChanged = true; levelChangeText = `was ${lvs[k - 1].lv}, changed in ${lvs[k].m}`; }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,49,67,.4)', zIndex: 40, animation: 'znfade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 540, maxWidth: '94vw', background: '#fff', boxShadow: '-12px 0 40px rgba(0,49,67,.22)', display: 'flex', flexDirection: 'column', animation: 'znslide .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e1e8e9', flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: T.soft, color: T.txt, fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 999, letterSpacing: '.03em', textTransform: 'uppercase', display: 'inline-block' }}>{T.label}</span>
                <span style={{ background: '#eef2f2', color: '#2a4a55', fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999, letterSpacing: '.02em' }}>{c.level ? 'Level : ' + c.level : 'Level : —'}</span>
                {levelChanged ? <span style={{ background: '#fff4cc', color: '#8a6a00', fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>↕ {levelChangeText}</span> : null}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#003143', marginTop: 8, lineHeight: 1.1 }}>{c.vessel}</div>
              <div style={{ fontSize: 13, color: '#5d7780', marginTop: 2 }}>{c.owner} · IMO {c.imo}</div>
            </div>
            <button onClick={onClose} className="zn-close-hover" style={{ border: 'none', background: '#eef2f2', color: '#003143', width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', flex: 'none', lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div>
            <div style={{ fontSize: 11, color: '#80a1aa', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>Action required</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 12, border: '1px solid ' + (c.actionYes ? '#f6cdb9' : '#cfe6da'), background: c.actionYes ? '#fdf1ea' : '#f1f8f4' }}>
              <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.actionYes ? '#f06a2d' : '#50b18c', color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                {c.actionYes ? '!' : '✓'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.actionYes ? '#a84320' : '#003143', letterSpacing: '.01em' }}>{c.actionYes ? 'Action required' : 'Keep monitoring'}</div>
                <div style={{ fontSize: 12, color: '#5d7780', lineHeight: 1.4, marginTop: 2 }}>
                  {c.actionYes
                    ? 'This vessel is flagged for action in the latest monthly report — schedule the recommended inspection or maintenance.'
                    : 'No action flagged in the latest monthly report — continue routine performance monitoring.'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 46, fontWeight: 600, color: T.c, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{fmtPct(c.ep)}</div>
              <div style={{ fontSize: 11, color: '#80a1aa', letterSpacing: '.05em', textTransform: 'uppercase' }}>ME excess power · {c.epSource}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {present.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 104, flex: 'none', fontSize: 12, color: '#5d7780' }}>{label}</div>
                  <div style={{ flex: 1, height: 8, background: '#eef2f2', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: Math.max(2, Math.abs(val) / maxV * 100) + '%', height: '100%', background: val < 0 ? '#a8d7c5' : T.c, borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 52, flex: 'none', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: '#003143', fontVariantNumeric: 'tabular-nums' }}>{(val > 0 ? '+' : '') + val.toFixed(1) + '%'}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#003143' }}>Excess power trend</div>
              <div style={{ fontSize: 11.5, color: '#80a1aa' }}>{c.epSource} · monthly</div>
            </div>
            <VesselTrendChart series={c.series} months={c.monthLabels} color={T.c} />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={devBoxBg(c.dev6m)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: devClr(c.dev6m), fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase' }}>Deviation over last 6 months</span>
                  <span style={{ fontSize: 18, fontWeight: 600, color: devClr(c.dev6m), fontVariantNumeric: 'tabular-nums' }}>{c.dev6m == null ? 'N/A' : fmtDev(c.dev6m)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#2a4a55', lineHeight: 1.4, marginTop: 4 }}>{exp6}</div>
              </div>
              <div style={devBoxBg(c.devAct)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: devClr(c.devAct), fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase' }}>Deviation since last hull activity</span>
                  <span style={{ fontSize: 18, fontWeight: 600, color: devClr(c.devAct), fontVariantNumeric: 'tabular-nums' }}>{c.devAct == null ? 'N/A' : fmtDev(c.devAct)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#2a4a55', lineHeight: 1.4, marginTop: 4 }}>{expAct}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingLeft: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#5d7780' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#2f7d5f', display: 'inline-block' }} />improved (&gt;10% lower)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#5d7780' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#f06a2d', display: 'inline-block' }} />worse (&gt;10% higher)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#5d7780' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#b8c4c7', display: 'inline-block' }} />stable (±10%) / N/A</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#003143', marginBottom: 10 }}>Time since last hull activity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Since dry dock', value: monthsTxt(c.ddMonths), color: actColor(c.ddMonths) },
                { label: 'Since hull cleaning', value: monthsTxt(c.hcMonths), color: actColor(c.hcMonths) },
                { label: 'Since hull inspection', value: monthsTxt(c.hiMonths), color: actColor(c.hiMonths) },
              ].map((m) => (
                <div key={m.label} style={{ background: '#f7faf9', border: '1px solid #e1e8e9', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: m.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#5d7780', marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#003143', marginBottom: 10 }}>Overall details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Hindcast − log STW deviation', value: fmtStw(c.stwDev) },
                { label: 'Vessel age', value: c.age == null ? '—' : c.age + ' yr' },
                { label: 'Hindcast sensor excess power', value: fmtPct(c.epSensor) },
                { label: 'Hindcast noon excess power', value: fmtPct(c.epNoon) },
              ].map((m) => (
                <div key={m.label} style={{ background: '#f7faf9', border: '1px solid #e1e8e9', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#003143', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#5d7780', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {c.hullPerf ? (
            <div style={{ borderTop: '1px solid #e1e8e9', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: T.c, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 }}>Analyst notes &amp; recommendation</div>
              <div style={{ fontSize: 13, color: '#2a4a55', lineHeight: 1.5 }}>{c.hullPerf}</div>
            </div>
          ) : null}

          <div style={{ borderTop: '1px solid #e1e8e9', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: T.c, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}>Remarks</div>
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
