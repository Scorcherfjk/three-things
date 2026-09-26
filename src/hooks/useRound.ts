import { useCallback, useEffect, useRef, useState } from 'react'
import { selectRound } from '@/domain/draw'
import type { DrawPair } from '@/domain/draw'
import {
  discardRound,
  expireRound,
  interruptRound,
  remainingOf,
  resumeRound,
  startRound,
} from '@/domain/roundState'
import type { Item, Round, View } from '@/domain/types'

export const ANIMATION_DURATION_MS = 2500

const TICK_INTERVAL_MS = 250

interface UseRoundOptions {
  participants: Item[]
  questions: Item[]
  currentRound: Round | null
  view: View
  setCurrentRound: (round: Round | null) => void
}

export function useRound({
  participants,
  questions,
  currentRound,
  view,
  setCurrentRound,
}: UseRoundOptions) {
  const [animating, setAnimating] = useState(false)
  const [pendingPair, setPendingPair] = useState<DrawPair | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const animationTimeoutRef = useRef<number | null>(null)
  const restoredRef = useRef(false)

  const remainingMs = currentRound === null ? 0 : remainingOf(currentRound, now)

  useEffect(() => {
    if (restoredRef.current) {
      return
    }
    restoredRef.current = true
    if (currentRound !== null && currentRound.status === 'running') {
      setCurrentRound(interruptRound(currentRound, Date.now()))
    }
  }, [currentRound, setCurrentRound])

  useEffect(() => {
    if (currentRound === null || currentRound.status !== 'running' || view !== 'play') {
      return
    }
    const intervalId = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      if (currentTime >= currentRound.deadline) {
        setCurrentRound(expireRound(currentRound, currentTime))
      }
    }, TICK_INTERVAL_MS)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [currentRound, view, setCurrentRound])

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const draw = useCallback(() => {
    if (animating || currentRound !== null) {
      return
    }
    const pair = selectRound(participants, questions)
    if (pair === null) {
      return
    }
    setPendingPair(pair)
    setAnimating(true)
    animationTimeoutRef.current = window.setTimeout(() => {
      animationTimeoutRef.current = null
      setAnimating(false)
      setPendingPair(null)
      const revealAt = Date.now()
      setNow(revealAt)
      setCurrentRound(startRound(pair.participant.id, pair.question.id, revealAt))
    }, ANIMATION_DURATION_MS)
  }, [animating, currentRound, participants, questions, setCurrentRound])

  const resume = useCallback(() => {
    if (currentRound === null || currentRound.status !== 'interrupted') {
      return
    }
    const resumeAt = Date.now()
    setNow(resumeAt)
    setCurrentRound(resumeRound(currentRound, resumeAt))
  }, [currentRound, setCurrentRound])

  const closeRound = useCallback(() => {
    setCurrentRound(currentRound === null ? null : discardRound(currentRound))
  }, [currentRound, setCurrentRound])

  return { animating, pendingPair, remainingMs, draw, resume, closeRound }
}
