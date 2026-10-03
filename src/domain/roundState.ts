import type { Round } from './types'

export function startRound(
  participantId: string,
  questionId: string,
  drawnAt: number,
  answerMs: number,
): Round {
  return {
    participantId,
    questionId,
    drawnAt,
    answerMs,
    deadline: drawnAt + answerMs,
    remainingMs: answerMs,
    status: 'running',
  }
}

export function remainingOf(round: Round, now: number): number {
  if (round.status === 'interrupted') {
    return Math.min(Math.max(round.remainingMs, 0), round.answerMs)
  }
  if (round.status === 'timeup') {
    return 0
  }
  return Math.min(Math.max(round.deadline - now, 0), round.answerMs)
}

export function interruptRound(round: Round, now: number): Round {
  if (round.status !== 'running') {
    return round
  }
  return { ...round, remainingMs: remainingOf(round, now), status: 'interrupted' }
}

export function resumeRound(round: Round, now: number): Round {
  if (round.status !== 'interrupted') {
    return round
  }
  const remaining = Math.min(Math.max(round.remainingMs, 0), round.answerMs)
  if (remaining <= 0) {
    return { ...round, status: 'timeup' }
  }
  return { ...round, deadline: now + remaining, remainingMs: round.answerMs, status: 'running' }
}

export function expireRound(round: Round, now: number): Round {
  if (round.status !== 'running' || now < round.deadline) {
    return round
  }
  return { ...round, status: 'timeup' }
}

export function discardRound(_round: Round): Round | null {
  return null
}
