import { useCallback } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { countSession, exhaustedResource } from '@/domain/counts'
import type { ExhaustedResource } from '@/domain/counts'
import { ANIMATION_DURATION_MS, useRound } from '@/hooks/useRound'
import type { SessionController } from '@/hooks/useSessionData'
import type { Item, ItemKind, SessionData } from '@/domain/types'
import { DrawAnimation } from './DrawAnimation'
import { InterruptedRound } from './InterruptedRound'
import { ItemList } from './ItemList'
import { RoundDisplay } from './RoundDisplay'
import {
  EMPTY_SETUP_MESSAGE,
  GAME_OVER_BOTH,
  GAME_OVER_PARTICIPANTS,
  GAME_OVER_QUESTIONS,
  STORAGE_ERROR_MESSAGE,
  StatusBanner,
} from './StatusBanner'
import styles from './PlayView.module.css'

interface PlayViewProps {
  session: SessionController
}

function findText(items: Item[], id: string): string {
  return items.find((item) => item.id === id)?.text ?? ''
}

function gameOverText(resource: ExhaustedResource): string {
  if (resource === 'participants') {
    return GAME_OVER_PARTICIPANTS
  }
  if (resource === 'questions') {
    return GAME_OVER_QUESTIONS
  }
  return GAME_OVER_BOTH
}

function playStatusMessage(
  storageError: boolean,
  participants: SessionData['participants'],
  questions: SessionData['questions'],
): string | null {
  if (storageError) {
    return STORAGE_ERROR_MESSAGE
  }
  const resource = exhaustedResource(participants, questions)
  if (resource !== null) {
    return gameOverText(resource)
  }
  if (participants.length === 0 && questions.length === 0) {
    return EMPTY_SETUP_MESSAGE
  }
  return null
}

function toggleButton(
  kind: ItemKind,
  item: Item,
  onClick: (event: MouseEvent<HTMLButtonElement>) => void,
): ReactNode {
  const action = item.status === 'eligible' ? 'Disable' : 'Enable'
  return (
    <button
      type="button"
      className={styles.toggleButton}
      data-kind={kind}
      data-item-id={item.id}
      aria-label={`${action} ${item.text}`}
      onClick={onClick}
    >
      {action}
    </button>
  )
}

export function PlayView({ session }: PlayViewProps) {
  const {
    participants,
    questions,
    currentRound,
    view,
    storageError,
    setCurrentRound,
    toggleItemStatus,
    restoreAll,
  } = session
  const { animating, pendingPair, remainingMs, draw, resume, closeRound } = useRound({
    participants,
    questions,
    currentRound,
    view,
    setCurrentRound,
  })

  const counts = countSession(participants, questions)
  const resource = exhaustedResource(participants, questions)
  const drawDisabled = animating || currentRound !== null || resource !== null
  const bannerMessage = playStatusMessage(storageError, participants, questions)

  const handleDraw = useCallback(() => {
    draw()
  }, [draw])

  const handleResume = useCallback(() => {
    resume()
  }, [resume])

  const handleCloseRound = useCallback(() => {
    closeRound()
  }, [closeRound])

  const handleToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const kind = event.currentTarget.dataset.kind
      const id = event.currentTarget.dataset.itemId ?? ''
      if (kind === 'participant' || kind === 'question') {
        toggleItemStatus(kind, id)
      }
    },
    [toggleItemStatus],
  )

  const handleRestoreAll = useCallback(() => {
    restoreAll()
  }, [restoreAll])

  const renderParticipantControls = useCallback(
    (item: Item) => toggleButton('participant', item, handleToggle),
    [handleToggle],
  )

  const renderQuestionControls = useCallback(
    (item: Item) => toggleButton('question', item, handleToggle),
    [handleToggle],
  )

  const participantText =
    currentRound === null ? '' : findText(participants, currentRound.participantId)
  const questionText = currentRound === null ? '' : findText(questions, currentRound.questionId)

  return (
    <div className={styles.play}>
      <p className={styles.counts}>
        Eligible participants: {counts.participants.eligible} · Eligible questions:{' '}
        {counts.questions.eligible} · Disabled: {counts.participants.disabled} participants,{' '}
        {counts.questions.disabled} questions
      </p>
      <div className={styles.fullWidth}>
        <StatusBanner message={bannerMessage} />
      </div>
      <div className={styles.main}>
        <button
          type="button"
          className={styles.drawButton}
          disabled={drawDisabled}
          onClick={handleDraw}
        >
          Draw
        </button>
        {animating && pendingPair !== null ? (
          <DrawAnimation
            participants={participants}
            questions={questions}
            pair={pendingPair}
            durationMs={ANIMATION_DURATION_MS}
          />
        ) : null}
        {!animating && currentRound !== null && currentRound.status === 'interrupted' ? (
          <InterruptedRound
            participantText={participantText}
            questionText={questionText}
            remainingMs={remainingMs}
            onResume={handleResume}
            onDiscard={handleCloseRound}
          />
        ) : null}
        {!animating && currentRound !== null && currentRound.status !== 'interrupted' ? (
          <RoundDisplay
            round={currentRound}
            participantText={participantText}
            questionText={questionText}
            remainingMs={remainingMs}
            onAcknowledge={handleCloseRound}
          />
        ) : null}
      </div>
      <aside className={styles.lists}>
        <section className={styles.listPanel} aria-label="Participants">
          <h2 className={styles.listTitle}>Participants</h2>
          <ItemList items={participants} renderControls={renderParticipantControls} />
        </section>
        <section className={styles.listPanel} aria-label="Questions">
          <h2 className={styles.listTitle}>Questions</h2>
          <ItemList items={questions} renderControls={renderQuestionControls} />
        </section>
        <button type="button" className={styles.restoreButton} onClick={handleRestoreAll}>
          Restore all to eligible
        </button>
      </aside>
    </div>
  )
}
