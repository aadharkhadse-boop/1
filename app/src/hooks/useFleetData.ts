import { useCallback, useEffect, useState } from 'react';
import type { Vessel } from '../types';
import { parseWorkbookBuffer } from '../lib/workbookParser';

const CACHE_KEY = 'znFleetData_v3';
const CACHE_META_KEY = 'znFleetDataMeta_v3';
const SAMPLE_URL = '/data/Combined_Monthly_Performance_Report_Jan-June_2026.xlsx';
const SAMPLE_LABEL = 'Combined_Monthly_Performance_Report_Jan-June_2026.xlsx (sample)';

interface Meta { monthCount: number; sourceName: string; }

export function useFleetData() {
  const [vessels, setVessels] = useState<Vessel[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Reading performance workbook…');
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback((): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedMeta = localStorage.getItem(CACHE_META_KEY);
      if (cached) {
        setVessels(JSON.parse(cached));
        setMeta(cachedMeta ? JSON.parse(cachedMeta) : null);
        setLoading(false);
        return true;
      }
    } catch { /* ignore corrupt cache */ }
    return false;
  }, []);

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingText('Reading performance workbook…');
    try {
      const resp = await fetch(SAMPLE_URL);
      const buf = await resp.arrayBuffer();
      const { vessels: rows, monthCount } = parseWorkbookBuffer(buf);
      const m: Meta = { monthCount, sourceName: SAMPLE_LABEL };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
        localStorage.setItem(CACHE_META_KEY, JSON.stringify(m));
      } catch { /* ignore quota errors */ }
      setVessels(rows);
      setMeta(m);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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
      const { vessels: rows, monthCount } = parseWorkbookBuffer(buf);
      if (rows.length === 0) throw new Error('No vessel rows found — check the workbook has monthly report sheets with IMO and Hull Cleaning columns.');
      const m: Meta = { monthCount, sourceName: file.name };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
        localStorage.setItem(CACHE_META_KEY, JSON.stringify(m));
      } catch { /* ignore quota errors */ }
      setVessels(rows);
      setMeta(m);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const resetToSample = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_META_KEY);
    } catch { /* ignore */ }
    loadSample();
  }, [loadSample]);

  return { vessels, meta, loading, loadingText, error, uploadFile, resetToSample };
}
