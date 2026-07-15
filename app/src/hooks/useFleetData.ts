import { useCallback, useEffect, useState } from 'react';
import type { CiiRow, Vessel } from '../types';
import { parseWorkbookBuffer } from '../lib/workbookParser';

const WORKBOOK_URL = '/data/fleet-workbook.xlsx';
const WORKBOOK_LABEL = 'fleet-workbook.xlsx';

interface Meta { monthCount: number; sourceName: string; }

export function useFleetData() {
  const [vessels, setVessels] = useState<Vessel[] | null>(null);
  const [ciiRows, setCiiRows] = useState<CiiRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Reading performance workbook…');
  const [error, setError] = useState<string | null>(null);

  // Always fetched fresh (no persistent cache) so a swapped backend file shows up for every visitor on their next load.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingText('Reading performance workbook…');
    try {
      const resp = await fetch(WORKBOOK_URL, { cache: 'no-store' });
      const buf = await resp.arrayBuffer();
      const { vessels: rows, monthCount, ciiRows: cii } = parseWorkbookBuffer(buf);
      setVessels(rows);
      setCiiRows(cii);
      setMeta({ monthCount, sourceName: WORKBOOK_LABEL });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { vessels, ciiRows, meta, loading, loadingText, error, reload: load };
}
