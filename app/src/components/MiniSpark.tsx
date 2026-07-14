import { spark } from '../lib/calc';

interface Props {
  series: (number | null)[];
  color: string;
  w?: number;
  h?: number;
}

export function MiniSpark({ series, color, w = 96, h = 34 }: Props) {
  const sp = spark(series, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: w, height: h, flex: 'none' }}>
      <polyline points={sp.points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
