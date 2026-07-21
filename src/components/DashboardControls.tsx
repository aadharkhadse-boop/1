export type SortKey = 'worst' | 'best' | 'oldest' | 'name' | 'owner' | 'hc' | 'hi' | 'pp' | 'dd';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  shownCount: number;
  totalCount: number;
  onExport: () => void;
}

export function DashboardControls({ query, onQueryChange, sort, onSortChange, shownCount, totalCount, onExport }: Props) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 'none' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#80a1aa', fontSize: 14 }}>⌕</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search vessel, owner or IMO"
            style={{ width: 280, padding: '10px 14px 10px 30px', border: '1px solid #cdd9dd', borderRadius: 999, font: 'inherit', fontSize: 13.5, color: '#003143', background: '#fff', outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: '#5d7780' }}>
            Showing <span style={{ fontWeight: 600, color: '#003143' }}>{shownCount}</span> of {totalCount} vessels · click any vessel for the full breakdown
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}>
            <span style={{ fontSize: 12, color: '#5d7780' }}>Sort</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              style={{ padding: '8px 12px', border: '1px solid #cdd9dd', borderRadius: 8, font: 'inherit', fontSize: 13, color: '#003143', background: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="worst">Worst excess power</option>
              <option value="best">Best excess power</option>
              <option value="oldest">Oldest vessel</option>
              <option value="name">Vessel name (A–Z)</option>
              <option value="owner">Ship owner</option>
              <option value="hc">Hull cleaning</option>
              <option value="hi">Hull inspection</option>
              <option value="pp">Propeller polishing</option>
              <option value="dd">Dry dock</option>
            </select>
          </div>
        </div>
        <button
          onClick={onExport}
          className="zn-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #156e80', background: '#156e80', color: '#fff', font: 'inherit', fontSize: 12.5, fontWeight: 500, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
        >
          ↓ Download list (Excel)
        </button>
      </div>
    </>
  );
}
