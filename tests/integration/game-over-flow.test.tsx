import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
import { GAME_OVER_QUESTIONS } from '@/components/StatusBanner'
import type { SessionData } from '@/domain/types'
import { STORAGE_KEY } from '@/storage/storageKeys'

const TEST_ANIMATION_DURATION_MS = 3000

function seedSession(): SessionData {
  return {
    version: 2,
    participants: [
      { id: 'p1', text: 'Ada', status: 'eligible' },
      { id: 'p2', text: 'Grace', status: 'eligible' },
      { id: 'p3', text: 'Alan', status: 'eligible' },
    ],
    timing: { animationSeconds: 3, answerSeconds: 60 },
    questions: [
      { id: 'q1', text: 'Tell a short story', status: 'eligible' },
      { id: 'q2', text: 'Do an impression', status: 'eligible' },
    ],
    currentRound: null,
    view: 'play',
  }
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('game over flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows counts, reports the exhausted resource without a pair and resumes after restore-all', () => {
    const view = render(<App />)

    expect(
      screen.getByText(
        'Eligible participants: 3 · Eligible questions: 2 · Disabled: 0 participants, 0 questions',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Disable Tell a short story' }))
    fireEvent.click(screen.getByRole('button', { name: 'Disable Do an impression' }))

    expect(screen.getByText(GAME_OVER_QUESTIONS)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeDisabled()
    expect(
      screen.getByText(
        'Eligible participants: 3 · Eligible questions: 0 · Disabled: 0 participants, 2 questions',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore all to eligible' }))

    expect(screen.queryByText(GAME_OVER_QUESTIONS)).toBeNull()
    const drawButton = screen.getByRole('button', { name: 'Draw' })
    expect(drawButton).toBeEnabled()

    fireEvent.click(drawButton)
    advance(TEST_ANIMATION_DURATION_MS)

    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Ada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Tell a short story' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Eligible participants: 3 · Eligible questions: 2 · Disabled: 0 participants, 0 questions',
      ),
    ).toBeInTheDocument()

    view.unmount()
  })
})
