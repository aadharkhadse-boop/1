import { decryptFile } from './crypto';

// Every encrypted .enc in src/data/monthly/ is discovered automatically at build time.
const monthlyFileUrls = import.meta.glob('../data/monthly/*.enc', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function labelFromPath(path: string): string {
  const m = path.match(/(\d{4})-(\d{2})\.enc$/);
  if (!m) return path;
  const monthIdx = parseInt(m[2], 10) - 1;
  return `${MONTH_ABBR[monthIdx] ?? m[2]} '${m[1].slice(2)}`;
}

/** Sorted (chronological) list of { path, url } for the encrypted monthly files. */
export function monthlyFiles(): { path: string; url: string }[] {
  return Object.keys(monthlyFileUrls).sort().map((path) => ({ path, url: monthlyFileUrls[path] }));
}

/** Try to decrypt the first data file with the password. Returns true if it succeeds. */
export async function verifyPassword(password: string): Promise<boolean> {
  const files = monthlyFiles();
  if (files.length === 0) return false;
  try {
    const resp = await fetch(files[0].url, { cache: 'no-store' });
    const encBuf = await resp.arrayBuffer();
    await decryptFile(encBuf, password);
    return true;
  } catch {
    return false;
  }
}
