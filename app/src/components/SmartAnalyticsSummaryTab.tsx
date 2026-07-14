import { useState } from 'react';
import type { Vessel } from '../types';
import { devColorEng } from '../lib/engineCalc';
import { aeMetricOf, boMetricOf, type engineSummaryBands, meMetricOf } from '../lib/summaryLogic';
import { exportEngList } from '../lib/exportXls';
import { InfoDot } from './KpiTile';

interface Props {
  bands: ReturnType<typeof engineSummaryBands>;
  checked: Record<string, boolean>;
  toggle: (key: string) => void;
  onSelect: (imo: string) => void;
}

type Sys = 'me' | 'ae' | 'bo';

const METRIC_OF: Record<Sys, (c: Vessel) => { v: string; num: number | null }> = { me: meMetricOf, ae: aeMetricOf, bo: boMetricOf };

const RED = '#952850', REDS = '#f5dae3', ORN = '#f06a2d', ORNS = '#fde2d6', GRN = '#50b18c', GRNS = '#deefe9';

interface BandDef {
  sys: Sys; slug: string; col: string; soft: string; title: string; criteria: string; list: Vessel[];
}

const sevSort = (sys: Sys) => (a: Vessel, b: Vessel) => {
  const av = METRIC_OF[sys](a).num, bv = METRIC_OF[sys](b).num;
  return (bv == null ? -Infinity : Math.abs(bv)) - (av == null ? -Infinity : Math.abs(av));
};

const bandInfo = (title: string, criteria: string) => (
  /^Immediate/.test(title) || title === 'Excess consumption'
    ? `Flagged for action — ${criteria}. Prioritise these vessels.`
    : (/^Monitor/.test(title) ? `Keep watch — ${criteria}. Re-check next reporting cycle.` : `Operating within limits — ${criteria}. No action needed.`)
);

export function SmartAnalyticsSummaryTab({ bands, checked, toggle, onSelect }: Props) {
  const { meB, aeB, boB } = bands;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    'me-immediate': true, 'me-monitor': true, 'me-within': true,
    'ae-immediate': true, 'ae-monitor': true, 'ae-within': true,
    'bo-excess': true, 'bo-zero': true,
  });

  const groups: { title: string; sub: string; accent: string; valLabel: string; bands: BandDef[] }[] = [
    {
      title: 'ME performance', sub: 'Main engine · triaged by ME SFOC deviation', accent: '#156e80', valLabel: 'ME SFOC dev',
      bands: [
        { sys: 'me', slug: 'me-immediate', col: RED, soft: REDS, title: 'Immediate action', criteria: 'ME SFOC deviation ≥ 20 g/kWh', list: meB[2] },
        { sys: 'me', slug: 'me-monitor', col: ORN, soft: ORNS, title: 'Monitor closely', criteria: 'ME SFOC deviation 10–20 g/kWh', list: meB[1] },
        { sys: 'me', slug: 'me-within', col: GRN, soft: GRNS, title: 'Within limits', criteria: 'ME SFOC deviation < 10 g/kWh', list: meB[0] },
      ],
    },
    {
      title: 'AE performance', sub: 'Auxiliary / generator engines · triaged by AE SFOC deviation', accent: '#50b18c', valLabel: 'AE SFOC dev',
      bands: [
        { sys: 'ae', slug: 'ae-immediate', col: RED, soft: REDS, title: 'Immediate action', criteria: 'AE SFOC deviation ≥ 20 g/kWh', list: aeB[2] },
        { sys: 'ae', slug: 'ae-monitor', col: ORN, soft: ORNS, title: 'Monitor closely', criteria: 'AE SFOC deviation 10–20 g/kWh', list: aeB[1] },
        { sys: 'ae', slug: 'ae-within', col: GRN, soft: GRNS, title: 'Within limits', criteria: 'AE SFOC deviation < 10 g/kWh', list: aeB[0] },
      ],
    },
    {
      title: 'Boiler performance', sub: 'Auxiliary boiler · triaged by excess consumption', accent: '#b88a00', valLabel: 'Boiler excess (t)',
      bands: [
        { sys: 'bo', slug: 'bo-excess', col: ORN, soft: ORNS, title: 'Excess consumption', criteria: 'More than 0 t excess consumption', list: boB[1] },
        { sys: 'bo', slug: 'bo-zero', col: GRN, soft: GRNS, title: 'No excess', criteria: '0 t excess consumption', list: boB[0] },
      ],
    },
  ];

  const rowGrid = '32px minmax(0,1fr) 150px';

  return (
    <div style={{ padding: '22px 28px 40px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#003143', lineHeight: 1.2 }}>Machinery condition summary</div>
        <div style={{ fontSize: 12.5, color: '#5d7780', lineHeight: 1.4, marginTop: 3 }}>
          Each subsystem triaged separately — <span style={{ fontWeight: 600, color: '#003143' }}>ME</span> and <span style={{ fontWeight: 600, color: '#003143' }}>AE</span> by SFOC deviation, <span style={{ fontWeight: 600, color: '#003143' }}>Boiler</span> by excess consumption.
        </div>
      </div>

      {groups.map((grp) => (
        <div key={grp.title} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 11 }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, background: grp.accent, flex: 'none', display: 'inline-block' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#003143', letterSpacing: '-.01em' }}>{grp.title}</span>
            <span style={{ fontSize: 12, color: '#80a1aa' }}>{grp.sub}</span>
          </div>
          {grp.bands.map((s) => {
            const key = (imo: string) => s.sys + ':' + imo;
            const resolved = s.list.filter((c) => checked[key(c.imo)]).length;
            const open = !collapsed[s.slug];
            const sorted = s.list.slice().sort(sevSort(s.sys));
            const info = bandInfo(s.title, s.criteria);
            return (
              <div key={s.slug} style={{ background: '#fff', border: '1px solid #cdd9dd', borderTop: '3px solid ' + s.col, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,49,67,.06)', marginBottom: 12 }}>
                <div
                  onClick={() => setCollapsed((prev) => ({ ...prev, [s.slug]: !prev[s.slug] }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 18px', background: s.soft, flexWrap: 'wrap', cursor: 'pointer', borderRadius: open ? '11px 11px 0 0' : 11 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 20, color: '#5d7780', flex: 'none', width: 20, textAlign: 'center' }}>{open ? '▾' : '▸'}</span>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.col, flex: 'none' }} />
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: '#003143' }}>{s.title}</span>
                    <InfoDot color="#8aa2a9" text={info} width={230} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', background: s.col, padding: '2px 11px', borderRadius: 999, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{s.list.length - resolved}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
                    <div style={{ fontSize: 12, color: '#5d7780', whiteSpace: 'nowrap' }}>{s.criteria}</div>
                    {s.list.length > 0 ? (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
                        <button
                          onClick={() => {
                            const out = sorted.filter((c) => !checked[key(c.imo)]);
                            exportEngList(out.map((c) => ({ imo: c.imo, vessel: c.vessel, owner: c.owner, cond: s.title, me: meMetricOf(c).v, ax: aeMetricOf(c).v, bo: boMetricOf(c).v })), s.slug + '-' + new Date().toISOString().slice(0, 10));
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid ' + s.col, background: '#fff', color: s.col, font: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
                        >
                          ↓ Excel
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {open && s.list.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: rowGrid, gap: 12, padding: '9px 18px', background: '#fbfdfc', fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', color: '#80a1aa', fontWeight: 600, borderTop: '1px solid #eef2f2' }}>
                      <div style={{ textAlign: 'center' }}>Done</div>
                      <div>Vessel</div>
                      <div style={{ textAlign: 'right' }}>{grp.valLabel}</div>
                    </div>
                    {sorted.map((c) => {
                      const a = METRIC_OF[s.sys](c);
                      const isChk = !!checked[key(c.imo)];
                      const vColor = s.sys === 'bo' ? (a.num != null && a.num > 0 ? '#c44a14' : '#2a4a55') : devColorEng(a.num);
                      return (
                        <div
                          key={c.imo}
                          onClick={() => onSelect(c.imo)}
                          className="zn-row-hover"
                          style={{ display: 'grid', gridTemplateColumns: rowGrid, gap: 12, alignItems: 'center', padding: '11px 18px', borderTop: '1px solid #f0f3f3', cursor: 'pointer' }}
                        >
                          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input type="checkbox" checked={isChk} onChange={() => toggle(key(c.imo))} style={{ width: 16, height: 16, accentColor: '#156e80', cursor: 'pointer' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#003143', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isChk ? 'line-through' : 'none', opacity: isChk ? 0.5 : 1 }}>{c.vessel}</div>
                            <div style={{ fontSize: 11.5, color: '#5d7780', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.owner} · IMO {c.imo}</div>
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: vColor, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{a.v}</div>
                        </div>
                      );
                    })}
                  </>
                ) : null}
                {open && s.list.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#80a1aa' }}>No vessels in this band.</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
