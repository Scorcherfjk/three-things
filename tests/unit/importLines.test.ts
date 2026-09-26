import { describe, expect, it } from 'vitest'
import { MAX_TEXT_LENGTH, importLines, isValidText } from '@/domain/importLines'

describe('importLines', () => {
  it('splits per line, trims surrounding whitespace and drops blank lines', () => {
    const raw = '  Ada  \n\n   \nGrace\n\tAlan\t\n'

    const result = importLines(raw, 'participant')

    expect(result.accepted).toEqual(['Ada', 'Grace', 'Alan'])
    expect(result.rejected).toBe(0)
  })

  it('keeps duplicates as independent entries', () => {
    const result = importLines('Ada\nAda', 'participant')

    expect(result.accepted).toEqual(['Ada', 'Ada'])
  })

  it('preserves accents and internal punctuation', () => {
    const result = importLines('José Muñoz\n¿Qué pasa, señorita?', 'participant')

    expect(result.accepted).toEqual(['José Muñoz', '¿Qué pasa, señorita?'])
  })

  it('skips a name longer than 200 characters individually and keeps the rest', () => {
    const longName = 'a'.repeat(MAX_TEXT_LENGTH.participant + 1)
    const raw = `Ada\n${longName}\nGrace`

    const result = importLines(raw, 'participant')

    expect(result.accepted).toEqual(['Ada', 'Grace'])
    expect(result.rejected).toBe(1)
  })

  it('skips a question longer than 500 characters individually and keeps the rest', () => {
    const longQuestion = 'q'.repeat(MAX_TEXT_LENGTH.question + 1)
    const raw = `Tell a story\n${longQuestion}\nDo an impression`

    const result = importLines(raw, 'question')

    expect(result.accepted).toEqual(['Tell a story', 'Do an impression'])
    expect(result.rejected).toBe(1)
  })

  it('accepts lines exactly at the length limit', () => {
    const maxName = 'a'.repeat(MAX_TEXT_LENGTH.participant)

    const result = importLines(maxName, 'participant')

    expect(result.accepted).toEqual([maxName])
    expect(result.rejected).toBe(0)
  })

  it('handles Windows line endings', () => {
    const result = importLines('Ada\r\nGrace\r\n', 'participant')

    expect(result.accepted).toEqual(['Ada', 'Grace'])
  })

  it('returns nothing for empty input', () => {
    expect(importLines('', 'participant')).toEqual({ accepted: [], rejected: 0 })
    expect(importLines('   \n  \n', 'question')).toEqual({ accepted: [], rejected: 0 })
  })
})

describe('isValidText', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(isValidText('participant', '')).toBe(false)
    expect(isValidText('participant', '   ')).toBe(false)
  })

  it('rejects text over the kind limit and accepts at the limit', () => {
    expect(isValidText('participant', 'a'.repeat(201))).toBe(false)
    expect(isValidText('participant', 'a'.repeat(200))).toBe(true)
    expect(isValidText('question', 'q'.repeat(501))).toBe(false)
    expect(isValidText('question', 'q'.repeat(500))).toBe(true)
  })
})
