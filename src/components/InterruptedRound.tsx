import { formatClock } from '@/domain/clock'
import { MoveOnButton } from './MoveOnButton'
import styles from './InterruptedRound.module.css'

interface InterruptedRoundProps {
  participantText: string
  questionText: string
  remainingMs: number
  onResume: () => void
  onMoveOn: () => void
}

export function InterruptedRound({
  participantText,
  questionText,
  remainingMs,
  onResume,
  onMoveOn,
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
        <MoveOnButton onMoveOn={onMoveOn} />
      </div>
    </section>
  )
}
