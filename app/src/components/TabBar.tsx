import { useState, type CSSProperties } from 'react';

export type TabKey = 'dashboard' | 'summary' | 'analytics' | 'analytics-summary' | 'cii';

export interface TabDef {
  key: TabKey;
  label: string;
  badge: number;
  tip: string;
}

export interface TabGroup {
  label: string;
  tabs: TabDef[];
}

interface Props {
  groups: TabGroup[];
  current: TabKey;
  onChange: (key: TabKey) => void;
}

const barStyle: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 6, display: 'flex', alignItems: 'flex-end',
  padding: '0 28px', background: '#eef2f2', borderBottom: '1px solid #d9e2e3', flex: 'none',
};

export function TabBar({ groups, current, onChange }: Props) {
  const [hover, setHover] = useState<TabKey | null>(null);
  return (
    <div style={barStyle}>
      {groups.map((g, gi) => (
        <div key={g.label} style={{ display: 'flex', alignItems: 'flex-end' }}>
          {gi > 0 ? <div style={{ width: 1, alignSelf: 'stretch', background: '#d9e2e3', margin: '12px 22px 0' }} /> : null}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#8aa2a9', padding: '8px 2px 0' }}>{g.label}</span>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {g.tabs.map((t) => {
                const on = current === t.key;
                const showTip = hover === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    onMouseEnter={() => setHover(t.key)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      position: 'relative', border: 'none', background: 'transparent', font: 'inherit',
                      fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? '#003143' : '#5d7780',
                      padding: '6px 2px 12px', marginRight: 22, cursor: 'pointer',
                      borderBottom: '2.5px solid ' + (on ? '#156e80' : 'transparent'),
                    }}
                  >
                    {t.label}
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: on ? '#fff' : '#5d7780',
                      background: on ? '#156e80' : '#e1e8e9', padding: '1px 8px', borderRadius: 999,
                      marginLeft: 7, fontVariantNumeric: 'tabular-nums',
                    }}>{t.badge}</span>
                    <span style={{
                      position: 'absolute', top: 'calc(100% + 2px)', left: 2,
                      opacity: showTip ? 1 : 0, visibility: showTip ? 'visible' : 'hidden',
                      pointerEvents: 'none', transition: 'opacity .05s ease',
                      background: '#003143', color: '#fff', fontSize: 11, fontWeight: 500,
                      letterSpacing: 0, textTransform: 'none', padding: '6px 10px', borderRadius: 6,
                      whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,49,67,.28)', zIndex: 20,
                    }}>{t.tip}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
