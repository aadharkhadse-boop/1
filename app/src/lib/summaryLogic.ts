import type { Thresholds, Vessel, VesselWithTier } from '../types';
import { authOf } from './engineCalc';

export const DEV_LIM = 10;

/** ---- Hull summary triage: ME excess power >= critical AND/OR deviation >= 10% ---- */
export function hullSummaryBands(all: VesselWithTier[], th: Thresholds) {
  const epLim = th.critical;
  const epHi = (c: VesselWithTier) => c.ep != null && c.ep >= epLim;
  const devHi = (c: VesselWithTier) => c.epDev != null && c.epDev >= DEV_LIM;
  const bBoth: VesselWithTier[] = [], bOne: VesselWithTier[] = [], bNone: VesselWithTier[] = [];
  all.forEach((c) => {
    const a = epHi(c), b = devHi(c);
    if (a && b) bBoth.push(c);
    else if (a || b) bOne.push(c);
    else bNone.push(c);
  });
  return { epLim, devLim: DEV_LIM, bBoth, bOne, bNone };
}

export const ME_HI = 20;
export const AE_HI = 20;

function devBandOf(num: number | null, hi: number): 0 | 1 | 2 {
  if (num == null) return 0;
  if (Math.abs(num) >= hi) return 2;
  if (Math.abs(num) >= 10) return 1;
  return 0;
}

const meLoadOf = (c: Vessel) => authOf(c, c.meLoadS, c.meLoadN).num;
const aeLoadOf = (c: Vessel) => authOf(c, c.axLoadS, c.axLoadN).num;
const meLoadOk = (c: Vessel) => { const l = meLoadOf(c); return l != null && l > 20; };
const aeLoadOk = (c: Vessel) => { const l = aeLoadOf(c); return l != null && l > 20; };

export function meMetricOf(c: Vessel) { return authOf(c, c.meDevS, c.meDevN); }
export function aeMetricOf(c: Vessel) { return authOf(c, c.axDevS, c.axDevN); }
export function boMetricOf(c: Vessel) { return authOf(c, c.boilS, c.boilN); }

/** ---- Smart Analytics summary triage: ME / AE by SFOC deviation, Boiler by excess consumption ---- */
export function engineSummaryBands(all: Vessel[]) {
  const meB: Record<0 | 1 | 2, Vessel[]> = { 0: [], 1: [], 2: [] };
  const aeB: Record<0 | 1 | 2, Vessel[]> = { 0: [], 1: [], 2: [] };
  const boB: Record<0 | 1, Vessel[]> = { 0: [], 1: [] };

  all.forEach((c) => {
    if (!meLoadOk(c)) return;
    const n = meMetricOf(c).num;
    if (n == null || n < 0) return;
    meB[devBandOf(n, ME_HI)].push(c);
  });
  all.forEach((c) => {
    if (!aeLoadOk(c)) return;
    const n = aeMetricOf(c).num;
    if (n == null || n < 0) return;
    aeB[devBandOf(n, AE_HI)].push(c);
  });
  all.forEach((c) => {
    const n = boMetricOf(c).num;
    (n != null && n > 0 ? boB[1] : boB[0]).push(c);
  });

  const engImmediate = new Set([...meB[2], ...aeB[2]].map((c) => c.imo)).size;
  return { meB, aeB, boB, engImmediate };
}
