import { emptySession } from '@/domain/types'
import type { Item, Round, SessionData, View } from '@/domain/types'
import { STORAGE_KEY } from './storageKeys'

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialize' }

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isValidItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as Partial<Item>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    (item.status === 'eligible' || item.status === 'disabled')
  )
}

function isValidRound(value: unknown): value is Round {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const round = value as Partial<Round>
  return (
    typeof round.participantId === 'string' &&
    typeof round.questionId === 'string' &&
    typeof round.drawnAt === 'number' &&
    typeof round.deadline === 'number' &&
    typeof round.remainingMs === 'number' &&
    (round.status === 'running' || round.status === 'interrupted' || round.status === 'timeup')
  )
}

function isValidView(value: unknown): value is View {
  return value === 'setup' || value === 'play'
}

function parseSession(raw: string): SessionData | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) {
    return null
  }
  const candidate = data as Partial<SessionData>
  if (candidate.version !== 1) {
    return null
  }
  if (!Array.isArray(candidate.participants) || !Array.isArray(candidate.questions)) {
    return null
  }
  if (!candidate.participants.every(isValidItem) || !candidate.questions.every(isValidItem)) {
    return null
  }
  if (!isValidView(candidate.view)) {
    return null
  }
  if (candidate.currentRound !== null && !isValidRound(candidate.currentRound)) {
    return null
  }
  return {
    version: 1,
    participants: candidate.participants,
    questions: candidate.questions,
    currentRound: candidate.currentRound ?? null,
    view: candidate.view,
  }
}

export function loadSession(): SessionData {
  const storage = getStorage()
  if (storage === null) {
    return emptySession()
  }
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return emptySession()
  }
  if (raw === null) {
    return emptySession()
  }
  return parseSession(raw) ?? emptySession()
}

function isQuotaError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'QuotaExceededError'
  )
}

export function saveSession(data: SessionData): SaveResult {
  const storage = getStorage()
  if (storage === null) {
    return { ok: false, reason: 'unavailable' }
  }
  let serialized: string
  try {
    serialized = JSON.stringify(data)
  } catch {
    return { ok: false, reason: 'serialize' }
  }
  try {
    storage.setItem(STORAGE_KEY, serialized)
    return { ok: true }
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, reason: 'quota' }
    }
    return { ok: false, reason: 'unavailable' }
  }
}

export function clearSession(): SaveResult {
  const storage = getStorage()
  if (storage === null) {
    return { ok: false, reason: 'unavailable' }
  }
  try {
    storage.removeItem(STORAGE_KEY)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}
