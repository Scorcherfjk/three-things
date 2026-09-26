import styles from './StatusBanner.module.css'

export const STORAGE_ERROR_MESSAGE =
  "We couldn't save your changes in this browser. Your last saved lists are unchanged."

export const LINE_TOO_LONG_MESSAGE =
  'This line is too long and was skipped. The rest of your list was saved.'

export const EMPTY_SETUP_MESSAGE = 'Add participants and questions in the setup view to start.'

export const GAME_OVER_QUESTIONS =
  'The game is over — you have no eligible questions left. Restore questions or add more to keep playing.'

export const GAME_OVER_PARTICIPANTS =
  'The game is over — you have no eligible participants left. Restore participants or add more to keep playing.'

export const GAME_OVER_BOTH =
  'The game is over — you have no eligible participants or questions left. Restore them or add more to keep playing.'

interface StatusBannerProps {
  message: string | null
}

export function StatusBanner({ message }: StatusBannerProps) {
  if (message === null) {
    return null
  }
  return (
    <p className={styles.banner} role="alert">
      {message}
    </p>
  )
}
