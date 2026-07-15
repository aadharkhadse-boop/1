import { useCallback, useEffect, useState } from 'react';
import type { CiiRow, Vessel } from '../types';
import { parseWorkbookBuffer } from '../lib/workbookParser';

const CACHE_KEY = 'znFleetData_v4';
const SAMPLE_URL = '/data/Combined_Monthly_Performance_Report_Jan-June_2026.xlsx';
const SAMPLE_LABEL = 'Combined_Monthly_Performance_Report_Jan-June_2026.xlsx (sample)';

interface Meta { monthCount: number; sourceName: string; }
interface CachedData { vessels: Vessel[]; ciiRows: CiiRow[]; meta: Meta; }

export function useFleetData() {
  const [vessels, setVessels] = useState<Vessel[] | null>(null);
  const [ciiRows, setCiiRows] = useState<CiiRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Reading performance workbook…');
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback((): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        setVessels(parsed.vessels);
        setCiiRows(parsed.ciiRows || []);
        setMeta(parsed.meta);
        setLoading(false);
        return true;
      }
    } catch { /* ignore corrupt cache */ }
    return false;
  }, []);

  const applyParsed = useCallback((rows: Vessel[], cii: CiiRow[], m: Meta) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ vessels: rows, ciiRows: cii, meta: m })); } catch { /* ignore quota errors */ }
    setVessels(rows);
    setCiiRows(cii);
    setMeta(m);
  }, []);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingText('Reading performance workbook…');
    try {
      const resp = await fetch(SAMPLE_URL);
      const buf = await resp.arrayBuffer();
      const { vessels: rows, monthCount, ciiRows: cii } = parseWorkbookBuffer(buf);
      applyParsed(rows, cii, { monthCount, sourceName: SAMPLE_LABEL });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [applyParsed]);

  useEffect(() => {
    if (!loadFromCache()) loadSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setLoadingText('Reading ' + file.name + '…');
    try {
      const buf = await file.arrayBuffer();
      const { vessels: rows, monthCount, ciiRows: cii } = parseWorkbookBuffer(buf);
      if (rows.length === 0) throw new Error('No vessel rows found — check the workbook has monthly report sheets with IMO and Hull Cleaning columns.');
      applyParsed(rows, cii, { monthCount, sourceName: file.name });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [applyParsed]);

  const resetToSample = useCallback(() => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    loadSample();
  }, [loadSample]);

  return { vessels, ciiRows, meta, loading, loadingText, error, uploadFile, resetToSample };
}
