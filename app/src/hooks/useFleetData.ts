import { useCallback, useEffect, useState } from 'react';
import type { CiiRow, Vessel } from '../types';
import { parseMonthlyFiles, type MonthlyFileInput } from '../lib/workbookParser';

// Every .xlsx dropped into src/data/monthly/ is picked up automatically at build time —
// add next month's file there (keep all prior months' files) and redeploy, no code change needed.
const monthlyFileUrls = import.meta.glob('../data/monthly/*.xlsx', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function labelFromPath(path: string): string {
  const m = path.match(/(\d{4})-(\d{2})\.xlsx$/);
  if (!m) return path;
  const monthIdx = parseInt(m[2], 10) - 1;
  return `${MONTH_ABBR[monthIdx] ?? m[2]} '${m[1].slice(2)}`;
}

interface Meta { monthCount: number; monthLabels: string[]; }

export function useFleetData() {
  const [vessels, setVessels] = useState<Vessel[] | null>(null);
  const [ciiRows, setCiiRows] = useState<CiiRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Reading performance workbooks…');
  const [error, setError] = useState<string | null>(null);

  // Always fetched fresh (no persistent cache) so newly added monthly files show up for every visitor on their next load.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingText('Reading performance workbooks…');
    try {
      const paths = Object.keys(monthlyFileUrls).sort(); // YYYY-MM filenames sort chronologically
      if (paths.length === 0) throw new Error('No monthly workbook files found in src/data/monthly/.');
      const files: MonthlyFileInput[] = [];
      for (const path of paths) {
        const resp = await fetch(monthlyFileUrls[path], { cache: 'no-store' });
        const buf = await resp.arrayBuffer();
        files.push({ label: labelFromPath(path), buf });
      }
      const { vessels: rows, monthCount, monthLabels, ciiRows: cii } = parseMonthlyFiles(files);
      setVessels(rows);
      setCiiRows(cii);
      setMeta({ monthCount, monthLabels });
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
