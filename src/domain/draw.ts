import type { Item } from './types'

export type RandomFn = () => number

export interface DrawPair {
  participant: Item
  question: Item
}

function pickEligible(items: Item[], random: RandomFn): Item | null {
  const eligible = items.filter((item) => item.status === 'eligible')
  if (eligible.length === 0) {
    return null
  }
  const index = Math.floor(random() * eligible.length)
  return eligible[Math.min(Math.max(index, 0), eligible.length - 1)] ?? null
}

export function selectRound(
  participants: Item[],
  questions: Item[],
  random: RandomFn = Math.random,
): DrawPair | null {
  const participant = pickEligible(participants, random)
  const question = pickEligible(questions, random)
  if (participant === null || question === null) {
    return null
  }
  return { participant, question }
}
