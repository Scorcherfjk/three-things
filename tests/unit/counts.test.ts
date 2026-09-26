import { describe, expect, it } from 'vitest'
import { countSession, exhaustedResource } from '@/domain/counts'
import type { Item } from '@/domain/types'

function items(...statuses: Item['status'][]): Item[] {
  return statuses.map((status, index) => ({
    id: `id-${index}`,
    text: `text-${index}`,
    status,
  }))
}

describe('countSession', () => {
  it('derives eligible and disabled counts per kind', () => {
    const counts = countSession(
      items('eligible', 'disabled', 'eligible', 'disabled'),
      items('eligible', 'disabled'),
    )

    expect(counts.participants).toEqual({ total: 4, eligible: 2, disabled: 2 })
    expect(counts.questions).toEqual({ total: 2, eligible: 1, disabled: 1 })
  })

  it('returns zero counts for empty lists', () => {
    const counts = countSession([], [])

    expect(counts.participants).toEqual({ total: 0, eligible: 0, disabled: 0 })
    expect(counts.questions).toEqual({ total: 0, eligible: 0, disabled: 0 })
  })
})

describe('exhaustedResource', () => {
  it('reports questions when no eligible question remains', () => {
    expect(exhaustedResource(items('eligible', 'eligible'), items('disabled'))).toBe('questions')
  })

  it('reports participants when no eligible participant remains', () => {
    expect(exhaustedResource(items('disabled'), items('eligible'))).toBe('participants')
  })

  it('reports both when both kinds are exhausted', () => {
    expect(exhaustedResource(items('disabled'), items('disabled'))).toBe('both')
    expect(exhaustedResource([], [])).toBe('both')
  })

  it('is drawable while at least one eligible item of each kind remains', () => {
    expect(exhaustedResource(items('disabled', 'eligible'), items('disabled', 'eligible'))).toBe(
      null,
    )
    expect(exhaustedResource(items('eligible'), items('disabled', 'eligible'))).toBe(null)
    expect(exhaustedResource(items('disabled', 'eligible'), items('eligible'))).toBe(null)
  })
})
