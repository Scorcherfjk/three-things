import { useCallback } from 'react'
import { PlayView } from '@/components/PlayView'
import { SetupView } from '@/components/SetupView'
import { interruptRound } from '@/domain/roundState'
import { useSessionData } from '@/hooks/useSessionData'
import styles from './AppStyles.module.css'

export function App() {
  const session = useSessionData()
  const { view, setView, currentRound, setCurrentRound } = session
  const onSetupView = view === 'setup'

  const handleSetupClick = useCallback(() => {
    if (currentRound !== null && currentRound.status === 'running') {
      setCurrentRound(interruptRound(currentRound, Date.now()))
    }
    setView('setup')
  }, [currentRound, setCurrentRound, setView])

  const handlePlayClick = useCallback(() => {
    setView('play')
  }, [setView])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Three Things</h1>
        <nav className={styles.viewSwitch} aria-label="Views">
          <button
            type="button"
            className={onSetupView ? styles.tabActive : styles.tab}
            aria-current={onSetupView ? 'page' : undefined}
            onClick={handleSetupClick}
          >
            Setup
          </button>
          <button
            type="button"
            className={onSetupView ? styles.tab : styles.tabActive}
            aria-current={onSetupView ? undefined : 'page'}
            onClick={handlePlayClick}
          >
            Play
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        {onSetupView ? <SetupView session={session} /> : <PlayView session={session} />}
      </main>
    </div>
  )
}
