import { useMemo, useState } from 'react';
import type { Vessel } from '../types';
import { authOf, isL1, isL2 } from '../lib/engineCalc';
import { KpiTile } from './KpiTile';
import { EngineCard } from './EngineCard';
import { exportSaList } from '../lib/exportXls';

export type SaFilterKey = 'all' | 'me' | 'aux' | 'boiler' | 'scoc';
type SaSortKey = 'sfoc' | 'aux' | 'scoc' | 'boiler' | 'name' | 'owner';

interface Props {
  all: Vessel[];
  onSelect: (imo: string) => void;
}

const KPI_SORT: Record<Exclude<SaFilterKey, 'all'>, SaSortKey> = { me: 'sfoc', aux: 'aux', boiler: 'boiler', scoc: 'scoc' };

export function SmartAnalyticsTab({ all, onSelect }: Props) {
  const [saQuery, setSaQuery] = useState('');
  const [saSort, setSaSort] = useState<SaSortKey>('sfoc');
  const [saFilter, setSaFilter] = useState<SaFilterKey>('all');

  const decorated = useMemo(() => all.map((c) => ({
    c, L2: isL2(c), L1: isL1(c),
    sfocDev: authOf(c, c.meDevS, c.meDevN),
    auxDev: authOf(c, c.axDevS, c.axDevN),
    scoc: authOf(c, c.scocS, c.scocN),
    boiler: authOf(c, c.boilS, c.boilN),
  })), [all]);

  const saTotal = decorated.length;
  const q = saQuery.trim().toLowerCase();
  const afterSearch = q ? decorated.filter((o) => (o.c.vessel + ' ' + o.c.owner + ' ' + o.c.imo).toLowerCase().includes(q)) : decorated;

  const cntMe = afterSearch.filter((o) => o.sfocDev.num != null && o.sfocDev.num > 20).length;
  const cntAux = afterSearch.filter((o) => o.auxDev.num != null && Math.abs(o.auxDev.num) > 20).length;
  const cntBoiler = afterSearch.filter((o) => o.boiler.num != null && o.boiler.num > 0).length;
  const cntScoc = afterSearch.filter((o) => o.scoc.num != null).length;

  const filterFns: Record<Exclude<SaFilterKey, 'all'>, (o: (typeof decorated)[number]) => boolean> = {
    me: (o) => o.sfocDev.num != null && o.sfocDev.num > 20,
    aux: (o) => o.auxDev.num != null && Math.abs(o.auxDev.num) > 20,
    boiler: (o) => o.boiler.num != null && o.boiler.num > 0,
    scoc: (o) => o.scoc.num != null,
  };
  const filtered = saFilter === 'all' ? afterSearch : afterSearch.filter(filterFns[saFilter]);

  const gv = (x: { num: number | null }) => (x.num == null ? -Infinity : x.num);
  const av = (x: { num: number | null }) => (x.num == null ? -Infinity : Math.abs(x.num));
  const sorters: Record<SaSortKey, (a: (typeof decorated)[number], b: (typeof decorated)[number]) => number> = {
    sfoc: (a, b) => gv(b.sfocDev) - gv(a.sfocDev),
    aux: (a, b) => av(b.auxDev) - av(a.auxDev),
    scoc: (a, b) => gv(b.scoc) - gv(a.scoc),
    boiler: (a, b) => gv(b.boiler) - gv(a.boiler),
    name: (a, b) => a.c.vessel.localeCompare(b.c.vessel),
    owner: (a, b) => a.c.owner.localeCompare(b.c.owner),
  };
  const saList = filtered.slice().sort(sorters[saSort]);

  const kpiInfo: Record<SaFilterKey, string> = {
    all: 'All vessels with engine performance data this month. Click to clear filters.',
    me: 'Vessels whose ME SFOC deviation exceeds 20 g/kWh — main-engine fuel consumption well above baseline.',
    scoc: 'Vessels reporting ME cylinder-oil consumption (SCOC) this month.',
    aux: 'Vessels whose aux/GE SFOC deviation exceeds ±20 g/kWh — generator fuel consumption off baseline.',
    boiler: 'Vessels with auxiliary-boiler excess consumption above 0 t this month.',
  };

  const kpis: { key: SaFilterKey; label: string; value: number; sub: string; accent: string }[] = [
    { key: 'all', label: 'Vessels', value: saTotal, sub: 'view all — clears filters', accent: '#003143' },
    { key: 'me', label: 'High ME SFOC dev', value: cntMe, sub: 'authoritative deviation > 20 g/kWh', accent: '#f06a2d' },
    { key: 'scoc', label: 'M.E. Cyl. Oil', value: cntScoc, sub: 'vessels reporting ME SCOC', accent: '#952850' },
    { key: 'aux', label: 'High aux GE SFOC dev', value: cntAux, sub: 'authoritative |deviation| > 20 g/kWh', accent: '#b88a00' },
    { key: 'boiler', label: 'Boiler excess flagged', value: cntBoiler, sub: 'excess consumption > 0 t', accent: '#156e80' },
  ];

  const onKpiClick = (key: SaFilterKey) => {
    if (key === 'all') { setSaFilter('all'); setSaQuery(''); setSaSort('name'); return; }
    setSaFilter((prev) => {
      const on = (prev || 'all') === key;
      setSaSort(on ? 'name' : KPI_SORT[key]);
      return on ? 'all' : key;
    });
  };

  const handleExport = () => {
    exportSaList(saList.map((o) => ({
      imo: o.c.imo, vessel: o.c.vessel, owner: o.c.owner, level: o.L2 ? 'L2' : (o.L1 ? 'L1' : '—'),
      meSfoc: authOf(o.c, o.c.meSfocS, o.c.meSfocN).v, meDev: o.sfocDev.v, scoc: o.scoc.v, auxDev: o.auxDev.v, boiler: o.boiler.v,
    })), 'smart-analytics-' + new Date().toISOString().slice(0, 10));
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 16 }}>
        {kpis.map((k) => (
          <KpiTile
            key={k.key}
            label={k.label} value={String(k.value)} sub={k.sub} info={kpiInfo[k.key]} accent={k.accent}
            inactiveValueColor="#003143"
            active={saFilter === k.key}
            onClick={() => onKpiClick(k.key)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 'none' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#80a1aa', fontSize: 14 }}>⌕</span>
          <input
            value={saQuery}
            onChange={(e) => setSaQuery(e.target.value)}
            placeholder="Search vessel, owner or IMO"
            style={{ width: 280, padding: '10px 14px 10px 30px', border: '1px solid #cdd9dd', borderRadius: 999, font: 'inherit', fontSize: 13.5, color: '#003143', background: '#fff', outline: 'none' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #156e80', background: '#156e80', color: '#fff', font: 'inherit', fontSize: 12.5, fontWeight: 500, padding: '8px 16px', borderRadius: 999, cursor: 'pointer' }}>
            ↓ Download list (Excel)
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: '#5d7780', marginBottom: 12 }}>
        Showing <span style={{ fontWeight: 600, color: '#003143' }}>{saList.length}</span> of {saTotal} vessels · <span style={{ color: '#156e80', fontWeight: 600 }}>Sensor</span> for L2 · <span style={{ color: '#b0642d', fontWeight: 600 }}>Noon</span> for L1 · click any vessel for the full breakdown
      </div>

      {saList.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(288px,1fr))', gap: 14 }}>
          {saList.map((o) => (
            <EngineCard key={o.c.imo} vessel={o.c} filter={saFilter} onClick={() => onSelect(o.c.imo)} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5d7780', fontSize: 14 }}>No vessels match your search.</div>
      )}
    </div>
  );
}
