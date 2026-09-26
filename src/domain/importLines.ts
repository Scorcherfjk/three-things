import type { ItemKind } from './types'

export const MAX_TEXT_LENGTH: Record<ItemKind, number> = {
  participant: 200,
  question: 500,
}

export interface ImportResult {
  accepted: string[]
  rejected: number
}

export function isValidText(kind: ItemKind, text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_TEXT_LENGTH[kind]
}

export function importLines(raw: string, kind: ItemKind): ImportResult {
  const accepted: string[] = []
  let rejected = 0
  for (const line of raw.split('\n')) {
    const text = line.trim()
    if (text.length === 0) {
      continue
    }
    if (text.length > MAX_TEXT_LENGTH[kind]) {
      rejected += 1
      continue
    }
    accepted.push(text)
  }
  return { accepted, rejected }
}
