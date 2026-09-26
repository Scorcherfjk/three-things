import styles from './ClearAllDialog.module.css'

export const CLEAR_ALL_PROMPT =
  'Clear all participants and questions from this device? This cannot be undone.'

interface ClearAllDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ClearAllDialog({ open, onConfirm, onCancel }: ClearAllDialogProps) {
  if (!open) {
    return null
  }
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Clear all data">
        <p className={styles.prompt}>{CLEAR_ALL_PROMPT}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.confirmButton} onClick={onConfirm}>
            Clear everything
          </button>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
