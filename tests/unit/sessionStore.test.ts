import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptySession } from '@/domain/types'
import type { SessionData } from '@/domain/types'
import { loadSession, saveSession } from '@/storage/sessionStore'
import { STORAGE_KEY } from '@/storage/storageKeys'

function legacyRound(): Record<string, unknown> {
  return {
    participantId: 'p1',
    questionId: 'q1',
    drawnAt: 1_000_000,
    deadline: 1_042_000,
    remainingMs: 42_000,
    status: 'interrupted',
  }
}

function legacySession(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    participants: [
      { id: 'p1', text: 'Ada', status: 'eligible' },
      { id: 'p2', text: 'Grace', status: 'disabled' },
    ],
    questions: [{ id: 'q1', text: 'Tell a short story', status: 'eligible' }],
    currentRound: legacyRound(),
    view: 'play',
    ...overrides,
  }
}

describe('loading a version 1 document', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('upgrades to version 2 with the default timing and a legacy round duration', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySession()))

    const session = loadSession()

    expect(session.version).toBe(2)
    expect(session.timing).toEqual({ animationSeconds: 3, answerSeconds: 60 })
    expect(session.currentRound?.answerMs).toBe(60_000)
  })

  it('copies every other value through unchanged', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySession()))

    const session = loadSession()

    expect(session.participants).toEqual([
      { id: 'p1', text: 'Ada', status: 'eligible' },
      { id: 'p2', text: 'Grace', status: 'disabled' },
    ])
    expect(session.questions).toEqual([
      { id: 'q1', text: 'Tell a short story', status: 'eligible' },
    ])
    expect(session.view).toBe('play')
    expect(session.currentRound).toEqual({
      participantId: 'p1',
      questionId: 'q1',
      drawnAt: 1_000_000,
      deadline: 1_042_000,
      remainingMs: 42_000,
      status: 'interrupted',
      answerMs: 60_000,
    })
  })

  it('keeps a null current round null', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySession({ currentRound: null })))

    const session = loadSession()

    expect(session.currentRound).toBeNull()
    expect(session.timing).toEqual({ animationSeconds: 3, answerSeconds: 60 })
  })

  it('rejects a version 1 document with invalid stored data', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(legacySession({ participants: [{ id: 'p1', text: 'Ada', status: 'gone' }] })),
    )

    expect(loadSession()).toEqual(emptySession())
  })
})

describe('loading a version 2 document', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses a valid document as is', () => {
    const document = {
      version: 2,
      participants: [{ id: 'p1', text: 'Ada', status: 'eligible' }],
      questions: [{ id: 'q1', text: 'Tell a short story', status: 'eligible' }],
      timing: { animationSeconds: 0, answerSeconds: 10 },
      currentRound: null,
      view: 'setup',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document))

    expect(loadSession()).toEqual(document)
  })

  it('yields an empty session when a version 2 field is invalid', () => {
    const base = {
      version: 2,
      participants: [],
      questions: [],
      timing: { animationSeconds: 3, answerSeconds: 60 },
      currentRound: null,
      view: 'setup',
    }
    const invalidDocuments = [
      { ...base, timing: { animationSeconds: 9, answerSeconds: 60 } },
      { ...base, timing: { animationSeconds: 3, answerSeconds: 2 } },
      { ...base, timing: { animationSeconds: 3.5, answerSeconds: 60 } },
      { ...base, timing: { animationSeconds: 3 } },
    ]

    for (const document of invalidDocuments) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
      expect(loadSession()).toEqual(emptySession())
    }
  })

  it('yields an empty session when a stored round has no valid answerMs', () => {
    const base = {
      version: 2,
      participants: [],
      questions: [],
      timing: { animationSeconds: 3, answerSeconds: 60 },
      currentRound: null,
      view: 'play',
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...base, currentRound: { ...legacyRound() } }),
    )
    expect(loadSession()).toEqual(emptySession())

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...base, currentRound: { ...legacyRound(), answerMs: -1 } }),
    )
    expect(loadSession()).toEqual(emptySession())
  })
})

describe('loading unusable data', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('yields an empty session for missing, unparseable, absent and unknown versions', () => {
    expect(loadSession()).toEqual(emptySession())

    const unusable = ['not json', '[]', 'null', '{}', JSON.stringify({ version: 3, view: 'play' })]
    for (const raw of unusable) {
      localStorage.setItem(STORAGE_KEY, raw)
      expect(loadSession()).toEqual(emptySession())
    }
  })

  it('never throws when storage access is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => loadSession()).not.toThrow()
    expect(loadSession()).toEqual(emptySession())

    getItem.mockRestore()
  })

  it('never throws when the stored document is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '42')

    expect(() => loadSession()).not.toThrow()
    expect(loadSession()).toEqual(emptySession())
  })
})

describe('saving a version 2 document', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips the timing values and the round answer time', () => {
    const session: SessionData = {
      version: 2,
      participants: [],
      questions: [],
      timing: { animationSeconds: 1, answerSeconds: 300 },
      currentRound: {
        participantId: 'p1',
        questionId: 'q1',
        drawnAt: 5,
        deadline: 305_000,
        remainingMs: 300_000,
        status: 'running',
        answerMs: 300_000,
      },
      view: 'play',
    }

    expect(saveSession(session)).toEqual({ ok: true })
    expect(loadSession()).toEqual(session)
  })
})
