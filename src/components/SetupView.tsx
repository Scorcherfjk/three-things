import { useCallback, useState } from 'react'
import type { TimingKind } from '@/domain/timing'
import type { SessionController } from '@/hooks/useSessionData'
import { ClearAllDialog } from './ClearAllDialog'
import { ListPanel } from './ListPanel'
import { LINE_TOO_LONG_MESSAGE, STORAGE_ERROR_MESSAGE, StatusBanner } from './StatusBanner'
import { TimingSettings } from './TimingSettings'
import styles from './SetupView.module.css'

export const PRIVACY_LINE = 'Your lists stay on this device and are never sent to anyone.'

interface SetupViewProps {
  session: SessionController
}

export function SetupView({ session }: SetupViewProps) {
  const { storageError, clearAll, timing, setTiming, restoreDefaultTiming } = session
  const [lineRejected, setLineRejected] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleImportResult = useCallback((rejected: number) => {
    setLineRejected(rejected > 0)
  }, [])

  const handleTimingCommit = useCallback(
    (kind: TimingKind, seconds: number) => {
      setTiming(kind, seconds)
    },
    [setTiming],
  )

  const handleRestoreDefaults = useCallback(() => {
    restoreDefaultTiming()
  }, [restoreDefaultTiming])

  const handleClearAllClick = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleCancelClear = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleConfirmClear = useCallback(() => {
    clearAll()
    setLineRejected(false)
    setDialogOpen(false)
  }, [clearAll])

  const bannerMessage = storageError
    ? STORAGE_ERROR_MESSAGE
    : lineRejected
      ? LINE_TOO_LONG_MESSAGE
      : null

  return (
    <div className={styles.setup}>
      <StatusBanner message={bannerMessage} />
      <TimingSettings
        timing={timing}
        onTimingCommit={handleTimingCommit}
        onRestoreDefaults={handleRestoreDefaults}
      />
      <div className={styles.panels}>
        <ListPanel
          kind="participant"
          title="Participants"
          session={session}
          onImportResult={handleImportResult}
        />
        <ListPanel
          kind="question"
          title="Questions"
          session={session}
          onImportResult={handleImportResult}
        />
      </div>
      <footer className={styles.footer}>
        <p className={styles.privacy}>{PRIVACY_LINE}</p>
        <button type="button" className={styles.clearButton} onClick={handleClearAllClick}>
          Clear all data
        </button>
      </footer>
      <ClearAllDialog
        open={dialogOpen}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </div>
  )
}
