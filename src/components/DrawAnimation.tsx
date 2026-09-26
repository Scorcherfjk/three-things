import { useEffect, useState } from 'react'
import type { DrawPair } from '@/domain/draw'
import type { Item } from '@/domain/types'
import styles from './DrawAnimation.module.css'

interface DrawAnimationProps {
  participants: Item[]
  questions: Item[]
  pair: DrawPair
  durationMs: number
}

function cycleText(items: Item[], index: number): string {
  if (items.length === 0) {
    return ''
  }
  return items[index % items.length]?.text ?? ''
}

export function DrawAnimation({ participants, questions, pair, durationMs }: DrawAnimationProps) {
  const [frame, setFrame] = useState(0)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const cycleId = window.setInterval(() => {
      setFrame((previous) => previous + 1)
    }, 150)
    const finishId = window.setTimeout(() => {
      setResolved(true)
      window.clearInterval(cycleId)
    }, durationMs)
    return () => {
      window.clearInterval(cycleId)
      window.clearTimeout(finishId)
    }
  }, [durationMs])

  if (resolved) {
    return (
      <div className={styles.animation}>
        <p className={`${styles.text} ${styles.revealed}`}>{pair.participant.text}</p>
        <p className={`${styles.text} ${styles.revealed}`}>{pair.question.text}</p>
      </div>
    )
  }

  return (
    <div className={styles.animation} aria-hidden="true">
      <p className={`${styles.text} ${styles.cycling}`}>{cycleText(participants, frame)}</p>
      <p className={`${styles.text} ${styles.cycling}`}>{cycleText(questions, frame + 1)}</p>
    </div>
  )
}
