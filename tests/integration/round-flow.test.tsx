import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
import type { SessionData } from '@/domain/types'
import { ANIMATION_DURATION_MS } from '@/hooks/useRound'
import { STORAGE_KEY } from '@/storage/storageKeys'

function seedSession(): SessionData {
  return {
    version: 1,
    participants: [
      { id: 'p1', text: 'Ada', status: 'eligible' },
      { id: 'p2', text: 'Grace', status: 'eligible' },
      { id: 'p3', text: 'Alan', status: 'eligible' },
    ],
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

describe('round flow', () => {
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

  it('draws, counts down, interrupts, resumes and discards', () => {
    render(<App />)

    const drawButton = screen.getByRole('button', { name: 'Draw' })
    expect(drawButton).toBeEnabled()

    fireEvent.click(drawButton)
    expect(drawButton).toBeDisabled()

    advance(ANIMATION_DURATION_MS)

    const round = screen.getByRole('region', { name: 'Current round' })
    expect(within(round).getByText('Ada')).toBeInTheDocument()
    expect(within(round).getByText('Tell a short story')).toBeInTheDocument()
    expect(within(round).getByRole('timer')).toHaveTextContent('01:00')

    fireEvent.click(drawButton)
    expect(screen.getAllByRole('region', { name: 'Current round' })).toHaveLength(1)

    advance(1000)
    expect(within(round).getByRole('timer')).toHaveTextContent('00:59')

    fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(
      within(interrupted).getByText('Round interrupted — countdown paused'),
    ).toBeInTheDocument()
    expect(within(interrupted).getByRole('timer')).toHaveTextContent('00:59')

    fireEvent.click(screen.getByRole('button', { name: 'Resume countdown' }))
    const resumed = screen.getByRole('region', { name: 'Current round' })
    expect(within(resumed).getByRole('timer')).toHaveTextContent('00:59')

    advance(2000)
    expect(within(resumed).getByRole('timer')).toHaveTextContent('00:57')

    fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard round' }))

    expect(screen.queryByRole('region', { name: 'Interrupted round' })).toBeNull()
    const drawAgain = screen.getByRole('button', { name: 'Draw' })
    expect(drawAgain).toBeEnabled()

    fireEvent.click(drawAgain)
    advance(ANIMATION_DURATION_MS)
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
  })

  it('shows the time-up signal and returns to idle on next round', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    advance(ANIMATION_DURATION_MS)
    advance(60_000)

    const round = screen.getByRole('region', { name: 'Current round' })
    expect(within(round).getByText("Time's up!")).toBeInTheDocument()
    expect(within(round).getByRole('timer')).toHaveTextContent('00:00')

    fireEvent.click(within(round).getByRole('button', { name: 'Next round' }))
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
  })

  it('restores an interrupted round after reload', () => {
    const first = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    advance(ANIMATION_DURATION_MS + 1000)
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()

    first.unmount()
    render(<App />)

    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(within(interrupted).getByRole('timer')).toHaveTextContent('00:59')

    fireEvent.click(screen.getByRole('button', { name: 'Resume countdown' }))
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
  })
})
