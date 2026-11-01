import { describe, expect, it } from 'vitest'
import {
  computeZones, DEFAULT_BOUNDS, estimateAll, fox, gulati, heartRateReserve, karvonen, locateZone,
  nes, percentHrMax, percentHrr, pulseBpm, recoveryDrop, targetHrMax, tanaka, validateBounds,
} from './formulas'
import { deriveModel, parseNum, type CoreInputs } from './model'

const base: CoreInputs = { age: '30', sex: 'male', rhr: '60', measuredHrmax: '', method: 'tanaka' }

describe('HRmax formulas', () => {
  it('Fox / Tanaka / Nes / Gulati at age 30', () => {
    expect(fox(30)).toBe(190)
    expect(tanaka(30)).toBe(187)
    expect(nes(30)).toBe(192) // 211 - 19.2 = 191.8
    expect(gulati(30)).toBe(180) // 206 - 26.4 = 179.6
  })
  it('Gulati only for women', () => {
    expect(estimateAll(30, 'male').gulati).toBeNull()
    expect(estimateAll(30, 'female').gulati).toBe(180)
  })
})

describe('reserve / target / Karvonen (spec example)', () => {
  it('HRR = 187 - 60 = 127', () => expect(heartRateReserve(187, 60)).toBe(127))
  it('Karvonen 70% = 148.9 ≈ 149', () => expect(karvonen(187, 60, 70)).toBe(149))
  it('%HRmax target at 70%', () => expect(targetHrMax(187, 70)).toBe(131))
  it('rejects bad inputs', () => {
    expect(heartRateReserve(60, 60)).toBeNull()
    expect(karvonen(187, 190, 70)).toBeNull()
    expect(karvonen(187, 60, 120)).toBeNull()
    expect(targetHrMax(NaN, 50)).toBeNull()
    expect(targetHrMax(187, -1)).toBeNull()
  })
})

describe('zones', () => {
  it('%HRmax zones', () => {
    const z = computeZones('hrmax', 187, null)!
    expect(z.map((x) => [x.low, x.high])).toEqual([[94, 112], [112, 131], [131, 150], [150, 168], [168, 187]])
  })
  it('%HRR zones', () => {
    const z = computeZones('hrr', 187, 60)!
    expect(z[0].low).toBe(124) // 60 + 63.5
    expect(z[4].high).toBe(187)
  })
  it('HRR method needs RHR', () => expect(computeZones('hrr', 187, null)).toBeNull())
  it('custom bounds validation', () => {
    expect(validateBounds(DEFAULT_BOUNDS)).toBeNull()
    expect(validateBounds([50, 60, 60, 80, 90, 100])).not.toBeNull()
    expect(validateBounds([50, 60, 70, 80, 90, 110])).not.toBeNull()
    expect(computeZones('hrmax', 187, null, [40, 55, 70, 80, 90, 100])![0].low).toBe(75)
  })
  it('locateZone', () => {
    expect(locateZone(49.9)).toEqual({ kind: 'below' })
    expect(locateZone(50)).toEqual({ kind: 'in', zone: 1 })
    expect(locateZone(70)).toEqual({ kind: 'in', zone: 3 })
    expect(locateZone(100)).toEqual({ kind: 'in', zone: 5 })
    expect(locateZone(100.1)).toEqual({ kind: 'above' })
  })
})

describe('intensity', () => {
  it('%HRmax and %HRR', () => {
    expect(percentHrMax(150, 187)).toBe(80.2)
    expect(percentHrr(150, 60, 187)).toBe(70.9)
  })
  it('invalid', () => {
    expect(percentHrr(150, 190, 187)).toBeNull()
    expect(percentHrMax(0, 187)).toBeNull()
  })
})

describe('recovery & pulse', () => {
  it('recovery drop', () => {
    expect(recoveryDrop(180, 160)).toBe(20)
    expect(recoveryDrop(180, 190)).toBe(-10)
    expect(recoveryDrop(180, NaN)).toBeNull()
  })
  it('pulse BPM', () => {
    expect(pulseBpm(18, 15)).toBe(72)
    expect(pulseBpm(36, 30)).toBe(72)
    expect(pulseBpm(70, 60)).toBe(70)
    expect(pulseBpm(10, 0)).toBeNull()
    expect(pulseBpm(-1, 15)).toBeNull()
  })
})

describe('deriveModel — reactive propagation', () => {
  it('spec example', () => {
    const m = deriveModel(base)
    expect(m.hrmax).toBe(187)
    expect(m.hrr).toBe(127)
  })
  it('changing the method recalculates', () => {
    expect(deriveModel({ ...base, method: 'fox' }).hrr).toBe(130)
    expect(deriveModel({ ...base, method: 'nes' }).hrr).toBe(132)
  })
  it('measured HRmax overrides estimates', () => {
    const m = deriveModel({ ...base, method: 'measured', measuredHrmax: '195' })
    expect(m.hrmax).toBe(195)
    expect(m.hrr).toBe(135)
  })
  it('measured selected but empty → no result, clear error', () => {
    const m = deriveModel({ ...base, method: 'measured' })
    expect(m.hrmax).toBeNull()
    expect(m.errors.method).toBeTruthy()
  })
  it('Gulati for male is blocked', () => {
    const m = deriveModel({ ...base, method: 'gulati' })
    expect(m.hrmax).toBeNull()
    expect(deriveModel({ ...base, sex: 'female', method: 'gulati' }).hrmax).toBe(180)
  })
  it('children are not calculated by age formulas', () => {
    const m = deriveModel({ ...base, age: '10' })
    expect(m.hrmax).toBeNull()
    expect(m.errors.age).toBeTruthy()
  })
  it('measured works without age', () => {
    expect(deriveModel({ ...base, age: '', method: 'measured', measuredHrmax: '200' }).hrr).toBe(140)
  })
  it('never yields NaN', () => {
    const m = deriveModel({ age: 'abc', sex: '', rhr: '--', measuredHrmax: 'x', method: 'tanaka' })
    expect(m.hrmax).toBeNull()
    expect(m.hrr).toBeNull()
  })
  it('RHR ≥ HRmax is rejected', () => {
    const m = deriveModel({ ...base, rhr: '190' })
    expect(m.hrr).toBeNull()
    expect(m.rhr).toBeNull()
    expect(m.errors.rhr).toBeTruthy()
  })
  it('parseNum', () => {
    expect(parseNum('')).toBeNull()
    expect(parseNum('12,5')).toBe(12.5)
    expect(parseNum('abc')).toBeNull()
  })
})
