import { formatClock } from '@/domain/clock'
import styles from './InterruptedRound.module.css'

interface InterruptedRoundProps {
  participantText: string
  questionText: string
  remainingMs: number
  onResume: () => void
  onDiscard: () => void
}

export function InterruptedRound({
  participantText,
  questionText,
  remainingMs,
  onResume,
  onDiscard,
}: InterruptedRoundProps) {
  return (
    <section className={styles.interrupted} aria-label="Interrupted round">
      <p className={styles.label}>Round interrupted — countdown paused</p>
      <div className={styles.pair}>
        <p className={styles.spotlight}>{participantText}</p>
        <p className={styles.spotlight}>{questionText}</p>
      </div>
      <p className={styles.clock} role="timer">
        {formatClock(remainingMs)}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.resumeButton} onClick={onResume}>
          Resume countdown
        </button>
        <button type="button" className={styles.discardButton} onClick={onDiscard}>
          Discard round
        </button>
      </div>
    </section>
  )
}
