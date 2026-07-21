import type { CiiRating } from '../types';

export const CII_ORDER: CiiRating[] = ['A', 'B', 'C', 'D', 'E'];

export const CII_COLORS: Record<Exclude<CiiRating, ''>, string> = {
  A: '#157f5f', B: '#5aa469', C: '#d9a400', D: '#e2662a', E: '#a52a52',
};

export const CII_LABELS: Record<Exclude<CiiRating, ''>, string> = {
  A: 'rated A', B: 'rated B', C: 'rated C', D: 'rated D', E: 'rated E',
};

export function ciiColor(rating: CiiRating): string {
  return rating ? CII_COLORS[rating] : '#b7c4c7';
}

function excelDate(serial: number | null): Date | null {
  if (serial == null) return null;
  const n = serial;
  return isFinite(n) ? new Date(Math.round((n - 25569) * 86400000)) : null;
}

export function fmtCiiDate(serial: number | null): string {
  const d = excelDate(serial);
  if (!d || isNaN(d.getTime())) return '—';
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getUTCDate())} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function fmtInt(v: number | null): string {
  return v == null ? '—' : Math.round(v).toLocaleString('en-US');
}

export function fmtEUA(v: number | null): string {
  return v == null ? '—' : '€' + Math.round(v).toLocaleString('en-US');
}

export function fmtCiiPct(v: number | null): string {
  return v == null ? '—' : (v * 100).toFixed(0) + '%';
}

export function fmt2(v: number | null): string {
  return v == null ? '—' : v.toFixed(2);
}
