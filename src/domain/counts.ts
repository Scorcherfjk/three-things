import type { Item } from './types'

export interface KindCounts {
  total: number
  eligible: number
  disabled: number
}

export interface SessionCounts {
  participants: KindCounts
  questions: KindCounts
}

export type ExhaustedResource = 'participants' | 'questions' | 'both'

function countKind(items: Item[]): KindCounts {
  const eligible = items.filter((item) => item.status === 'eligible').length
  return { total: items.length, eligible, disabled: items.length - eligible }
}

export function countSession(participants: Item[], questions: Item[]): SessionCounts {
  return {
    participants: countKind(participants),
    questions: countKind(questions),
  }
}

export function exhaustedResource(
  participants: Item[],
  questions: Item[],
): ExhaustedResource | null {
  const noParticipants = participants.every((item) => item.status === 'disabled')
  const noQuestions = questions.every((item) => item.status === 'disabled')
  if (noParticipants && noQuestions) {
    return 'both'
  }
  if (noParticipants) {
    return 'participants'
  }
  if (noQuestions) {
    return 'questions'
  }
  return null
}
