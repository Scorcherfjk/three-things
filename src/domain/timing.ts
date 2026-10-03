import type { TimingSettings } from './types'

export type TimingKind = 'animation' | 'answer'

export interface TimingRange {
  min: number
  max: number
  defaultSeconds: number
  label: string
  hint: string
}

export const TIMING_RANGES: Record<TimingKind, TimingRange> = {
  animation: {
    min: 0,
    max: 5,
    defaultSeconds: 3,
    label: 'Animation time',
    hint: 'Whole seconds from 0 to 5. Use 0 to skip the animation.',
  },
  answer: {
    min: 5,
    max: 300,
    defaultSeconds: 60,
    label: 'Answer time',
    hint: 'Whole seconds from 5 to 300.',
  },
}

export type ParseSecondsResult =
  | { status: 'valid'; seconds: number }
  | { status: 'empty' }
  | { status: 'out-of-range' }
  | { status: 'not-a-whole-number' }

export type RejectionStatus = 'out-of-range' | 'not-a-whole-number'

const WHOLE_SECONDS_PATTERN = /^\d+$/

export function defaultTiming(): TimingSettings {
  return {
    animationSeconds: TIMING_RANGES.animation.defaultSeconds,
    answerSeconds: TIMING_RANGES.answer.defaultSeconds,
  }
}

export function parseSeconds(raw: string, kind: TimingKind): ParseSecondsResult {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { status: 'empty' }
  }
  if (!WHOLE_SECONDS_PATTERN.test(trimmed)) {
    return { status: 'not-a-whole-number' }
  }
  const seconds = Number(trimmed)
  const range = TIMING_RANGES[kind]
  if (seconds < range.min || seconds > range.max) {
    return { status: 'out-of-range' }
  }
  return { status: 'valid', seconds }
}

export function timingHint(kind: TimingKind): string {
  return TIMING_RANGES[kind].hint
}

export function rejectionMessage(
  kind: TimingKind,
  status: RejectionStatus,
  raw: string,
  currentSeconds: number,
): string {
  const range = TIMING_RANGES[kind]
  const requirement = `${range.label} must be a whole number of seconds between ${range.min} and ${range.max}.`
  if (status === 'out-of-range') {
    return `${requirement} ${raw.trim()} was not saved, so ${currentSeconds} seconds is still in use.`
  }
  return `${requirement} Only whole seconds are accepted, so ${currentSeconds} seconds is still in use.`
}
