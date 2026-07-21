import { useCallback, useEffect, useState } from 'react';
import type { CiiRow, Vessel } from '../types';
import { parseMonthlyFiles, type MonthlyFileInput } from '../lib/workbookParser';
import { decryptFile } from '../lib/crypto';
import { labelFromPath, monthlyFiles } from '../lib/dataFiles';

interface Meta { monthCount: number; monthLabels: string[]; }

export function useFleetData(password: string | null) {
  // One fully-built vessel list + CII list per reporting month (oldest first). The dashboard
  // picks the slice for whichever month the user selects in the header dropdown.
  const [vesselsByMonth, setVesselsByMonth] = useState<Vessel[][] | null>(null);
  const [ciiByMonth, setCiiByMonth] = useState<CiiRow[][]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Decrypting performance data…');
  const [error, setError] = useState<string | null>(null);

  // Fetched + decrypted fresh each load (no persistent cache), so newly added monthly files
  // show up for every visitor on their next visit.
  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    setLoadingText('Decrypting performance data…');
    try {
      const entries = monthlyFiles(); // chronological
      if (entries.length === 0) throw new Error('No monthly data files found in src/data/monthly/.');
      const files: MonthlyFileInput[] = [];
      for (const { path, url } of entries) {
        const resp = await fetch(url, { cache: 'no-store' });
        const encBuf = await resp.arrayBuffer();
        const buf = await decryptFile(encBuf, password);
        files.push({ label: labelFromPath(path), buf });
      }
      const { vesselsByMonth: vbm, ciiByMonth: cbm, monthCount, monthLabels } = parseMonthlyFiles(files);
      setVesselsByMonth(vbm);
      setCiiByMonth(cbm);
      setMeta({ monthCount, monthLabels });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    load();
  }, [load]);

  return { vesselsByMonth, ciiByMonth, meta, loading, loadingText, error, reload: load };
}
