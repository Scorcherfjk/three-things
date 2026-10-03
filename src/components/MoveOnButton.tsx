import { useCallback } from 'react'
import styles from './MoveOnButton.module.css'

export const MOVE_ON_LABEL = 'Next round'

interface MoveOnButtonProps {
  onMoveOn: () => void
}

export function MoveOnButton({ onMoveOn }: MoveOnButtonProps) {
  const handleClick = useCallback(() => {
    onMoveOn()
  }, [onMoveOn])

  return (
    <button type="button" className={styles.moveOnButton} onClick={handleClick}>
      {MOVE_ON_LABEL}
    </button>
  )
}
