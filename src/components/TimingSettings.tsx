import { useCallback } from 'react'
import type { TimingSettings as TimingValues } from '@/domain/types'
import type { TimingKind } from '@/domain/timing'
import { TimingField } from './TimingField'
import styles from './TimingSettings.module.css'

interface TimingSettingsProps {
  timing: TimingValues
  onTimingCommit: (kind: TimingKind, seconds: number) => void
  onRestoreDefaults: () => void
}

export function TimingSettings({ timing, onTimingCommit, onRestoreDefaults }: TimingSettingsProps) {
  const handleRestore = useCallback(() => {
    onRestoreDefaults()
  }, [onRestoreDefaults])

  return (
    <section className={styles.panel} aria-label="Timing">
      <h2 className={styles.title}>Timing</h2>
      <div className={styles.row}>
        <TimingField kind="animation" value={timing.animationSeconds} onCommit={onTimingCommit} />
        <TimingField kind="answer" value={timing.answerSeconds} onCommit={onTimingCommit} />
        <div className={styles.actions}>
          <button type="button" className={styles.restoreButton} onClick={handleRestore}>
            Restore default timing
          </button>
        </div>
      </div>
    </section>
  )
}
