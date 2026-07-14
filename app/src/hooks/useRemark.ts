import { useEffect, useState } from 'react';

function remarkKey(imo: string) {
  return 'znRemark_' + imo;
}

export function useRemark(imo: string) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let v = '';
    try { v = localStorage.getItem(remarkKey(imo)) || ''; } catch { /* ignore */ }
    setValue(v);
    setSaved(false);
  }, [imo]);

  const onChange = (v: string) => { setValue(v); setSaved(false); };
  const onSave = () => {
    try { localStorage.setItem(remarkKey(imo), value); } catch { /* ignore quota errors */ }
    setSaved(true);
  };

  return { value, saved, onChange, onSave };
}
