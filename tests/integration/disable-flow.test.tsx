import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
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
    questions: [{ id: 'q1', text: 'Tell a short story', status: 'eligible' }],
    currentRound: null,
    view: 'play',
  }
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function drawAndGetRound(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
  advance(TEST_ANIMATION_DURATION_MS)
  return screen.getByRole('region', { name: 'Current round' })
}

function moveOnRound(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
  fireEvent.click(screen.getByRole('button', { name: 'Next round' }))
}

describe('disable flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('keeps disabled items out of draws, re-enables them, persists and restores all', () => {
    let view = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Disable Ada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Disable Grace' }))

    let round = drawAndGetRound()
    expect(within(round).getByText('Alan')).toBeInTheDocument()
    expect(within(round).queryByText('Ada')).toBeNull()
    expect(within(round).queryByText('Grace')).toBeNull()
    moveOnRound()

    round = drawAndGetRound()
    expect(within(round).getByText('Alan')).toBeInTheDocument()
    expect(within(round).queryByText('Ada')).toBeNull()
    moveOnRound()

    fireEvent.click(screen.getByRole('button', { name: 'Enable Ada' }))
    round = drawAndGetRound()
    expect(within(round).getByText('Ada')).toBeInTheDocument()
    expect(within(round).queryByText('Grace')).toBeNull()

    view.unmount()
    view = render(<App />)

    expect(screen.getByRole('button', { name: 'Disable Ada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable Grace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Alan' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore all to eligible' }))
    expect(screen.queryByRole('button', { name: 'Enable Grace' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Disable Grace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Ada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Alan' })).toBeInTheDocument()

    view.unmount()
  })
})
