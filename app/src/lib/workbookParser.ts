import * as XLSX from 'xlsx';
import type { Vessel } from '../types';
import { MONTHS } from './calc';
import { engNum } from './engineCalc';
import { parseCiiRows, type CiiParseInput } from './ciiParser';
import {
  between, decodeStr, findCol, findColExact, findColsExact, get, num, parseImo, str,
  type Cell, type SheetRows,
} from './xlsxUtils';

function naNum(v: Cell): number | null {
  if (v == null || /n\/?a/i.test(String(v))) return null;
  const n = parseFloat(String(v));
  return isFinite(n) ? n : null;
}

interface MonthRec {
  imo: string; vessel: string; owner: string;
  level: string | null; conf: string | null; age: number | null;
  dd: Cell; hc: Cell; hins: Cell; stwDev: number | null;
  hindSensor: number | null; hindNoon: number | null;
  ai: number | null; logSensor: number | null; logNoon: number | null;
  hullPerf: string | null;
  meLoadS: Cell; meSfocS: Cell; meShopS: Cell; meDevS: Cell;
  meLoadN: Cell; meSfocN: Cell; meShopN: Cell; meDevN: Cell;
  scocS: Cell; scocN: Cell;
  axLoadS: Cell; axSfocS: Cell; axShopS: Cell; axDevS: Cell;
  axLoadN: Cell; axSfocN: Cell; axShopN: Cell; axDevN: Cell;
  boilS: Cell; boilN: Cell;
  meCmt: string | null; aeCmt: string | null; boCmt: string | null;
}

interface SheetParseResult {
  data: Record<string, MonthRec>;
  actionMap: Record<string, string>;
}

function parseSheetToMonthRecords(rows: SheetRows): SheetParseResult | null {
  let hi = -1;
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const vals = (rows[i] || []).map((v) => str(v));
    if (vals.some((v) => /imo/i.test(v)) && vals.some((v) => /hull\s*clean/i.test(v))) { hi = i; break; }
  }
  if (hi < 0) return null;
  const hdr = rows[hi];
  const F = (...n: string[]) => findCol(hdr, ...n);
  const E = (l: string) => findColExact(hdr, l);
  const c = {
    imo: F('imo'), vessel: F('vessel', 'name') ?? F('vessel'),
    owner: F('shipowner') ?? F('owner'),
    level: F('level'), conf: F('confidence'), age: F('age'),
    dd: F('dry', 'dock'), hc: F('hull', 'clean'), hins: F('hull', 'inspection'),
    stwDev: F('log', 'stw'),
    hindSensor: F('hindast', 'sensor') ?? F('hindcast', 'sensor'),
    hindNoon: F('hindcast', 'noon') ?? F('hindast', 'noon'),
    ai: F('ai'), logSensor: F('log', 'sensor'), logNoon: F('log', 'noon'),
    hullPerf: F('hull', 'performance'),
    meLoadS: F('load (%)', 'sensor'), meSfocS: F('me sfoc', 'sensor'), meShopS: F('shop trial', 'sensor'), meDevS: F('sfoc deviation', 'sensor'),
    meLoadN: F('load (%)', 'noon'), meSfocN: F('me sfoc', 'noon'), meShopN: F('shop trial', 'noon'), meDevN: F('sfoc deviation', 'noon'),
    scocS: F('me scoc', 'sensor'), scocN: F('me scoc', 'noon'),
    axLoadS: E('load sensor'), axSfocS: E('ge sfoc sensor'), axDevS: E('deviation sensor'),
    axLoadN: E('load noon'), axSfocN: E('ge sfoc noon'), axDevN: E('deviation noon'),
    boilS: F('excess consumption', 'sensor'), boilN: F('excess consumption', 'noon'),
    meCmt: F('me performance', 'comment'), aeCmt: F('ae performance', 'comment'), boCmt: F('boiler performance', 'comment'),
  };
  const shops = findColsExact(hdr, 'ge sfoc shop trail');
  const axShopS = between(shops, c.axSfocS, c.axDevS);
  const axShopN = between(shops, c.axSfocN, c.axDevN);

  const actionCol = findCol(hdr, 'action', 'required');

  const data: Record<string, MonthRec> = {};
  const actionMap: Record<string, string> = {};
  for (let i = hi + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const imo = parseImo(get(row, c.imo));
    if (!/^\d{6,}$/.test(imo)) continue;
    if (actionCol != null) {
      const val = decodeStr(get(row, actionCol));
      if (val) actionMap[imo] = val;
    }
    data[imo] = {
      imo, vessel: decodeStr(get(row, c.vessel)) || '', owner: decodeStr(get(row, c.owner)) || '',
      level: get(row, c.level) as string | null, conf: get(row, c.conf) as string | null, age: num(get(row, c.age)),
      dd: get(row, c.dd), hc: get(row, c.hc), hins: get(row, c.hins), stwDev: num(get(row, c.stwDev)),
      hindSensor: num(get(row, c.hindSensor)), hindNoon: num(get(row, c.hindNoon)),
      ai: num(get(row, c.ai)), logSensor: num(get(row, c.logSensor)), logNoon: num(get(row, c.logNoon)),
      hullPerf: decodeStr(get(row, c.hullPerf)),
      meLoadS: get(row, c.meLoadS), meSfocS: get(row, c.meSfocS), meShopS: get(row, c.meShopS), meDevS: get(row, c.meDevS),
      meLoadN: get(row, c.meLoadN), meSfocN: get(row, c.meSfocN), meShopN: get(row, c.meShopN), meDevN: get(row, c.meDevN),
      scocS: get(row, c.scocS), scocN: get(row, c.scocN),
      axLoadS: get(row, c.axLoadS), axSfocS: get(row, c.axSfocS), axShopS: get(row, axShopS), axDevS: get(row, c.axDevS),
      axLoadN: get(row, c.axLoadN), axSfocN: get(row, c.axSfocN), axShopN: get(row, axShopN), axDevN: get(row, c.axDevN),
      boilS: get(row, c.boilS), boilN: get(row, c.boilN),
      meCmt: decodeStr(get(row, c.meCmt)), aeCmt: decodeStr(get(row, c.aeCmt)), boCmt: decodeStr(get(row, c.boCmt)),
    };
  }
  return { data, actionMap };
}

function epOf(v: MonthRec | undefined): number | null {
  if (!v) return null;
  return v.hindSensor != null ? v.hindSensor : (v.hindNoon != null ? v.hindNoon : null);
}

function authNum(rec: MonthRec | undefined, sKey: keyof MonthRec, nKey: keyof MonthRec): number | null {
  if (!rec) return null;
  const isL2 = /l2/i.test(String(rec.level || ''));
  let p = isL2 ? engNum(rec[sKey] as Cell as string) : engNum(rec[nKey] as Cell as string);
  if (p != null) return p;
  return isL2 ? engNum(rec[nKey] as Cell as string) : engNum(rec[sKey] as Cell as string);
}

export interface ParseResult {
  vessels: Vessel[];
  monthCount: number;
  ciiRows: ReturnType<typeof parseCiiRows>;
}

export function parseWorkbookBuffer(buf: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buf, { type: 'array' });
  const reports: Record<string, MonthRec>[] = [];
  const actionMap: Record<string, string> = {};
  const allSheets: CiiParseInput[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, defval: null, raw: true }) as SheetRows;
    allSheets.push({ rows });
    const parsed = parseSheetToMonthRecords(rows);
    if (parsed) { reports.push(parsed.data); Object.assign(actionMap, parsed.actionMap); }
  }
  const months = MONTHS;
  const per = reports.slice(0, months.length);
  const cur = per[per.length - 1] || {};
  const last = per.length - 1;

  const vessels: Vessel[] = [];
  for (const imo of Object.keys(cur)) {
    const v = cur[imo];
    const series = per.map((m) => epOf(m[imo]));
    const ep = epOf(v);
    const dd = naNum(v.dd);
    const hc = naNum(v.hc);
    const hins = naNum(v.hins);
    const acts = [dd, hc].filter((x): x is number => x != null && isFinite(x));
    const lastAct = acts.length ? Math.min(...acts) : null;
    const actType = lastAct == null ? null : (dd != null && dd === lastAct ? (hc != null && hc === lastAct ? 'Dry dock + hull clean' : 'Dry dock') : 'Hull cleaning');

    let dev6m: number | null = null, refMonth6: string | null = null;
    {
      let first: { ep: number; i: number } | null = null;
      for (let i = 0; i <= last; i++) { if (series[i] != null) { first = { ep: series[i]!, i }; break; } }
      if (ep != null && first != null && first.i < last) { dev6m = +(ep - first.ep).toFixed(2); refMonth6 = months[first.i]; }
    }
    let devAct: number | null = null, refMonthAct: string | null = null;
    if (lastAct != null && ep != null) {
      const idx = Math.max(0, last - Math.round(lastAct));
      let r: { ep: number; i: number } | null = null;
      for (let i = idx; i <= last; i++) { if (series[i] != null) { r = { ep: series[i]!, i }; break; } }
      if (r == null) { for (let i = idx; i >= 0; i--) { if (series[i] != null) { r = { ep: series[i]!, i }; break; } } }
      if (r != null && r.i < last) { devAct = +(ep - r.ep).toFixed(2); refMonthAct = months[r.i]; }
    }
    const epDev = devAct != null ? devAct : dev6m;

    vessels.push({
      imo: v.imo, vessel: v.vessel, owner: v.owner, level: v.level, confidence: v.conf, age: v.age,
      actionYes: /^yes$/i.test(actionMap[imo] || ''),
      ep: ep != null ? +ep.toFixed(2) : null,
      epSensor: v.hindSensor != null ? +v.hindSensor.toFixed(2) : null,
      epNoon: v.hindNoon != null ? +v.hindNoon.toFixed(2) : null,
      epSource: v.hindSensor != null ? 'Hindcast sensor' : (v.hindNoon != null ? 'Hindcast noon' : 'No data'),
      ai: v.ai, logSensor: v.logSensor, logNoon: v.logNoon,
      epDev, dev6m, refMonth6, devAct, refMonthAct,
      ddMonths: dd, hcMonths: hc, hiMonths: hins, lastActMonths: lastAct, lastActType: actType,
      stwDev: v.stwDev, series, hullPerf: v.hullPerf,
      meLoadS: str(v.meLoadS) || null, meSfocS: str(v.meSfocS) || null, meShopS: str(v.meShopS) || null, meDevS: str(v.meDevS) || null,
      meLoadN: str(v.meLoadN) || null, meSfocN: str(v.meSfocN) || null, meShopN: str(v.meShopN) || null, meDevN: str(v.meDevN) || null,
      scocS: str(v.scocS) || null, scocN: str(v.scocN) || null,
      axLoadS: str(v.axLoadS) || null, axSfocS: str(v.axSfocS) || null, axShopS: str(v.axShopS) || null, axDevS: str(v.axDevS) || null,
      axLoadN: str(v.axLoadN) || null, axSfocN: str(v.axSfocN) || null, axShopN: str(v.axShopN) || null, axDevN: str(v.axDevN) || null,
      boilS: str(v.boilS) || null, boilN: str(v.boilN) || null,
      meCmt: v.meCmt, aeCmt: v.aeCmt, boCmt: v.boCmt,
      meDevSeries: per.map((m) => authNum(m[imo], 'meDevS', 'meDevN')),
      meSfocSeries: per.map((m) => authNum(m[imo], 'meSfocS', 'meSfocN')),
      scocSeries: per.map((m) => authNum(m[imo], 'scocS', 'scocN')),
      aeDevSeries: per.map((m) => authNum(m[imo], 'axDevS', 'axDevN')),
      aeSfocSeries: per.map((m) => authNum(m[imo], 'axSfocS', 'axSfocN')),
      boilSeries: per.map((m) => authNum(m[imo], 'boilS', 'boilN')),
      levelSeries: per.map((m) => (m[imo] && m[imo].level) ? (m[imo].level as string) : null),
    });
  }
  const ciiRows = parseCiiRows(allSheets);
  return { vessels, monthCount: per.length, ciiRows };
}
