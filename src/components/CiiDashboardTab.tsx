import { useMemo, useState, type CSSProperties } from 'react';
import type { CiiRating, CiiRow } from '../types';
import { CII_COLORS, CII_LABELS, CII_ORDER, ciiColor, fmt2, fmtCiiDate, fmtCiiPct, fmtEUA, fmtInt } from '../lib/ciiCalc';
import { exportCiiList } from '../lib/exportXls';
import { InfoDot } from './KpiTile';

interface Props {
  rows: CiiRow[];
}

type SortKey = 'imo' | 'vessel' | 'owner' | 'vtype' | 'dwt' | 'latest' | 'rating' | 'pct' | 'attained' | 'eua';

const RANK: Record<Exclude<CiiRating, ''>, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

const KPI_BOX: CSSProperties = { background: '#fff', border: '1px solid #cdd9dd', borderRadius: 12, padding: '15px 17px', boxShadow: '0 1px 2px rgba(0,49,67,.06)', display: 'flex', flexDirection: 'column', gap: 4 };

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' | 'center' }[] = [
  { key: 'imo', label: 'IMO No.', align: 'left' },
  { key: 'vessel', label: 'Vessel', align: 'left' },
  { key: 'owner', label: 'Ship Owner', align: 'left' },
  { key: 'vtype', label: 'Vessel Type', align: 'left' },
  { key: 'dwt', label: 'DWT', align: 'right' },
  { key: 'latest', label: 'Latest Data (UTC)', align: 'left' },
  { key: 'rating', label: 'CII Rating', align: 'center' },
  { key: 'pct', label: 'CII %', align: 'right' },
  { key: 'attained', label: 'CII Attained', align: 'right' },
  { key: 'eua', label: 'EUA (€)', align: 'right' },
];

export function CiiDashboardTab({ rows }: Props) {
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('All owners');
  const [vtype, setVtype] = useState('All types');
  const [rating, setRating] = useState<CiiRating | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('vessel');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const total = rows.length;
  const counts: Record<Exclude<CiiRating, ''>, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let euaSum = 0;
  rows.forEach((r) => { if (r.rating) counts[r.rating]++; if (r.eua) euaSum += r.eua; });
  const good = counts.A + counts.B, poor = counts.D + counts.E;

  const kpis = [
    { label: 'Vessels rated', value: String(total), sub: 'CII rating assigned (June 2026)', color: '#003143', info: 'Vessels with a CII rating assigned for the June 2026 reporting period.' },
    { label: 'A & B — compliant', value: String(good), sub: `${good} of ${total} (${total ? Math.round(good / total * 100) : 0}%)`, color: '#157f5f', info: 'Vessels rated A or B — carbon intensity at or better than the IMO required trajectory.' },
    { label: 'D & E — attention', value: String(poor), sub: 'inferior or poor rating', color: '#a52a52', info: 'Vessels rated D or E — inferior or poor carbon intensity. A corrective action plan may be required.' },
    { label: 'EU ETS exposure', value: fmtEUA(euaSum), sub: 'total EUA @ 100% · June 2026', color: '#003143', info: 'Total EU ETS allowance cost (EUA) at 100% price across the fleet for the reporting month.' },
  ];

  const ownerOptions = useMemo(() => ['All owners', ...Array.from(new Set(rows.map((r) => r.owner).filter(Boolean))).sort()], [rows]);
  const typeOptions = useMemo(() => ['All types', ...Array.from(new Set(rows.map((r) => r.vtype).filter(Boolean))).sort()], [rows]);

  const qq = q.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (rating && r.rating !== rating) return false;
    if (owner !== 'All owners' && r.owner !== owner) return false;
    if (vtype !== 'All types' && r.vtype !== vtype) return false;
    if (qq && !((r.vessel || '').toLowerCase().includes(qq) || (r.owner || '').toLowerCase().includes(qq) || String(r.imo).includes(qq))) return false;
    return true;
  });

  const val = (r: CiiRow): string | number | null => (sortKey === 'rating' ? (r.rating ? RANK[r.rating] : 99) : r[sortKey]);
  const list = filtered.slice().sort((a, b) => {
    const x = val(a), y = val(b);
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * sortDir;
    return ((x as number) - (y as number)) * sortDir;
  });

  const onSortClick = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const handleExport = () => {
    exportCiiList(list.map((r) => ({
      imo: r.imo, vessel: r.vessel, owner: r.owner, vtype: r.vtype, dwt: r.dwt,
      latestFmt: fmtCiiDate(r.latest), rating: r.rating, pct: r.pct, attained: r.attained, eua: r.eua,
    })), 'fleet-cii-' + new Date().toISOString().slice(0, 10));
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} style={KPI_BOX}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#5d7780' }}>{k.label}</span>
              <InfoDot color="#8aa2a9" text={k.info} width={210} />
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#6a8790' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #cdd9dd', borderRadius: 12, padding: '16px 18px', marginBottom: 18, boxShadow: '0 1px 2px rgba(0,49,67,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#003143' }}>
            CII rating distribution <span style={{ fontWeight: 400, color: '#80a1aa' }}>· {total} vessels · attained vs. required</span>
          </div>
          <div style={{ fontSize: 12, color: '#80a1aa' }}>A superior · B minor superior · C moderate · D inferior · E poor</div>
        </div>
        <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: '#eef2f2' }}>
          {CII_ORDER.map((k) => {
            const cnt = counts[k as Exclude<CiiRating, ''>], pct = total ? cnt / total * 100 : 0, on = rating === k;
            return (
              <div
                key={k}
                onClick={() => setRating((prev) => (prev === k ? null : k))}
                title={`CII ${k} — ${cnt} vessels`}
                style={{ width: pct + '%', background: CII_COLORS[k as Exclude<CiiRating, ''>], cursor: 'pointer', opacity: rating && !on ? 0.35 : 1, transition: 'opacity .15s' }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          {CII_ORDER.map((k) => {
            const key = k as Exclude<CiiRating, ''>;
            const cnt = counts[key], on = rating === k;
            return (
              <div
                key={k}
                onClick={() => setRating((prev) => (prev === k ? null : k))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 4px', borderRadius: 6, opacity: rating && !on ? 0.4 : 1 }}
              >
                <span style={{ width: 11, height: 11, borderRadius: 3, background: CII_COLORS[key], flex: 'none', boxShadow: on ? `0 0 0 2px #fff, 0 0 0 3.5px ${CII_COLORS[key]}` : 'none' }} />
                <span style={{ fontSize: 12.5, color: '#2a4a55' }}><span style={{ fontWeight: 600, color: '#003143' }}>{cnt}</span> {CII_LABELS[key]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vessel, owner or IMO"
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #cdd9dd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#003143', background: '#fff', outline: 'none' }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8aa2a9', fontSize: 13 }}>⌕</span>
        </div>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #cdd9dd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#003143', background: '#fff', outline: 'none', cursor: 'pointer', maxWidth: 230 }}>
          {ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={vtype} onChange={(e) => setVtype(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #cdd9dd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#003143', background: '#fff', outline: 'none', cursor: 'pointer' }}>
          {typeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {CII_ORDER.map((k) => {
            const on = rating === k;
            const key = k as Exclude<CiiRating, ''>;
            return (
              <button
                key={k}
                onClick={() => setRating((prev) => (prev === k ? null : k))}
                style={{ width: 30, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid ' + (on ? CII_COLORS[key] : '#cdd9dd'), background: on ? CII_COLORS[key] : '#fff', color: on ? '#fff' : CII_COLORS[key] }}
              >
                {k}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: '#6a8790' }}>{list.length} of {total}</span>
        <button onClick={handleExport} className="zn-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1px solid #156e80', background: '#156e80', color: '#fff', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Export .xls
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #cdd9dd', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,49,67,.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3f7f7' }}>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="cii-th"
                    onClick={() => onSortClick(c.key)}
                    style={{ position: 'sticky', top: 0, background: '#f3f7f7', padding: '11px 14px', textAlign: c.align, fontSize: 11, fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', color: sortKey === c.key ? '#156e80' : '#5d7780', whiteSpace: 'nowrap', borderBottom: '1px solid #d9e2e3', zIndex: 1, cursor: 'pointer', userSelect: 'none' }}
                  >
                    {c.label}<span style={{ color: '#156e80' }}>{sortKey === c.key ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.imo} className="cii-row" style={{ borderTop: '1px solid #e6eded' }}>
                  <td style={{ padding: '9px 14px', color: '#5d7780', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.imo}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: '#003143', whiteSpace: 'nowrap' }}>{r.vessel || '—'}</td>
                  <td style={{ padding: '9px 14px', color: '#2a4a55' }}>{r.owner || '—'}</td>
                  <td style={{ padding: '9px 14px', color: '#5d7780', whiteSpace: 'nowrap' }}>{r.vtype || '—'}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#2a4a55', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtInt(r.dwt)}</td>
                  <td style={{ padding: '9px 14px', color: '#5d7780', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtCiiDate(r.latest)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, fontSize: 12.5, fontWeight: 700, color: '#fff', background: ciiColor(r.rating) }}>{r.rating || '—'}</span>
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#003143', fontVariantNumeric: 'tabular-nums', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtCiiPct(r.pct)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#2a4a55', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt2(r.attained)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: r.eua ? '#a52a52' : '#9fb2b6', fontWeight: r.eua ? 600 : 400 }}>{fmtEUA(r.eua)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8aa2a9', fontSize: 13 }}>No vessels match the current filters.</div>
        ) : null}
      </div>
    </div>
  );
}
