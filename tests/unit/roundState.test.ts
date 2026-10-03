import { describe, expect, it } from 'vitest'
import {
  discardRound,
  expireRound,
  interruptRound,
  remainingOf,
  resumeRound,
  startRound,
} from '@/domain/roundState'
import type { Item, Round } from '@/domain/types'

const drawnAt = 1_000_000
const shortAnswerMs = 10_000
const longAnswerMs = 300_000

function makeRound(overrides: Partial<Round> = {}): Round {
  return { ...startRound('p1', 'q1', drawnAt, shortAnswerMs), ...overrides }
}

describe('startRound', () => {
  it('derives the deadline and the remaining time from the round own answer time', () => {
    const round = startRound('p1', 'q1', drawnAt, shortAnswerMs)

    expect(round.status).toBe('running')
    expect(round.answerMs).toBe(shortAnswerMs)
    expect(round.deadline).toBe(drawnAt + shortAnswerMs)
    expect(round.remainingMs).toBe(shortAnswerMs)
    expect(round.drawnAt).toBe(drawnAt)
  })

  it('accepts the maximum answer time', () => {
    const round = startRound('p1', 'q1', drawnAt, longAnswerMs)

    expect(round.answerMs).toBe(longAnswerMs)
    expect(round.deadline).toBe(drawnAt + longAnswerMs)
    expect(remainingOf(round, drawnAt)).toBe(longAnswerMs)
  })
})

describe('remainingOf clamping uses the round answer time', () => {
  it('counts a ten second round down from its own duration', () => {
    const round = makeRound()

    expect(remainingOf(round, drawnAt)).toBe(shortAnswerMs)
    expect(remainingOf(round, drawnAt + 4_000)).toBe(6_000)
    expect(remainingOf(round, drawnAt + shortAnswerMs)).toBe(0)
  })

  it('counts a five minute round down without truncating at a minute', () => {
    const round = startRound('p1', 'q1', drawnAt, longAnswerMs)

    expect(remainingOf(round, drawnAt + 60_000)).toBe(240_000)
    expect(remainingOf(round, drawnAt + 295_000)).toBe(5_000)
  })

  it('never exceeds the round answer time and never goes negative', () => {
    for (const answerMs of [5_000, 10_000, 60_000, 300_000]) {
      const round = startRound('p1', 'q1', drawnAt, answerMs)

      expect(remainingOf(round, drawnAt - 60_000)).toBe(answerMs)
      expect(remainingOf(round, drawnAt + answerMs + 60_000)).toBe(0)
      expect(remainingOf(round, drawnAt + 1)).toBeGreaterThanOrEqual(0)
      expect(remainingOf(round, drawnAt + 1)).toBeLessThanOrEqual(answerMs)
    }
  })
})

describe('interruptRound', () => {
  it('freezes the remaining time of a ten second round', () => {
    const round = makeRound()

    const interrupted = interruptRound(round, drawnAt + 4_000)

    expect(interrupted.status).toBe('interrupted')
    expect(interrupted.answerMs).toBe(shortAnswerMs)
    expect(interrupted.remainingMs).toBe(6_000)
    expect(remainingOf(interrupted, drawnAt + 20_000)).toBe(6_000)
  })

  it('freezes the remaining time of a five minute round', () => {
    const round = startRound('p1', 'q1', drawnAt, longAnswerMs)

    const interrupted = interruptRound(round, drawnAt + 120_000)

    expect(interrupted.remainingMs).toBe(180_000)
  })

  it('leaves a non-running round unchanged', () => {
    const interrupted = makeRound({ status: 'interrupted', remainingMs: 12_000 })

    expect(interruptRound(interrupted, drawnAt + 5_000)).toEqual(interrupted)
  })
})

describe('resumeRound', () => {
  it('continues a ten second round from the frozen remaining time', () => {
    const interrupted = interruptRound(makeRound(), drawnAt + 4_000)
    const resumedAt = drawnAt + 90_000

    const resumed = resumeRound(interrupted, resumedAt)

    expect(resumed.status).toBe('running')
    expect(resumed.answerMs).toBe(shortAnswerMs)
    expect(resumed.deadline).toBe(resumedAt + 6_000)
    expect(resumed.remainingMs).toBe(shortAnswerMs)
    expect(remainingOf(resumed, resumedAt)).toBe(6_000)
    expect(remainingOf(resumed, resumedAt + 5_000)).toBe(1_000)
  })

  it('continues a five minute round from the frozen remaining time', () => {
    const interrupted = interruptRound(
      startRound('p1', 'q1', drawnAt, longAnswerMs),
      drawnAt + 90_000,
    )
    const resumedAt = drawnAt + 100_000

    const resumed = resumeRound(interrupted, resumedAt)

    expect(resumed.deadline).toBe(resumedAt + 210_000)
    expect(remainingOf(resumed, resumedAt + 30_000)).toBe(180_000)
  })

  it('turns an exhausted interrupted round into a time-up round', () => {
    const interrupted = makeRound({ status: 'interrupted', remainingMs: 0 })

    expect(resumeRound(interrupted, drawnAt).status).toBe('timeup')
  })

  it('leaves a non-interrupted round unchanged', () => {
    const running = makeRound()

    expect(resumeRound(running, drawnAt)).toEqual(running)
  })
})

describe('discardRound', () => {
  it('returns to none and leaves the pair untouched', () => {
    const participants: Item[] = [{ id: 'p1', text: 'Ada', status: 'eligible' }]
    const round = makeRound()

    expect(discardRound(round)).toBeNull()
    expect(participants.every((item) => item.status === 'eligible')).toBe(true)
  })
})

describe('expireRound', () => {
  it('marks a past-deadline running round as timeup and holds', () => {
    const round = makeRound()

    const expired = expireRound(round, drawnAt + shortAnswerMs)

    expect(expired.status).toBe('timeup')
    expect(remainingOf(expired, drawnAt + shortAnswerMs + 5_000)).toBe(0)
    expect(expireRound(expired, drawnAt + shortAnswerMs + 9_000)).toEqual(expired)
  })

  it('does not expire a round before its deadline', () => {
    const round = makeRound()

    expect(expireRound(round, drawnAt + shortAnswerMs - 1)).toEqual(round)
  })

  it('holds a five minute round until its own deadline', () => {
    const round = startRound('p1', 'q1', drawnAt, longAnswerMs)

    expect(expireRound(round, drawnAt + 60_000)).toEqual(round)
    expect(expireRound(round, drawnAt + longAnswerMs).status).toBe('timeup')
  })
})
