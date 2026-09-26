import { describe, expect, it } from 'vitest'
import { selectRound } from '@/domain/draw'
import type { Item } from '@/domain/types'

function makeItem(id: string, status: Item['status'] = 'eligible'): Item {
  return { id, text: `text-${id}`, status }
}

const participants = [makeItem('p1'), makeItem('p2'), makeItem('p3', 'disabled'), makeItem('p4')]

const questions = [makeItem('q1'), makeItem('q2', 'disabled'), makeItem('q3')]

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('selectRound', () => {
  it('selects only eligible items with a deterministic RNG', () => {
    const random = () => 0

    const pair = selectRound(participants, questions, random)

    expect(pair).not.toBeNull()
    expect(pair?.participant.id).toBe('p1')
    expect(pair?.question.id).toBe('q1')
  })

  it('never selects a disabled item regardless of RNG output', () => {
    for (const value of [0, 0.34, 0.5, 0.999999]) {
      const pair = selectRound(participants, questions, () => value)

      expect(pair?.participant.status).toBe('eligible')
      expect(pair?.question.status).toBe('eligible')
      expect(pair?.participant.id).not.toBe('p3')
      expect(pair?.question.id).not.toBe('q2')
    }
  })

  it('maps the RNG uniformly across the eligible items only', () => {
    const eligibleParticipants = participants.filter((item) => item.status === 'eligible')
    const eligibleQuestions = questions.filter((item) => item.status === 'eligible')

    const lastParticipant = eligibleParticipants[eligibleParticipants.length - 1]
    const lastQuestion = eligibleQuestions[eligibleQuestions.length - 1]

    const pair = selectRound(participants, questions, () => 0.999999)

    expect(pair?.participant.id).toBe(lastParticipant?.id)
    expect(pair?.question.id).toBe(lastQuestion?.id)
  })

  it('returns null when there are no eligible participants', () => {
    const noParticipants = participants.map((item) => ({ ...item, status: 'disabled' as const }))

    expect(selectRound(noParticipants, questions, () => 0)).toBeNull()
  })

  it('returns null when there are no eligible questions', () => {
    const noQuestions = questions.map((item) => ({ ...item, status: 'disabled' as const }))

    expect(selectRound(participants, noQuestions, () => 0)).toBeNull()
  })

  it('returns null when a list is empty', () => {
    expect(selectRound([], questions, () => 0)).toBeNull()
    expect(selectRound(participants, [], () => 0)).toBeNull()
  })
})

describe('selection fairness (SC-003, SC-007)', () => {
  it('never selects a disabled item across 30 seeded rounds', () => {
    const random = mulberry32(12_345)

    for (let round = 0; round < 30; round += 1) {
      const pair = selectRound(participants, questions, random)

      expect(pair?.participant.status).toBe('eligible')
      expect(pair?.question.status).toBe('eligible')
      expect(pair?.participant.id).not.toBe('p3')
      expect(pair?.question.id).not.toBe('q2')
    }
  })

  it('keeps every participant within 850 to 1,150 selections over 10,000 draws', () => {
    const tenParticipants = Array.from({ length: 10 }, (_, index) => makeItem(`f${index}`))
    const random = mulberry32(4_242)
    const counts = new Map<string, number>()
    for (const item of tenParticipants) {
      counts.set(item.id, 0)
    }

    for (let draw = 0; draw < 10_000; draw += 1) {
      const pair = selectRound(tenParticipants, questions, random)
      if (pair !== null) {
        counts.set(pair.participant.id, (counts.get(pair.participant.id) ?? 0) + 1)
      }
    }

    for (const item of tenParticipants) {
      const count = counts.get(item.id) ?? 0
      expect(count).toBeGreaterThanOrEqual(850)
      expect(count).toBeLessThanOrEqual(1150)
    }
  })
})
