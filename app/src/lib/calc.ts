import type { DevBand, StwBand, Thresholds, TierKey, VesselWithTier } from '../types';

export interface Tier {
  c: string;
  soft: string;
  txt: string;
  label: string;
}

export const TIER: Record<TierKey, Tier> = {
  good: { c: '#50b18c', soft: '#deefe9', txt: '#2f7d5f', label: 'Good' },
  watch: { c: '#e0a500', soft: '#fff4cc', txt: '#8a6a00', label: 'Watch' },
  alert: { c: '#f06a2d', soft: '#fde2d6', txt: '#c44a14', label: 'Alert' },
  critical: { c: '#952850', soft: '#f5dae3', txt: '#952850', label: 'Critical' },
  nodata: { c: '#b8c4c7', soft: '#eef2f2', txt: '#5d7780', label: 'No data' },
};

export function tierOf(ep: number | null, th: Thresholds): TierKey {
  if (ep == null) return 'nodata';
  if (ep < th.watch) return 'good';
  if (ep < th.alert) return 'watch';
  if (ep < th.critical) return 'alert';
  return 'critical';
}

export function devBand(v: number | null): DevBand {
  if (v == null) return 'nodev';
  if (v > 20) return 'sharp';
  if (v > 10) return 'worse';
  if (v < 0) return 'improved';
  return 'stable';
}

export function stwBand(v: number | null): StwBand {
  if (v == null) return 'nostw';
  return Math.abs(v) <= 0.5 ? 'aligned' : 'high';
}

export function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
}

export const fmtDev = fmtPct;

export function fmtStw(v: number | null): string {
  if (v == null) return '—';
  return (v > 0 ? '+' : '') + v.toFixed(2) + ' kn';
}

export function monthsTxt(v: number | null): string {
  if (v == null) return 'n/a';
  return v === 0 ? 'this month' : v + ' mo';
}

export interface SparkPoint { i: number; x: number; y: number; }
export interface Spark { points: string; area: string; lo: number; hi: number; coords: SparkPoint[]; }

export function spark(series: (number | null)[], w: number, h: number): Spark {
  const present = series.map((v, i) => [i, v] as const).filter((p): p is [number, number] => p[1] != null);
  if (present.length < 2) {
    const y = +(h / 2).toFixed(1);
    const coords: SparkPoint[] = present.length ? [{ i: present[0][0], x: present[0][0] / (series.length - 1) * w, y }] : [];
    return {
      points: `0,${y} ${w},${y}`,
      area: `M0,${h} L0,${y} L${w},${y} L${w},${h} Z`,
      lo: present.length ? present[0][1] : 0,
      hi: present.length ? present[0][1] : 0,
      coords,
    };
  }
  const nums = present.map((p) => p[1]);
  const lo = Math.min(...nums), hi = Math.max(...nums), rng = Math.max(1, hi - lo);
  const n = series.length, padT = 4, padB = 4;
  const xs = (i: number) => w * (i / (n - 1));
  const ys = (val: number) => padT + (h - padT - padB) * (1 - (val - lo) / rng);
  const pts = present.map(([i, v]) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`);
  const points = pts.join(' ');
  const area = `M${xs(present[0][0]).toFixed(1)},${h - padB} ${pts.map((p) => 'L' + p).join(' ')} L${xs(present[present.length - 1][0]).toFixed(1)},${h - padB} Z`;
  const coords = present.map(([i, v]) => ({ i, x: +xs(i).toFixed(1), y: +ys(v).toFixed(1) }));
  return { points, area, lo, hi, coords };
}

export function devColor(v: number | null): string {
  if (v == null) return '#80a1aa';
  if (v > 10) return '#c44a14';
  if (v < -10) return '#2f7d5f';
  return '#2a4a55';
}

export function tierOfAll(rows: import('../types').Vessel[], th: Thresholds): VesselWithTier[] {
  return rows.map((v) => ({ ...v, tier: tierOf(v.ep, th) }));
}
