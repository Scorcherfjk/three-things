export type ItemStatus = 'eligible' | 'disabled'

export type ItemKind = 'participant' | 'question'

export interface Item {
  id: string
  text: string
  status: ItemStatus
}

export type Participant = Item
export type Question = Item

export type RoundStatus = 'running' | 'interrupted' | 'timeup'

export interface Round {
  participantId: string
  questionId: string
  drawnAt: number
  deadline: number
  remainingMs: number
  status: RoundStatus
}

export type View = 'setup' | 'play'

export interface SessionData {
  version: 1
  participants: Participant[]
  questions: Question[]
  currentRound: Round | null
  view: View
}

export function emptySession(): SessionData {
  return {
    version: 1,
    participants: [],
    questions: [],
    currentRound: null,
    view: 'setup',
  }
}
