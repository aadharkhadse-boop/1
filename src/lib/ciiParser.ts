import type { CiiRating, CiiRow } from '../types';
import { decodeStr, findCol, findColExact, get, normLbl, num, parseImo, type SheetRows } from './xlsxUtils';

export interface CiiParseInput {
  rows: SheetRows;
}

function ratingLetter(raw: string): CiiRating {
  const m = raw.trim().toUpperCase().match(/[A-E]/);
  return (m ? m[0] : '') as CiiRating;
}

/** Detects the CII sheet (header row containing both "cii rating" and "cii percentage" within the first 5 rows) and uses the last matching sheet, mirroring the source component. */
export function parseCiiRows(sheets: CiiParseInput[]): CiiRow[] {
  let best: { rows: SheetRows; hi: number } | null = null;
  for (const { rows } of sheets) {
    let hi = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const vals = (rows[i] || []).map((v) => normLbl(v));
      if (vals.some((v) => v.includes('cii rating')) && vals.some((v) => v.includes('cii percentage'))) { hi = i; break; }
    }
    if (hi >= 0) best = { rows, hi };
  }
  if (!best) return [];
  const { rows, hi } = best;
  const hdr = rows[hi];
  const c = {
    imo: findCol(hdr, 'imo'),
    vessel: findColExact(hdr, 'vessel') ?? findCol(hdr, 'vessel'),
    owner: findCol(hdr, 'ship owner') ?? findCol(hdr, 'owner'),
    vtype: findColExact(hdr, 'vessel type') ?? findCol(hdr, 'vessel type'),
    dwt: findColExact(hdr, 'dwt') ?? findCol(hdr, 'dwt'),
    latest: findCol(hdr, 'latest data'),
    rating: findColExact(hdr, 'cii rating') ?? findCol(hdr, 'cii rating'),
    pct: findColExact(hdr, 'cii percentage') ?? findCol(hdr, 'cii percentage'),
    attained: findCol(hdr, 'cii attained'),
    eua: findCol(hdr, 'eua'),
  };

  const out: CiiRow[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const imo = parseImo(get(row, c.imo));
    if (!/^\d{6,}$/.test(imo)) continue;
    out.push({
      imo,
      vessel: decodeStr(get(row, c.vessel)) || '',
      owner: decodeStr(get(row, c.owner)) || '',
      vtype: decodeStr(get(row, c.vtype)) || '',
      dwt: num(get(row, c.dwt)),
      latest: num(get(row, c.latest)),
      rating: ratingLetter(decodeStr(get(row, c.rating)) || ''),
      pct: num(get(row, c.pct)),
      attained: num(get(row, c.attained)),
      eua: num(get(row, c.eua)),
    });
  }
  return out;
}
