import { formatClock } from '@/domain/clock'
import type { Round } from '@/domain/types'
import { MoveOnButton } from './MoveOnButton'
import styles from './RoundDisplay.module.css'

interface RoundDisplayProps {
  round: Round
  participantText: string
  questionText: string
  remainingMs: number
  onMoveOn: () => void
}

export function RoundDisplay({
  round,
  participantText,
  questionText,
  remainingMs,
  onMoveOn,
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
      {timeUp ? <p className={styles.timeup}>Time&apos;s up!</p> : null}
      <MoveOnButton onMoveOn={onMoveOn} />
    </section>
  )
}
