import { emptySession } from '@/domain/types'
import type { Item, Round, SessionData, TimingSettings, View } from '@/domain/types'
import { STORAGE_KEY } from './storageKeys'

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialize' }

const LEGACY_ANSWER_MS = 60_000

type LegacyRound = Omit<Round, 'answerMs'>

interface LegacySessionData {
  version: 1
  participants: Item[]
  questions: Item[]
  currentRound: LegacyRound | null
  view: View
}

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

function isValidRoundStatus(value: unknown): boolean {
  return value === 'running' || value === 'interrupted' || value === 'timeup'
}

function isValidRoundBase(value: unknown): value is LegacyRound {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const round = value as Partial<LegacyRound>
  return (
    typeof round.participantId === 'string' &&
    typeof round.questionId === 'string' &&
    typeof round.drawnAt === 'number' &&
    typeof round.deadline === 'number' &&
    typeof round.remainingMs === 'number' &&
    isValidRoundStatus(round.status)
  )
}

function isValidRound(value: unknown): value is Round {
  if (!isValidRoundBase(value)) {
    return false
  }
  const answerMs = (value as Partial<Round>).answerMs
  return typeof answerMs === 'number' && Number.isFinite(answerMs) && answerMs > 0
}

function isValidView(value: unknown): value is View {
  return value === 'setup' || value === 'play'
}

function isValidTiming(value: unknown): value is TimingSettings {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const timing = value as Partial<TimingSettings>
  return (
    typeof timing.animationSeconds === 'number' &&
    typeof timing.answerSeconds === 'number' &&
    Number.isInteger(timing.animationSeconds) &&
    Number.isInteger(timing.answerSeconds) &&
    timing.animationSeconds >= 0 &&
    timing.animationSeconds <= 5 &&
    timing.answerSeconds >= 5 &&
    timing.answerSeconds <= 300
  )
}

function parseLegacySession(raw: string): LegacySessionData | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) {
    return null
  }
  const candidate = data as Partial<LegacySessionData>
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
  if (candidate.currentRound !== null && !isValidRoundBase(candidate.currentRound)) {
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

function parseCurrentSession(raw: string): SessionData | null {
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
  if (candidate.version !== 2) {
    return null
  }
  if (!Array.isArray(candidate.participants) || !Array.isArray(candidate.questions)) {
    return null
  }
  if (!candidate.participants.every(isValidItem) || !candidate.questions.every(isValidItem)) {
    return null
  }
  if (!isValidTiming(candidate.timing)) {
    return null
  }
  if (!isValidView(candidate.view)) {
    return null
  }
  if (candidate.currentRound !== null && !isValidRound(candidate.currentRound)) {
    return null
  }
  return {
    version: 2,
    participants: candidate.participants,
    questions: candidate.questions,
    timing: candidate.timing,
    currentRound: candidate.currentRound ?? null,
    view: candidate.view,
  }
}

function upgradeLegacySession(legacy: LegacySessionData): SessionData {
  return {
    version: 2,
    participants: legacy.participants,
    questions: legacy.questions,
    timing: { animationSeconds: 3, answerSeconds: 60 },
    currentRound:
      legacy.currentRound === null ? null : { ...legacy.currentRound, answerMs: LEGACY_ANSWER_MS },
    view: legacy.view,
  }
}

function parseSession(raw: string): SessionData | null {
  const current = parseCurrentSession(raw)
  if (current !== null) {
    return current
  }
  const legacy = parseLegacySession(raw)
  return legacy === null ? null : upgradeLegacySession(legacy)
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
