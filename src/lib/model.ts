import {
  estimateAll,
  heartRateReserve,
  MAX_AGE,
  MIN_ADULT_AGE,
  type HrmaxEstimates,
  type HrmaxMethod,
  type Sex,
} from './formulas'

/** Parses a user-typed number. Empty / invalid → null (never NaN). */
export function parseNum(raw: string): number | null {
  const s = raw.trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export interface CoreInputs {
  age: string
  sex: Sex
  rhr: string
  measuredHrmax: string
  method: HrmaxMethod
}

export interface Model {
  age: number | null
  rhr: number | null
  measured: number | null
  estimates: HrmaxEstimates | null
  hrmax: number | null
  hrmaxLabel: string
  hrr: number | null
  errors: { age?: string; rhr?: string; measured?: string; method?: string }
}

export const METHOD_LABEL: Record<HrmaxMethod, string> = {
  fox: 'Fox',
  tanaka: 'Tanaka',
  nes: 'Nes',
  gulati: 'Gulati',
  measured: 'مقاس فعليًا',
}

/** Single source of truth: every calculator reads from this object. */
export function deriveModel(i: CoreInputs): Model {
  const errors: Model['errors'] = {}

  let age = parseNum(i.age)
  if (age === null && i.age.trim() !== '') errors.age = 'اكتب العمر بالأرقام فقط.'
  if (age !== null) {
    if (!Number.isInteger(age) || age > MAX_AGE) {
      errors.age = `اكتب عمرًا صحيحًا (رقم صحيح حتى ${MAX_AGE}).`
      age = null
    } else if (age < MIN_ADULT_AGE) {
      errors.age = 'معادلات HRmax بالعمر موجهة للبالغين (18+) ولا تُطبَّق على الأطفال. استخدم HRmax مقاس.'
      age = null
    }
  }

  let rhr = parseNum(i.rhr)
  if (rhr === null && i.rhr.trim() !== '') errors.rhr = 'اكتب نبض الراحة بالأرقام فقط.'
  if (rhr !== null && (rhr < 25 || rhr > 200)) {
    errors.rhr = 'قيمة نبض الراحة لازم تكون بين 25 و200 BPM.'
    rhr = null
  }

  let measured = parseNum(i.measuredHrmax)
  if (measured === null && i.measuredHrmax.trim() !== '') errors.measured = 'اكتب أقصى نبض مقاس بالأرقام فقط.'
  if (measured !== null && (measured < 100 || measured > 250)) {
    errors.measured = 'HRmax المقاس لازم يكون بين 100 و250 BPM.'
    measured = null
  }

  const estimates = age !== null ? estimateAll(age, i.sex) : null

  let hrmax: number | null = null
  if (i.method === 'measured') {
    hrmax = measured
    if (hrmax === null && !errors.measured) errors.method = 'أدخل HRmax المقاس أو اختر معادلة.'
  } else if (i.method === 'gulati' && i.sex !== 'female') {
    errors.method = 'معادلة Gulati خاصة بالنساء — اختر الجنس "أنثى" أو غيّر المعادلة.'
  } else if (estimates) {
    hrmax = estimates[i.method]
  }

  // Resting HR must sit below HRmax, otherwise HRR is meaningless.
  let hrr: number | null = null
  if (hrmax !== null && rhr !== null) {
    hrr = heartRateReserve(hrmax, rhr)
    if (hrr === null) errors.rhr = 'نبض الراحة لازم يكون أقل من HRmax.'
  }

  return {
    age,
    rhr: errors.rhr ? null : rhr,
    measured,
    estimates,
    hrmax,
    hrmaxLabel: METHOD_LABEL[i.method],
    hrr,
    errors,
  }
}
