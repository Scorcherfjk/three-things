import { formatClock } from '@/domain/clock'
import type { Round } from '@/domain/types'
import styles from './RoundDisplay.module.css'

interface RoundDisplayProps {
  round: Round
  participantText: string
  questionText: string
  remainingMs: number
  onAcknowledge: () => void
}

export function RoundDisplay({
  round,
  participantText,
  questionText,
  remainingMs,
  onAcknowledge,
}: RoundDisplayProps) {
  const timeUp = round.status === 'timeup'

  return (
    <section className={styles.round} aria-label="Current round">
      <div className={styles.pair}>
        <p className={styles.spotlight}>{participantText}</p>
        <p className={styles.spotlight}>{questionText}</p>
      </div>
      <p className={timeUp ? styles.clockExpired : styles.clock} role="timer">
        {formatClock(remainingMs)}
      </p>
      {timeUp ? (
        <div className={styles.timeupBlock}>
          <p className={styles.timeup}>Time&apos;s up!</p>
          <button type="button" className={styles.nextButton} onClick={onAcknowledge}>
            Next round
          </button>
        </div>
      ) : null}
    </section>
  )
}
