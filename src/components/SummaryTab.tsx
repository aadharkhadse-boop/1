import { useState, type CSSProperties } from 'react';
import type { VesselWithTier } from '../types';
import { TIER, devColor, fmtDev, fmtPct, fmtStw } from '../lib/calc';
import type { hullSummaryBands } from '../lib/summaryLogic';
import { exportList } from '../lib/exportXls';
import { InfoDot } from './KpiTile';

interface Props {
  bands: ReturnType<typeof hullSummaryBands>;
  checked: Record<string, boolean>;
  toggle: (imo: string) => void;
  onSelect: (imo: string) => void;
}

interface BandDef {
  slug: string;
  c: string;
  soft: string;
  title: string;
  criteria: string;
  list: VesselWithTier[];
}

const bySev = (a: VesselWithTier, b: VesselWithTier) => (b.ep ?? -1) - (a.ep ?? -1);

const CHECKABLE_GRID = '32px minmax(0,1fr) 116px 156px 138px 138px 150px';
const PLAIN_GRID = 'minmax(0,1fr) 116px 156px 138px 138px 150px';

function actionPillStyle(actionYes: boolean): CSSProperties {
  return {
    justifySelf: 'end', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
    background: actionYes ? '#fdf1ea' : '#f1f8f4', color: actionYes ? '#a84320' : '#2f7d5f',
    border: '1px solid ' + (actionYes ? '#f6cdb9' : '#cfe6da'),
  };
}

function Row({ c, checkable, checked, onToggle, onSelect }: { c: VesselWithTier; checkable: boolean; checked: boolean; onToggle: () => void; onSelect: () => void }) {
  const T = TIER[c.tier];
  return (
    <div
      onClick={onSelect}
      className="zn-row-hover"
      style={{ display: 'grid', gridTemplateColumns: checkable ? CHECKABLE_GRID : PLAIN_GRID, alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid #eef2f2', cursor: 'pointer', opacity: checked ? 0.45 : 1, transition: 'opacity .15s' }}
    >
      {checkable ? (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input type="checkbox" checked={checked} onChange={onToggle} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#952850' }} />
        </div>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#003143', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: checked ? 'line-through' : 'none' }}>{c.vessel}</div>
        <div style={{ fontSize: 11.5, color: '#5d7780', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.owner} · IMO {c.imo}</div>
      </div>
      <span style={{ background: T.soft, color: T.txt, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999, letterSpacing: '.03em', textTransform: 'uppercase', justifySelf: 'start', whiteSpace: 'nowrap' }}>{T.label}</span>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.c, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{fmtPct(c.ep)}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: devColor(c.epDev), fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{c.epDev == null ? 'N/A' : fmtDev(c.epDev)}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: c.stwDev == null ? '#80a1aa' : (Math.abs(c.stwDev) > 0.5 ? '#c44a14' : '#2a4a55'), fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{fmtStw(c.stwDev)}</div>
      <span style={actionPillStyle(c.actionYes)}>{c.actionYes ? 'Action required' : 'Keep monitoring'}</span>
    </div>
  );
}

export function SummaryTab({ bands, checked, toggle, onSelect }: Props) {
  const { epLim, devLim, bBoth, bOne, bNone } = bands;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ 'immediate-action': true, 'monitor-closely': true, 'within-limits': true });
  const [actionOpen, setActionOpen] = useState(false);

  const secDefs: BandDef[] = [
    { slug: 'immediate-action', c: '#952850', soft: '#f5dae3', title: 'High Priority', criteria: `Excess power ≥ ${epLim}%   and   deviation ≥ ${devLim}%`, list: bBoth },
    { slug: 'monitor-closely', c: '#f06a2d', soft: '#fde2d6', title: 'Medium Priority', criteria: `Excess power ≥ ${epLim}%   or   deviation ≥ ${devLim}%`, list: bOne },
    { slug: 'within-limits', c: '#50b18c', soft: '#deefe9', title: 'Low Priority', criteria: `Excess power < ${epLim}%   and   deviation < ${devLim}%`, list: bNone },
  ];

  const all = [...bBoth, ...bOne, ...bNone];
  const actionList = all.filter((c) => c.actionYes).slice().sort(bySev);

  const doExportList = (list: VesselWithTier[], filename: string) => {
    exportList(list.map((c) => ({ imo: c.imo, vessel: c.vessel, owner: c.owner, conditionLabel: TIER[c.tier].label, ep: c.ep, epDev: c.epDev, stwDev: c.stwDev, actionYes: c.actionYes })), filename);
  };

  return (
    <div style={{ padding: '22px 28px 40px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#003143', lineHeight: 1.2 }}>Condition summary</div>
        <div style={{ fontSize: 12.5, color: '#5d7780', lineHeight: 1.4, marginTop: 3 }}>
          Every vessel triaged against two limits — <span style={{ fontWeight: 600, color: '#003143' }}>ME excess power</span> and its <span style={{ fontWeight: 600, color: '#003143' }}>deviation of excess power</span> — into three priority bands.
        </div>
      </div>

      {secDefs.map((s) => {
        const resolved = s.list.filter((c) => checked[c.imo]).length;
        const open = !collapsed[s.slug];
        const sorted = s.list.slice().sort(bySev);
        return (
          <div key={s.slug} style={{ background: '#fff', border: '1px solid #cdd9dd', borderTop: '3px solid ' + s.c, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,49,67,.06)', marginBottom: 18 }}>
            <div
              onClick={() => setCollapsed((prev) => ({ ...prev, [s.slug]: !prev[s.slug] }))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', background: s.soft, cursor: 'pointer', borderRadius: open ? '11px 11px 0 0' : 11 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 20, color: '#5d7780', flex: 'none', width: 20, textAlign: 'center', transition: 'transform .15s' }}>{open ? '▾' : '▸'}</span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.c, flex: 'none' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#003143' }}>{s.title}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', background: s.c, padding: '2px 11px', borderRadius: 999, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{s.list.length - resolved}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
                <div style={{ fontSize: 12, color: '#5d7780', whiteSpace: 'nowrap' }}>{s.criteria}</div>
                {s.list.length > 0 ? (
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
                    <button
                      onClick={() => doExportList(sorted.filter((c) => !checked[c.imo]), s.slug + '-' + new Date().toISOString().slice(0, 10))}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid ' + s.c, background: '#fff', color: s.c, font: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
                    >
                      ↓ Excel
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {open && s.list.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: CHECKABLE_GRID, gap: 12, padding: '9px 18px', background: '#f7faf9', fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase', color: '#80a1aa', fontWeight: 600, borderTop: '1px solid #eef2f2' }}>
                  <div style={{ textAlign: 'center' }}>Done</div>
                  <div>Vessel</div>
                  <div>Condition</div>
                  <div style={{ textAlign: 'right' }}>ME excess power</div>
                  <div style={{ textAlign: 'right' }}>Deviation</div>
                  <div style={{ textAlign: 'right' }}>Hindcast − log STW</div>
                  <div style={{ textAlign: 'right' }}>Action required</div>
                </div>
                {sorted.map((c) => (
                  <Row key={c.imo} c={c} checkable checked={!!checked[c.imo]} onToggle={() => toggle(c.imo)} onSelect={() => onSelect(c.imo)} />
                ))}
              </>
            ) : null}
            {open && s.list.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: '#80a1aa' }}>No vessels in this band.</div>
            ) : null}
          </div>
        );
      })}

      <div style={{ marginTop: 26, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#003143', lineHeight: 1.2 }}>Action required</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #cdd9dd', borderTop: '3px solid #f06a2d', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,49,67,.06)' }}>
        <div
          onClick={() => setActionOpen((prev) => !prev)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', background: '#fde2d6', cursor: 'pointer', borderRadius: actionOpen ? '11px 11px 0 0' : 11 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 20, color: '#5d7780', flex: 'none', width: 20, textAlign: 'center', transition: 'transform .15s' }}>{actionOpen ? '▾' : '▸'}</span>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f06a2d', flex: 'none' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#003143' }}>Action required</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', background: '#f06a2d', padding: '2px 11px', borderRadius: 999, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{actionList.length}</span>
            <InfoDot color="#8aa2a9" text="Vessels flagged “Yes” in the Action Required column of the latest monthly report — needing an inspection or maintenance decision." width={250} />
          </div>
          {actionList.length > 0 ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
              <button
                onClick={() => doExportList(actionList, 'action-required-' + new Date().toISOString().slice(0, 10))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #f06a2d', background: '#fff', color: '#f06a2d', font: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
              >
                ↓ Excel
              </button>
            </div>
          ) : null}
        </div>
        {actionOpen && actionList.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: PLAIN_GRID, gap: 12, padding: '9px 18px', background: '#f7faf9', fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase', color: '#80a1aa', fontWeight: 600, borderTop: '1px solid #eef2f2' }}>
              <div>Vessel</div>
              <div>Condition</div>
              <div style={{ textAlign: 'right' }}>ME excess power</div>
              <div style={{ textAlign: 'right' }}>Deviation</div>
              <div style={{ textAlign: 'right' }}>Hindcast − log STW</div>
              <div style={{ textAlign: 'right' }}>Action required</div>
            </div>
            {actionList.map((c) => (
              <Row key={c.imo} c={c} checkable={false} checked={false} onToggle={() => {}} onSelect={() => onSelect(c.imo)} />
            ))}
          </>
        ) : null}
        {actionOpen && actionList.length === 0 ? (
          <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: '#80a1aa' }}>No vessels flagged for action.</div>
        ) : null}
      </div>
    </div>
  );
}
