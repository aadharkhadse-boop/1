import type { ReactNode } from 'react';
import { InfoDot } from './KpiTile';

export interface Segment {
  key: string;
  count: number;
  label: string;
  color: string;
}

interface Props {
  title: ReactNode;
  titleNote?: string;
  info: string;
  infoWidth?: number;
  legend: string;
  segments: Segment[];
  total: number;
  activeKey: string;
  onToggle: (key: string) => void;
}

export function BreakdownBar({ title, titleNote, info, infoWidth, legend, segments, total, activeKey, onToggle }: Props) {
  return (
    <div style={{ position: 'relative', background: '#fff', border: '1px solid #cdd9dd', borderRadius: 12, padding: '16px 18px', marginBottom: 18, boxShadow: '0 1px 2px rgba(0,49,67,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#003143' }}>
          {title} {titleNote ? <span style={{ fontWeight: 400, color: '#80a1aa' }}>· {titleNote}</span> : null}
          <InfoDot color="#8aa2a9" text={info} width={infoWidth ?? 230} />
        </div>
        <div style={{ fontSize: 12, color: '#80a1aa', whiteSpace: 'nowrap' }}>{legend}</div>
      </div>
      <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: '#eef2f2' }}>
        {segments.map((s) => {
          const on = activeKey === s.key;
          return (
            <div
              key={s.key}
              onClick={() => onToggle(s.key)}
              title={`${s.label}: ${s.count} vessels (click to filter)`}
              style={{ width: (total ? (s.count / total * 100) : 0) + '%', background: s.color, cursor: 'pointer', opacity: (activeKey === 'all' || on) ? 1 : 0.35, transition: 'opacity .15s' }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        {segments.map((s) => {
          const on = activeKey === s.key;
          return (
            <div
              key={s.key}
              onClick={() => onToggle(s.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '3px 9px', borderRadius: 999, border: '1px solid ' + (on ? s.color : 'transparent'), background: on ? s.color + '1a' : 'transparent', transition: 'all .15s' }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block', flex: 'none' }} />
              <span style={{ fontSize: 12.5, color: '#2a4a55' }}><span style={{ fontWeight: 600, color: '#003143' }}>{s.count}</span> {s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
