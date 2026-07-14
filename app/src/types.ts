export type TierKey = 'good' | 'watch' | 'alert' | 'critical' | 'nodata';
export type DevBand = 'improved' | 'stable' | 'worse' | 'sharp' | 'nodev';
export type StwBand = 'aligned' | 'high' | 'nostw';

export interface Vessel {
  imo: string;
  vessel: string;
  owner: string;
  level: string | null;
  confidence: string | null;
  age: number | null;
  actionYes: boolean;

  ep: number | null;
  epSensor: number | null;
  epNoon: number | null;
  epSource: 'Hindcast sensor' | 'Hindcast noon' | 'No data';

  ai: number | null;
  logSensor: number | null;
  logNoon: number | null;

  epDev: number | null;
  dev6m: number | null;
  refMonth6: string | null;
  devAct: number | null;
  refMonthAct: string | null;

  ddMonths: number | null;
  hcMonths: number | null;
  hiMonths: number | null;
  lastActMonths: number | null;
  lastActType: string | null;

  stwDev: number | null;
  series: (number | null)[];
  hullPerf: string | null;

  meLoadS: string | null; meSfocS: string | null; meShopS: string | null; meDevS: string | null;
  meLoadN: string | null; meSfocN: string | null; meShopN: string | null; meDevN: string | null;
  scocS: string | null; scocN: string | null;
  axLoadS: string | null; axSfocS: string | null; axShopS: string | null; axDevS: string | null;
  axLoadN: string | null; axSfocN: string | null; axShopN: string | null; axDevN: string | null;
  boilS: string | null; boilN: string | null;
  meCmt: string | null; aeCmt: string | null; boCmt: string | null;

  meDevSeries: (number | null)[];
  meSfocSeries: (number | null)[];
  scocSeries: (number | null)[];
  aeDevSeries: (number | null)[];
  aeSfocSeries: (number | null)[];
  boilSeries: (number | null)[];
  levelSeries: (string | null)[];
}

export interface VesselWithTier extends Vessel {
  tier: TierKey;
}

export interface Thresholds {
  watch: number;
  alert: number;
  critical: number;
}

export const THRESHOLD_DEFAULTS: Thresholds = { watch: 15, alert: 25, critical: 35 };
export const THRESHOLD_LIMITS = {
  watch: { min: 2, max: 20 },
  alert: { min: 15, max: 40 },
  critical: { min: 30, max: 60 },
};

export type SelectedFrom = 'hull' | 'engine' | null;
