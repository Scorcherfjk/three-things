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

export interface TimingSettings {
  animationSeconds: number
  answerSeconds: number
}

export interface Round {
  participantId: string
  questionId: string
  drawnAt: number
  answerMs: number
  deadline: number
  remainingMs: number
  status: RoundStatus
}

export type View = 'setup' | 'play'

export interface SessionData {
  version: 2
  participants: Participant[]
  questions: Question[]
  timing: TimingSettings
  currentRound: Round | null
  view: View
}

export function emptySession(): SessionData {
  return {
    version: 2,
    participants: [],
    questions: [],
    timing: { animationSeconds: 3, answerSeconds: 60 },
    currentRound: null,
    view: 'setup',
  }
}
