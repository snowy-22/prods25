export type ScalePreset = 's' | 'm' | 'l' | 'xl';

// Log-ish scale factors tuned for 4 steps
const SCALE_FACTORS: Record<ScalePreset, number> = {
  s: 1,
  m: 1.25,
  l: 1.6,
  xl: 2,
};

export function getScaleFactor(preset: ScalePreset = 'm'): number {
  return SCALE_FACTORS[preset] ?? SCALE_FACTORS.m;
}

export function scaleValue(value: number, preset: ScalePreset = 'm'): number {
  return Math.round(value * getScaleFactor(preset));
}
