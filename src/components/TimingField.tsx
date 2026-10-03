import { useCallback, useState } from 'react'
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react'
import { TIMING_RANGES, parseSeconds, rejectionMessage, timingHint } from '@/domain/timing'
import type { TimingKind } from '@/domain/timing'
import styles from './TimingField.module.css'

interface TimingFieldProps {
  kind: TimingKind
  value: number
  onCommit: (kind: TimingKind, seconds: number) => void
}

interface Draft {
  forSeconds: number
  text: string
}

function readKind(target: HTMLElement): TimingKind {
  return target.dataset.timingKind === 'answer' ? 'answer' : 'animation'
}

export function TimingField({ kind, value, onCommit }: TimingFieldProps) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const range = TIMING_RANGES[kind]
  const fieldId = `timing-${kind}`
  const hintId = `timing-${kind}-hint`
  const messageId = `timing-${kind}-message`
  const text = draft !== null && draft.forSeconds === value ? draft.text : String(value)

  const commit = useCallback(
    (target: HTMLInputElement) => {
      const committedKind = readKind(target)
      const raw = target.value
      const result = parseSeconds(raw, committedKind)
      setDraft(null)
      if (result.status === 'valid') {
        setMessage(null)
        onCommit(committedKind, result.seconds)
        return
      }
      if (result.status === 'empty') {
        setMessage(null)
        onCommit(committedKind, TIMING_RANGES[committedKind].defaultSeconds)
        return
      }
      setMessage(rejectionMessage(committedKind, result.status, raw, value))
    },
    [onCommit, value],
  )

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraft({ forSeconds: value, text: event.currentTarget.value })
    },
    [value],
  )

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      commit(event.currentTarget)
    },
    [commit],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return
      }
      commit(event.currentTarget)
    },
    [commit],
  )

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {range.label}
      </label>
      <input
        id={fieldId}
        className={styles.input}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        data-timing-kind={kind}
        aria-invalid={message !== null}
        aria-describedby={message === null ? hintId : `${hintId} ${messageId}`}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <p className={styles.hint} id={hintId}>
        {timingHint(kind)}
      </p>
      {message === null ? null : (
        <p className={styles.message} id={messageId} role="alert">
          {message}
        </p>
      )}
    </div>
  )
}
