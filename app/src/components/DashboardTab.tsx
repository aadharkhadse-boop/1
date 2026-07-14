import { useMemo, useState } from 'react';
import type { Thresholds, VesselWithTier } from '../types';
import { devBand, stwBand } from '../lib/calc';
import { KpiTile } from './KpiTile';
import { BreakdownBar, type Segment } from './BreakdownBar';
import { DashboardControls, type SortKey } from './DashboardControls';
import { VesselCard } from './VesselCard';
import { exportXls } from '../lib/exportXls';

type KpiFilterKey = 'all' | 'attention' | 'worsened' | 'overdue' | 'nodata';

interface Props {
  all: VesselWithTier[];
  thresholds: Thresholds;
  onSelect: (imo: string) => void;
}

const mDesc = (field: 'ddMonths' | 'hcMonths' | 'hiMonths') => (a: VesselWithTier, b: VesselWithTier) => {
  const av = a[field], bv = b[field];
  if (av == null && bv == null) return a.vessel.localeCompare(b.vessel);
  if (av == null) return 1;
  if (bv == null) return -1;
  return bv - av;
};

const SORTERS: Record<SortKey, (a: VesselWithTier, b: VesselWithTier) => number> = {
  worst: (a, b) => (b.ep ?? -1e9) - (a.ep ?? -1e9),
  best: (a, b) => (a.ep ?? 1e9) - (b.ep ?? 1e9),
  oldest: (a, b) => (b.age ?? -1) - (a.age ?? -1),
  name: (a, b) => a.vessel.localeCompare(b.vessel),
  owner: (a, b) => a.owner.localeCompare(b.owner) || a.vessel.localeCompare(b.vessel),
  hc: mDesc('hcMonths'),
  hi: mDesc('hiMonths'),
  pp: (a, b) => a.vessel.localeCompare(b.vessel), // no propeller-polishing column in the workbook — falls back to alphabetical
  dd: mDesc('ddMonths'),
};

export function DashboardTab({ all, thresholds, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VesselWithTier['tier']>('all');
  const [kpiFilter, setKpiFilter] = useState<KpiFilterKey>('all');
  const [devFilter, setDevFilter] = useState('all');
  const [stwFilter, setStwFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('worst');

  const total = all.length;
  const cnt = { good: 0, watch: 0, alert: 0, critical: 0, nodata: 0 };
  let worsened = 0, overdue = 0, reporting = 0;
  all.forEach((c) => {
    cnt[c.tier]++;
    if (c.ep != null) reporting++;
    if (c.epDev != null && c.epDev > 5) worsened++;
    if (c.ep != null && (c.lastActMonths == null || c.lastActMonths > 18)) overdue++;
  });
  const attention = cnt.alert + cnt.critical;

  const kpiPred: Record<Exclude<KpiFilterKey, 'all'>, (c: VesselWithTier) => boolean> = {
    attention: (c) => c.tier === 'alert' || c.tier === 'critical',
    worsened: (c) => c.epDev != null && c.epDev > 5,
    overdue: (c) => c.ep != null && (c.lastActMonths == null || c.lastActMonths > 18),
    nodata: (c) => c.tier === 'nodata',
  };

  const kpis: { key: 'total' | KpiFilterKey; label: string; value: number; sub: string; accent: string; big?: boolean; info: string }[] = [
    { key: 'total', label: 'Vessels monitored', value: total, sub: `${reporting} with excess-power data`, accent: '#003143', info: `Total vessels tracked this month. ${reporting} of ${total} report an ME excess-power reading.` },
    { key: 'attention', label: 'Need attention', value: attention, sub: 'alert + critical condition', accent: '#c2493e', big: true, info: 'Vessels in alert or critical condition — excess power high enough to prioritise inspection.' },
    { key: 'worsened', label: 'Worsened since hull activity', value: worsened, sub: 'excess power% >5% since hull work', accent: '#b88a00', info: 'Excess power has risen more than 5% since the last hull activity (dry dock / clean / polish).' },
    { key: 'overdue', label: 'Overdue hull work', value: overdue, sub: 'no activity or >18 months', accent: '#156e80', info: 'No recorded hull activity, or the last activity was more than 18 months ago.' },
    { key: 'nodata', label: 'No data', value: cnt.nodata, sub: 'no hindcast excess-power reading', accent: '#5d7780', info: 'No hindcast ME excess-power reading is available for these vessels this month.' },
  ];

  const segments: Segment[] = (['critical', 'alert', 'watch', 'good', 'nodata'] as const).map((t) => ({
    key: t, count: cnt[t],
    label: t === 'critical' ? 'critical' : t === 'alert' ? 'alert' : t === 'watch' ? 'watch' : t === 'good' ? 'good' : 'no data',
    color: t === 'critical' ? '#952850' : t === 'alert' ? '#f06a2d' : t === 'watch' ? '#e0a500' : t === 'good' ? '#50b18c' : '#b8c4c7',
  }));

  const dcnt = { improved: 0, stable: 0, worse: 0, sharp: 0, nodev: 0 };
  all.forEach((c) => { dcnt[devBand(c.epDev)]++; });
  const devSegments: Segment[] = (['sharp', 'worse', 'stable', 'improved', 'nodev'] as const).map((t) => ({
    key: t, count: dcnt[t],
    label: t === 'sharp' ? 'sharply worsened' : t === 'worse' ? 'worsened' : t === 'stable' ? 'stable' : t === 'improved' ? 'improved' : 'no data',
    color: t === 'sharp' ? '#952850' : t === 'worse' ? '#f06a2d' : t === 'stable' ? '#80a1aa' : t === 'improved' ? '#50b18c' : '#b8c4c7',
  }));

  const scnt = { aligned: 0, high: 0, nostw: 0 };
  all.forEach((c) => { scnt[stwBand(c.stwDev)]++; });
  const stwSegments: Segment[] = (['high', 'aligned', 'nostw'] as const).map((t) => ({
    key: t, count: scnt[t],
    label: t === 'high' ? 'over ±0.5 kn' : t === 'aligned' ? 'within ±0.5 kn' : 'no data',
    color: t === 'high' ? '#f06a2d' : t === 'aligned' ? '#50b18c' : '#b8c4c7',
  }));

  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    let l = all.filter((c) => {
      if (statusFilter !== 'all' && c.tier !== statusFilter) return false;
      if (kpiFilter !== 'all' && !kpiPred[kpiFilter](c)) return false;
      if (devFilter !== 'all' && devBand(c.epDev) !== devFilter) return false;
      if (stwFilter !== 'all' && stwBand(c.stwDev) !== stwFilter) return false;
      if (q) { const hay = (c.vessel + ' ' + c.owner + ' ' + c.imo).toLowerCase(); if (!hay.includes(q)) return false; }
      return true;
    });
    l = l.slice().sort(SORTERS[sort]);
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, statusFilter, kpiFilter, devFilter, stwFilter, q, sort]);

  const handleExport = () => {
    exportXls(list.map((c) => ({
      imo: c.imo, vessel: c.vessel, owner: c.owner, ep: c.ep,
      condition: c.tier[0].toUpperCase() + c.tier.slice(1),
      dev6m: c.dev6m, devAct: c.devAct, dd: c.ddMonths, hc: c.hcMonths, stw: c.stwDev, age: c.age,
    })), 'fleet-condition');
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KpiTile
            key={k.key}
            label={k.label} value={String(k.value)} sub={k.sub} info={k.info} accent={k.accent} big={k.big}
            active={k.key === 'total' ? kpiFilter === 'all' : kpiFilter === k.key}
            onClick={() => setKpiFilter((prev) => (k.key === 'total' ? 'all' : (prev === k.key ? 'all' : k.key)))}
          />
        ))}
      </div>

      <BreakdownBar
        title="Fleet condition by ME excess power (%)"
        titleNote="hindcast (sensor, else noon)"
        info="Vessels grouped by ME excess power vs baseline. Click any band below to filter the list."
        legend={`Good <${thresholds.watch}% · Watch <${thresholds.alert}% · Alert <${thresholds.critical}% · Critical ≥${thresholds.critical}%`}
        segments={segments} total={total} activeKey={statusFilter}
        onToggle={(k) => setStatusFilter((prev) => (prev === k ? 'all' : k as VesselWithTier['tier']))}
      />

      <BreakdownBar
        title="Deviation of excess power (%)"
        titleNote="since last hull activity (dry dock / hull clean / propeller polish), else last 6 months"
        info="Change in ME excess power since the last hull activity. Positive means performance has worsened."
        legend="Improved <0% · Stable 0% to +10% · Worsened >+10% to +20% · Sharply worsened >+20%"
        segments={devSegments} total={total} activeKey={devFilter}
        onToggle={(k) => setDevFilter((prev) => (prev === k ? 'all' : k))}
      />

      <BreakdownBar
        title="Speed reliability"
        titleNote="hindcast vs log STW deviation"
        info="Gap between hindcast and logged speed-through-water. Deviations over ±0.5 kn suggest a speed-log issue."
        legend="Within ±0.5 kn · Over ±0.5 kn (possible speed-log issue)"
        segments={stwSegments} total={total} activeKey={stwFilter}
        onToggle={(k) => setStwFilter((prev) => (prev === k ? 'all' : k))}
      />

      <DashboardControls
        query={query} onQueryChange={setQuery}
        sort={sort} onSortChange={setSort}
        shownCount={list.length} totalCount={total}
        onExport={handleExport}
      />

      {list.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(288px,1fr))', gap: 14 }}>
          {list.map((c) => (
            <VesselCard key={c.imo} vessel={c} onClick={() => onSelect(c.imo)} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5d7780', fontSize: 14 }}>No vessels match the current filters.</div>
      )}
    </div>
  );
}
