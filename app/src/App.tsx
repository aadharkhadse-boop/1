import { useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { TabBar, type TabKey } from './components/TabBar';
import { DashboardTab } from './components/DashboardTab';
import { SummaryTab } from './components/SummaryTab';
import { SmartAnalyticsTab } from './components/SmartAnalyticsTab';
import { SmartAnalyticsSummaryTab } from './components/SmartAnalyticsSummaryTab';
import { VesselDetailDrawer } from './components/VesselDetailDrawer';
import { EngineDetailDrawer } from './components/EngineDetailDrawer';
import { useFleetData } from './hooks/useFleetData';
import { useCheckedMap } from './hooks/useCheckedMap';
import { tierOfAll } from './lib/calc';
import { hullSummaryBands, engineSummaryBands, DEV_LIM } from './lib/summaryLogic';
import { THRESHOLD_DEFAULTS } from './types';

type Selected = { imo: string; kind: 'hull' | 'engine' } | null;

function App() {
  const { vessels, meta, loading, loadingText, error, uploadFile, resetToSample } = useFleetData();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [selected, setSelected] = useState<Selected>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thresholds = THRESHOLD_DEFAULTS;
  const all = useMemo(() => tierOfAll(vessels ?? [], thresholds), [vessels, thresholds]);
  const hullBands = useMemo(() => hullSummaryBands(all, thresholds), [all, thresholds]);
  const engineBands = useMemo(() => engineSummaryBands(vessels ?? []), [vessels]);

  const hullChecked = useCheckedMap('znHullChecked_v1');
  const engChecked = useCheckedMap('znEngineChecked_v1');

  const bothRemaining = hullBands.bBoth.filter((c) => !hullChecked.checked[c.imo]).length;

  const tabGroups = [
    {
      label: 'Hull performance',
      tabs: [
        { key: 'dashboard' as const, label: 'Hull Performance Dashboard', badge: all.length, tip: 'Total vessels monitored' },
        { key: 'summary' as const, label: 'Hull Summary', badge: bothRemaining, tip: `Vessels needing immediate action — excess power ≥ ${hullBands.epLim}% and deviation ≥ ${DEV_LIM}%` },
      ],
    },
    {
      label: 'Smart analytics',
      tabs: [
        { key: 'analytics' as const, label: 'Smart Analytics Dashboard', badge: all.length, tip: 'Engine performance parameters (sensor vs noon) for every vessel' },
        { key: 'analytics-summary' as const, label: 'Smart Analytics Summary', badge: engineBands.engImmediate, tip: 'Vessels needing immediate machinery attention — ME or AE SFOC deviation ≥ 20 g/kWh' },
      ],
    },
  ];

  const selectedVessel = selected ? all.find((v) => v.imo === selected.imo) : undefined;

  const onUploadClick = () => fileInputRef.current?.click();
  const onFileChosen: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#003143' }}>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={onFileChosen} />
      <Header monthCount={meta?.monthCount ?? 6} onUploadClick={onUploadClick} />

      {loading || !vessels ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#5d7780' }}>
          <div style={{ width: 38, height: 38, border: '3px solid #cdd9dd', borderTopColor: '#156e80', borderRadius: '50%', animation: 'znspin .8s linear infinite' }} />
          <div style={{ fontSize: 14 }}>{error ? 'Could not read workbook: ' + error : loadingText}</div>
          {error ? (
            <button onClick={resetToSample} style={{ border: '1px solid #156e80', background: '#fff', color: '#156e80', font: 'inherit', fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 999, cursor: 'pointer' }}>
              Reload sample data
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <TabBar groups={tabGroups} current={tab} onChange={setTab} />

          {tab === 'dashboard' && (
            <DashboardTab all={all} thresholds={thresholds} onSelect={(imo) => setSelected({ imo, kind: 'hull' })} />
          )}
          {tab === 'summary' && (
            <SummaryTab bands={hullBands} checked={hullChecked.checked} toggle={hullChecked.toggle} onSelect={(imo) => setSelected({ imo, kind: 'hull' })} />
          )}
          {tab === 'analytics' && (
            <SmartAnalyticsTab all={vessels} onSelect={(imo) => setSelected({ imo, kind: 'engine' })} />
          )}
          {tab === 'analytics-summary' && (
            <SmartAnalyticsSummaryTab bands={engineBands} checked={engChecked.checked} toggle={engChecked.toggle} onSelect={(imo) => setSelected({ imo, kind: 'engine' })} />
          )}
        </div>
      )}

      {selected?.kind === 'hull' && selectedVessel ? (
        <VesselDetailDrawer vessel={selectedVessel} onClose={() => setSelected(null)} />
      ) : null}
      {selected?.kind === 'engine' && selectedVessel ? (
        <EngineDetailDrawer vessel={selectedVessel} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

export default App;
