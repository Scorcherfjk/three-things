import { describe, expect, it } from 'vitest'
import {
  ROUND_DURATION_MS,
  discardRound,
  expireRound,
  interruptRound,
  remainingOf,
  resumeRound,
  startRound,
} from '@/domain/roundState'
import type { Item, Round } from '@/domain/types'

const drawnAt = 1_000_000

function makeRound(overrides: Partial<Round> = {}): Round {
  return { ...startRound('p1', 'q1', drawnAt), ...overrides }
}

describe('round lifecycle', () => {
  it('starts a round with a fixed 60 second deadline', () => {
    const round = startRound('p1', 'q1', drawnAt)

    expect(round.status).toBe('running')
    expect(round.deadline).toBe(drawnAt + ROUND_DURATION_MS)
    expect(round.remainingMs).toBe(ROUND_DURATION_MS)
    expect(round.drawnAt).toBe(drawnAt)
  })

  it('interrupt freezes the remaining time', () => {
    const round = makeRound()

    const interrupted = interruptRound(round, drawnAt + 25_000)

    expect(interrupted.status).toBe('interrupted')
    expect(interrupted.remainingMs).toBe(ROUND_DURATION_MS - 25_000)
    expect(remainingOf(interrupted, drawnAt + 40_000)).toBe(ROUND_DURATION_MS - 25_000)
  })

  it('interrupt leaves a non-running round unchanged', () => {
    const interrupted = makeRound({ status: 'interrupted', remainingMs: 12_000 })

    expect(interruptRound(interrupted, drawnAt + 5_000)).toEqual(interrupted)
  })

  it('resume continues from the frozen remaining time', () => {
    const interrupted = interruptRound(makeRound(), drawnAt + 20_000)
    const resumedAt = drawnAt + 90_000

    const resumed = resumeRound(interrupted, resumedAt)

    expect(resumed.status).toBe('running')
    expect(resumed.deadline).toBe(resumedAt + (ROUND_DURATION_MS - 20_000))
    expect(remainingOf(resumed, resumedAt)).toBe(ROUND_DURATION_MS - 20_000)
    expect(remainingOf(resumed, resumedAt + 5_000)).toBe(ROUND_DURATION_MS - 25_000)
  })

  it('discard returns to none and leaves the pair untouched', () => {
    const participants: Item[] = [{ id: 'p1', text: 'Ada', status: 'eligible' }]
    const round = makeRound()

    expect(discardRound(round)).toBeNull()
    expect(participants.every((item) => item.status === 'eligible')).toBe(true)
  })

  it('expire marks a past-deadline running round as timeup and holds', () => {
    const round = makeRound()

    const expired = expireRound(round, drawnAt + ROUND_DURATION_MS)

    expect(expired.status).toBe('timeup')
    expect(remainingOf(expired, drawnAt + ROUND_DURATION_MS + 5_000)).toBe(0)
    expect(expireRound(expired, drawnAt + ROUND_DURATION_MS + 9_000)).toEqual(expired)
  })

  it('does not expire a round before its deadline', () => {
    const round = makeRound()

    expect(expireRound(round, drawnAt + ROUND_DURATION_MS - 1)).toEqual(round)
  })

  it('remaining time never exceeds 60 seconds and never goes negative', () => {
    const round = makeRound()

    expect(remainingOf(round, drawnAt - 10_000)).toBe(ROUND_DURATION_MS)
    expect(remainingOf(round, drawnAt + ROUND_DURATION_MS + 10_000)).toBe(0)
  })
})
