import type { Vessel } from '../types';

export const isL2 = (v: Vessel) => /l2/i.test(String(v.level || ''));
export const isL1 = (v: Vessel) => /l1/i.test(String(v.level || ''));

export interface EngVal { v: string; data: boolean; }

export function fmtEng(raw: string | null): EngVal {
  if (raw == null) return { v: '—', data: false };
  const s = String(raw).trim();
  if (s === '' || /^(l1|l2|na|n\/a|-|nan)$/i.test(s)) return { v: '—', data: false };
  const n = parseFloat(s.replace(/,/g, ''));
  if (isFinite(n)) return { v: Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2), data: true };
  return { v: s, data: true };
}

export interface AuthVal { v: string; num: number | null; src: 'Sensor' | 'Noon'; has: boolean; }

/** Authoritative reading by level: sensor for L2, noon for L1 (fallback to other side). */
export function authOf(v: Vessel, sRaw: string | null, nRaw: string | null): AuthVal {
  const useS = isL2(v);
  const primary = useS ? sRaw : nRaw, secondary = useS ? nRaw : sRaw;
  let f = fmtEng(primary);
  let src: 'Sensor' | 'Noon' = useS ? 'Sensor' : 'Noon';
  if (!f.data) {
    const g = fmtEng(secondary);
    if (g.data) { f = g; src = useS ? 'Noon' : 'Sensor'; }
  }
  return { v: f.v, num: f.data ? parseFloat(f.v) : null, src, has: f.data };
}

export function devColorEng(n: number | null): string {
  if (n == null) return '#80a1aa';
  if (Math.abs(n) >= 20) return '#c44a14';
  if (Math.abs(n) >= 10) return '#b88a00';
  return '#2f7d5f';
}

/** authoritative numeric for an engine metric in a given month record (sensor for L2, noon for L1, fallback other side) */
export function engNum(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '' || /^(l1|l2|na|n\/a|-|nan)$/i.test(s)) return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return isFinite(n) ? n : null;
}
