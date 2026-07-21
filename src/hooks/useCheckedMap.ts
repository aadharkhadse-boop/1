import { useLocalStorageState } from './useLocalStorageState';

/** Generic per-browser "done" checkbox map, keyed by an arbitrary string (imo, or `${sys}:${imo}`). */
export function useCheckedMap(storageKey: string) {
  const [checked, setChecked] = useLocalStorageState<Record<string, boolean>>(storageKey, {});
  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  };
  return { checked, toggle };
}
