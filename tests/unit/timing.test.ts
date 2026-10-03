import { describe, expect, it } from 'vitest'
import {
  TIMING_RANGES,
  defaultTiming,
  parseSeconds,
  rejectionMessage,
  timingHint,
} from '@/domain/timing'

describe('parseSeconds valid whole seconds inside the range', () => {
  it('accepts every accepted animation time', () => {
    expect(parseSeconds('0', 'animation')).toEqual({ status: 'valid', seconds: 0 })
    expect(parseSeconds('3', 'animation')).toEqual({ status: 'valid', seconds: 3 })
    expect(parseSeconds('5', 'animation')).toEqual({ status: 'valid', seconds: 5 })
  })

  it('accepts every accepted answer time', () => {
    expect(parseSeconds('5', 'answer')).toEqual({ status: 'valid', seconds: 5 })
    expect(parseSeconds('60', 'answer')).toEqual({ status: 'valid', seconds: 60 })
    expect(parseSeconds('300', 'answer')).toEqual({ status: 'valid', seconds: 300 })
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(parseSeconds('  10  ', 'answer')).toEqual({ status: 'valid', seconds: 10 })
  })
})

describe('parseSeconds out of range', () => {
  it('rejects whole numbers above the animation maximum', () => {
    expect(parseSeconds('6', 'animation')).toEqual({ status: 'out-of-range' })
    expect(parseSeconds('9', 'animation')).toEqual({ status: 'out-of-range' })
  })

  it('rejects whole numbers below or above the answer range', () => {
    expect(parseSeconds('4', 'answer')).toEqual({ status: 'out-of-range' })
    expect(parseSeconds('301', 'answer')).toEqual({ status: 'out-of-range' })
  })
})

describe('parseSeconds not a whole number', () => {
  it('rejects decimals, signs, exponents, separators and letters', () => {
    for (const raw of ['3.5', '-5', '1e2', '3,5', 'abc', '+3']) {
      expect(parseSeconds(raw, 'animation')).toEqual({ status: 'not-a-whole-number' })
      expect(parseSeconds(raw, 'answer')).toEqual({ status: 'not-a-whole-number' })
    }
  })

  it('rejects a bare sign', () => {
    expect(parseSeconds('-', 'animation')).toEqual({ status: 'not-a-whole-number' })
    expect(parseSeconds('+', 'answer')).toEqual({ status: 'not-a-whole-number' })
  })
})

describe('parseSeconds empty', () => {
  it('treats an empty or whitespace-only draft as empty for both kinds', () => {
    for (const raw of ['', '   ', '\t', '\n']) {
      expect(parseSeconds(raw, 'animation')).toEqual({ status: 'empty' })
      expect(parseSeconds(raw, 'answer')).toEqual({ status: 'empty' })
    }
  })
})

describe('default timing', () => {
  it('is three animation seconds and sixty answer seconds', () => {
    expect(defaultTiming()).toEqual({ animationSeconds: 3, answerSeconds: 60 })
  })
})

describe('always-visible range hints', () => {
  it('states the accepted range and the meaning of zero for the animation field', () => {
    expect(timingHint('animation')).toBe('Whole seconds from 0 to 5. Use 0 to skip the animation.')
  })

  it('states the accepted range for the answer field', () => {
    expect(timingHint('answer')).toBe('Whole seconds from 5 to 300.')
  })

  it('shows the very same limits the parser enforces', () => {
    for (const kind of ['animation', 'answer'] as const) {
      const range = TIMING_RANGES[kind]

      expect(parseSeconds(String(range.min), kind).status).toBe('valid')
      expect(parseSeconds(String(range.max), kind).status).toBe('valid')
      expect(parseSeconds(String(range.max + 1), kind).status).toBe('out-of-range')
      if (range.min > 0) {
        expect(parseSeconds(String(range.min - 1), kind).status).toBe('out-of-range')
      }
      expect(timingHint(kind)).toContain(`from ${range.min} to ${range.max}`)
    }
  })
})

describe('rejection messages', () => {
  it('names the field and states its range for an out-of-range entry', () => {
    expect(rejectionMessage('animation', 'out-of-range', '9', 3)).toBe(
      'Animation time must be a whole number of seconds between 0 and 5. ' +
        '9 was not saved, so 3 seconds is still in use.',
    )
  })

  it('substitutes the answer field name and range', () => {
    expect(rejectionMessage('answer', 'out-of-range', '301', 30)).toBe(
      'Answer time must be a whole number of seconds between 5 and 300. ' +
        '301 was not saved, so 30 seconds is still in use.',
    )
  })

  it('states the whole-seconds requirement for a non-whole-number entry', () => {
    expect(rejectionMessage('animation', 'not-a-whole-number', '3.5', 3)).toBe(
      'Animation time must be a whole number of seconds between 0 and 5. ' +
        'Only whole seconds are accepted, so 3 seconds is still in use.',
    )
    expect(rejectionMessage('answer', 'not-a-whole-number', 'abc', 60)).toBe(
      'Answer time must be a whole number of seconds between 5 and 300. ' +
        'Only whole seconds are accepted, so 60 seconds is still in use.',
    )
  })

  it('reports the currently committed value, not the default', () => {
    expect(rejectionMessage('answer', 'out-of-range', '2', 120)).toContain(
      '120 seconds is still in use',
    )
    expect(rejectionMessage('animation', 'not-a-whole-number', '-5', 0)).toContain(
      '0 seconds is still in use',
    )
    expect(rejectionMessage('answer', 'out-of-range', '2', 120)).not.toContain(
      '60 seconds is still in use',
    )
  })
})
