/**
 * Heart-rate formulas — pure, framework-free functions.
 *
 * Rounding rule (used everywhere): BPM values are rounded to whole numbers,
 * half away from zero (Math.round for positives). HRmax estimates are rounded
 * ONCE, and every downstream value is computed from that rounded HRmax, so the
 * numbers shown on screen always agree with each other.
 */

export type HrmaxMethod = 'fox' | 'tanaka' | 'nes' | 'gulati' | 'measured'
export type Sex = 'male' | 'female' | ''
export type ZoneMethod = 'hrmax' | 'hrr'

export const MIN_ADULT_AGE = 18
export const MAX_AGE = 100

export const roundBpm = (v: number): number => Math.round(v)
export const roundPct = (v: number): number => Math.round(v * 10) / 10

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/* ---------- HRmax estimates ---------- */
export const fox = (age: number): number => roundBpm(220 - age)
export const tanaka = (age: number): number => roundBpm(208 - 0.7 * age)
export const nes = (age: number): number => roundBpm(211 - 0.64 * age)
export const gulati = (age: number): number => roundBpm(206 - 0.88 * age)

export interface HrmaxEstimates {
  fox: number
  tanaka: number
  nes: number
  /** Only defined for women (Gulati et al. studied women). */
  gulati: number | null
}

export function estimateAll(age: number, sex: Sex): HrmaxEstimates {
  return {
    fox: fox(age),
    tanaka: tanaka(age),
    nes: nes(age),
    gulati: sex === 'female' ? gulati(age) : null,
  }
}

/* ---------- Reserve / target ---------- */
export function heartRateReserve(hrmax: number, rhr: number): number | null {
  if (!isNum(hrmax) || !isNum(rhr) || hrmax <= rhr) return null
  return hrmax - rhr
}

/** Target HR = HRmax × (Intensity / 100) */
export function targetHrMax(hrmax: number, intensityPct: number): number | null {
  if (!isNum(hrmax) || !isNum(intensityPct) || intensityPct < 0 || intensityPct > 100) return null
  return roundBpm(hrmax * (intensityPct / 100))
}

/** Karvonen: Target HR = RHR + (HRmax − RHR) × Intensity */
export function karvonen(hrmax: number, rhr: number, intensityPct: number): number | null {
  const hrr = heartRateReserve(hrmax, rhr)
  if (hrr === null || !isNum(intensityPct) || intensityPct < 0 || intensityPct > 100) return null
  return roundBpm(rhr + hrr * (intensityPct / 100))
}

/* ---------- Zones ---------- */
export const DEFAULT_BOUNDS: readonly number[] = [50, 60, 70, 80, 90, 100]

export interface Zone {
  index: number // 1..5
  lowPct: number
  highPct: number
  low: number // BPM
  high: number // BPM
}

/** Returns an error message (Arabic) or null when the bounds are usable. */
export function validateBounds(bounds: readonly number[]): string | null {
  if (bounds.length !== 6) return 'يجب أن تحتوي المناطق على 6 حدود.'
  if (bounds.some((b) => !isNum(b))) return 'كل الحدود لازم تكون أرقام.'
  if (bounds[0] < 0 || bounds[5] > 100) return 'الحدود لازم تكون بين 0 و100.'
  for (let i = 1; i < bounds.length; i++) {
    if (bounds[i] <= bounds[i - 1]) return 'الحدود لازم تكون تصاعدية.'
  }
  return null
}

export function computeZones(
  method: ZoneMethod,
  hrmax: number,
  rhr: number | null,
  bounds: readonly number[] = DEFAULT_BOUNDS,
): Zone[] | null {
  if (validateBounds(bounds) !== null || !isNum(hrmax)) return null
  if (method === 'hrr' && (rhr === null || heartRateReserve(hrmax, rhr) === null)) return null
  const at = (pct: number) =>
    method === 'hrmax' ? roundBpm(hrmax * (pct / 100)) : roundBpm((rhr as number) + (hrmax - (rhr as number)) * (pct / 100))
  return [0, 1, 2, 3, 4].map((i) => ({
    index: i + 1,
    lowPct: bounds[i],
    highPct: bounds[i + 1],
    low: at(bounds[i]),
    high: at(bounds[i + 1]),
  }))
}

/* ---------- Intensity ---------- */
export function percentHrMax(current: number, hrmax: number): number | null {
  if (!isNum(current) || !isNum(hrmax) || hrmax <= 0 || current <= 0) return null
  return roundPct((current / hrmax) * 100)
}

export function percentHrr(current: number, rhr: number, hrmax: number): number | null {
  const hrr = heartRateReserve(hrmax, rhr)
  if (hrr === null || !isNum(current) || current <= 0) return null
  return roundPct(((current - rhr) / hrr) * 100)
}

export type ZonePosition = { kind: 'below' } | { kind: 'above' } | { kind: 'in'; zone: number }

/** Locates a percentage within the zone bounds (zone 1..5). */
export function locateZone(pct: number, bounds: readonly number[] = DEFAULT_BOUNDS): ZonePosition | null {
  if (!isNum(pct) || validateBounds(bounds) !== null) return null
  if (pct < bounds[0]) return { kind: 'below' }
  if (pct > bounds[5]) return { kind: 'above' }
  for (let i = 0; i < 5; i++) {
    if (pct >= bounds[i] && (pct < bounds[i + 1] || (i === 4 && pct <= bounds[5]))) {
      return { kind: 'in', zone: i + 1 }
    }
  }
  return null
}

/* ---------- Recovery (NOT Heart Rate Reserve) ---------- */
/** Recovery = Peak exercise HR − HR at recovery time. May be negative if HR rose. */
export function recoveryDrop(peak: number, atTime: number): number | null {
  if (!isNum(peak) || !isNum(atTime) || peak <= 0 || atTime <= 0) return null
  return roundBpm(peak - atTime)
}

/* ---------- Manual pulse count ---------- */
export function pulseBpm(beats: number, seconds: number): number | null {
  if (!isNum(beats) || !isNum(seconds) || beats < 0 || seconds <= 0) return null
  return roundBpm((beats / seconds) * 60)
}
