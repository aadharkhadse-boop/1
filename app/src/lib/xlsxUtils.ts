export type Cell = string | number | null;
export type SheetRows = Cell[][];

export function str(v: Cell): string {
  return v == null ? '' : String(v);
}

export function normLbl(label: Cell): string {
  return str(label).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findCol(hdr: Cell[], ...needles: string[]): number | null {
  for (let col = 0; col < hdr.length; col++) {
    if (hdr[col] == null) continue;
    const L = normLbl(hdr[col]);
    if (needles.every((n) => L.includes(n))) return col;
  }
  return null;
}

export function findColExact(hdr: Cell[], label: string): number | null {
  for (let col = 0; col < hdr.length; col++) {
    if (hdr[col] == null) continue;
    if (normLbl(hdr[col]) === label) return col;
  }
  return null;
}

export function findColsExact(hdr: Cell[], label: string): number[] {
  const r: number[] = [];
  for (let col = 0; col < hdr.length; col++) {
    if (hdr[col] == null) continue;
    if (normLbl(hdr[col]) === label) r.push(col);
  }
  return r;
}

export function between(cols: number[], a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return cols.find((x) => x > lo && x < hi) ?? null;
}

export function num(v: Cell): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isFinite(n) ? n : null;
}

export function decodeStr(v: Cell): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export function parseImo(v: Cell): string {
  return String(v || '').trim().replace(/\.0+$/, '');
}

export function get(row: Cell[], idx: number | null): Cell {
  return idx == null ? null : (row[idx] ?? null);
}
