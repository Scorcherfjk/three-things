import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
import { GAME_OVER_QUESTIONS } from '@/components/StatusBanner'
import type { SessionData } from '@/domain/types'
import { STORAGE_KEY } from '@/storage/storageKeys'

const ANIMATION_HINT = 'Whole seconds from 0 to 5. Use 0 to skip the animation.'
const ANSWER_HINT = 'Whole seconds from 5 to 300.'

function seedSession(timing = { animationSeconds: 3, answerSeconds: 60 }): SessionData {
  return {
    version: 2,
    participants: [
      { id: 'p1', text: 'Ada', status: 'eligible' },
      { id: 'p2', text: 'Grace', status: 'eligible' },
    ],
    questions: [
      { id: 'q1', text: 'Tell a short story', status: 'eligible' },
      { id: 'q2', text: 'Do an impression', status: 'eligible' },
    ],
    timing,
    currentRound: null,
    view: 'play',
  }
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function animationField(): HTMLElement {
  return screen.getByLabelText('Animation time')
}

function answerField(): HTMLElement {
  return screen.getByLabelText('Answer time')
}

function commitByBlur(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } })
  fireEvent.focusOut(input)
}

function commitByEnter(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

function goToSetup(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
}

function goToPlay(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
}

function timerText(): string | null {
  const region = screen.queryByRole('region', { name: 'Current round' })
  return region === null ? null : within(region).getByRole('timer').textContent
}

function isAnimating(): boolean {
  return document.querySelector('[aria-hidden="true"]') !== null
}

function storedTiming(): { animationSeconds: number; answerSeconds: number } {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) {
    throw new Error('no stored session')
  }
  return (JSON.parse(raw) as SessionData).timing
}

describe('timing settings flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shows the default timing with both range hints and no save control (V1, FR-002, FR-005)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))

    render(<App />)
    goToSetup()

    expect(animationField()).toHaveValue('3')
    expect(answerField()).toHaveValue('60')
    expect(screen.getByText(ANIMATION_HINT)).toBeInTheDocument()
    expect(screen.getByText(ANSWER_HINT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull()
  })

  it('plays with the default timing when neither field is ever touched (V1, SC-010, FR-005)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    expect(isAnimating()).toBe(true)
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()

    advance(3000)

    expect(isAnimating()).toBe(false)
    expect(timerText()).toBe('01:00')
  })

  it('commits the animation time on blur and the answer time on Enter, with no error and no save control (V2, FR-008)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))

    render(<App />)
    goToSetup()

    commitByBlur(animationField(), '0')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(animationField()).toHaveValue('0')

    commitByEnter(answerField(), '10')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(answerField()).toHaveValue('10')
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull()
  })

  it('reveals with no visible animation and counts down from the configured answer time (V2, FR-003, SC-001, SC-002)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')
    goToPlay()

    const drawButton = screen.getByRole('button', { name: 'Draw' })
    const clickAt = performance.now()
    fireEvent.click(drawButton)

    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(isAnimating()).toBe(false)
    expect(performance.now() - clickAt).toBeLessThan(1000)
    expect(timerText()).toBe('00:10')
  })

  it('reveals only after the configured animation time when it is above zero (V3, FR-003)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '5')
    commitByEnter(answerField(), '10')
    goToPlay()

    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    advance(4999)
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(isAnimating()).toBe(true)

    advance(1)
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(timerText()).toBe('00:10')
  })

  it('rejects an out-of-range animation time and keeps the last valid value (V4, FR-006)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByBlur(animationField(), '9')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Animation time')
    expect(alert).toHaveTextContent('between 0 and 5')
    expect(alert).toHaveTextContent('0 seconds is still in use')
    expect(animationField()).toHaveValue('0')
    expect(storedTiming().animationSeconds).toBe(0)
  })

  it('rejects an out-of-range answer time and names its own range (V4, FR-006)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByEnter(answerField(), '120')
    commitByEnter(answerField(), '2')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Answer time')
    expect(alert).toHaveTextContent('between 5 and 300')
    expect(alert).toHaveTextContent('120 seconds is still in use')
    expect(answerField()).toHaveValue('120')
    expect(storedTiming().answerSeconds).toBe(120)
  })

  it('rejects decimals, letters and signs without ever persisting them (V4, FR-007, SC-009)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '2')

    for (const rejected of ['3.5', 'abc', '-5', '1e2', '3,5', '+3']) {
      commitByBlur(animationField(), rejected)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Only whole seconds are accepted')
      expect(alert).toHaveTextContent('2 seconds is still in use')
      expect(animationField()).toHaveValue('2')
      expect(storedTiming().animationSeconds).toBe(2)
    }
  })

  it('clears the message once a later entry is accepted (FR-006, FR-007)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()

    commitByBlur(answerField(), '2')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    commitByBlur(answerField(), '20')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(answerField()).toHaveValue('20')
  })

  it('shows no message for an unchanged field on Enter (FR-008)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()

    fireEvent.keyDown(answerField(), { key: 'Enter' })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(answerField()).toHaveValue('60')
  })

  it('keeps the last valid values after a reload, storing no rejected entry (V4, FR-009)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    const first: RenderResult = render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')
    commitByBlur(animationField(), '9')
    commitByEnter(answerField(), '3.5')

    first.unmount()
    render(<App />)
    goToSetup()

    expect(animationField()).toHaveValue('0')
    expect(answerField()).toHaveValue('10')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('returns each field to its default when it is emptied (V5, FR-007, SC-016)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()

    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')

    commitByBlur(answerField(), '')
    expect(answerField()).toHaveValue('60')
    expect(screen.queryByRole('alert')).toBeNull()

    commitByBlur(animationField(), '   ')
    expect(animationField()).toHaveValue('3')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('applies the default to the next draw after the field was emptied (V5, SC-016)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')
    commitByBlur(answerField(), '')
    goToPlay()

    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))

    expect(timerText()).toBe('01:00')
  })

  it('restores both defaults with one action and no dialog (V6, FR-011)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')

    fireEvent.click(screen.getByRole('button', { name: 'Restore default timing' }))

    expect(animationField()).toHaveValue('3')
    expect(answerField()).toHaveValue('60')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(storedTiming()).toEqual({ animationSeconds: 3, answerSeconds: 60 })
  })

  it('keeps both values across a reload (V7a, FR-009, SC-008)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    const first: RenderResult = render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')

    first.unmount()
    render(<App />)
    goToSetup()

    expect(animationField()).toHaveValue('0')
    expect(answerField()).toHaveValue('10')
  })

  it('upgrades a version 1 document without losing any saved content (V7b, FR-012, FR-013, SC-014)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        participants: [
          { id: 'p1', text: 'Ada', status: 'eligible' },
          { id: 'p2', text: 'Grace', status: 'disabled' },
        ],
        questions: [
          { id: 'q1', text: 'Tell a short story', status: 'eligible' },
          { id: 'q2', text: 'Do an impression', status: 'eligible' },
        ],
        currentRound: null,
        view: 'play',
      }),
    )

    render(<App />)
    goToSetup()

    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Grace')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tell a short story')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Do an impression')).toBeInTheDocument()
    expect(animationField()).toHaveValue('3')
    expect(answerField()).toHaveValue('60')

    goToPlay()

    expect(screen.getByRole('button', { name: 'Enable Grace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Ada' })).toBeInTheDocument()
    const drawButton = screen.getByRole('button', { name: 'Draw' })
    expect(drawButton).toBeEnabled()
    fireEvent.click(drawButton)
    advance(3000)
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
  })

  it('restores an interrupted version 1 round still frozen at its remaining time (V7b)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        participants: [{ id: 'p1', text: 'Ada', status: 'eligible' }],
        questions: [{ id: 'q1', text: 'Tell a short story', status: 'eligible' }],
        currentRound: {
          participantId: 'p1',
          questionId: 'q1',
          drawnAt: Date.now() - 18_000,
          deadline: Date.now() + 42_000,
          remainingMs: 42_000,
          status: 'interrupted',
        },
        view: 'play',
      }),
    )

    render(<App />)

    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(within(interrupted).getByText('Ada')).toBeInTheDocument()
    expect(within(interrupted).getByRole('timer')).toHaveTextContent('00:42')
  })

  it('never disturbs a round already on screen when the timing changes (V8, FR-010, SC-015)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '30')
    goToPlay()
    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    expect(timerText()).toBe('00:30')

    advance(10_000)
    expect(timerText()).toBe('00:20')

    goToSetup()
    commitByEnter(answerField(), '120')
    goToPlay()

    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(within(interrupted).getByRole('timer')).toHaveTextContent('00:20')

    fireEvent.click(screen.getByRole('button', { name: 'Resume countdown' }))
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(timerText()).toBe('00:20')

    advance(120_000)
    fireEvent.click(screen.getByRole('button', { name: 'Next round' }))
    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    expect(timerText()).toBe('02:00')
  })

  it('counts down exactly the configured answer time for 5, 10 and 300 seconds (SC-003)', () => {
    for (const answerSeconds of [5, 10, 300]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
      const view: RenderResult = render(<App />)
      goToSetup()
      commitByBlur(animationField(), '0')
      commitByEnter(answerField(), String(answerSeconds))
      goToPlay()
      fireEvent.click(screen.getByRole('button', { name: 'Draw' }))

      const expected = `${String(Math.floor(answerSeconds / 60)).padStart(2, '0')}:${String(answerSeconds % 60).padStart(2, '0')}`
      expect(timerText()).toBe(expected)

      advance(answerSeconds * 1000)
      const region = screen.getByRole('region', { name: 'Current round' })
      expect(within(region).getByText("Time's up!")).toBeInTheDocument()
      expect(within(region).getByRole('timer')).toHaveTextContent('00:00')

      view.unmount()
    }
  })

  it('never blocks the draw control because of the timing values (FR-012)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '5')
    commitByBlur(animationField(), '9')
    commitByEnter(answerField(), '2')
    goToPlay()

    expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
  })

  it('keeps reporting the exhausted resource after a timing change (FR-020)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    goToPlay()

    fireEvent.click(screen.getByRole('button', { name: 'Disable Do an impression' }))
    fireEvent.click(screen.getByRole('button', { name: 'Disable Tell a short story' }))

    expect(screen.getByText(GAME_OVER_QUESTIONS)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeDisabled()
  })

  it('runs twenty fast rounds with no animation and no round waiting longer than ten seconds (SC-002, SC-007, SC-011)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        participants: [
          { id: 'p1', text: 'Ada', status: 'eligible' },
          { id: 'p2', text: 'Grace', status: 'eligible' },
        ],
        questions: [
          { id: 'q1', text: 'Tell a short story', status: 'eligible' },
          { id: 'q2', text: 'Do an impression', status: 'eligible' },
        ],
        timing: { animationSeconds: 0, answerSeconds: 10 },
        currentRound: null,
        view: 'play',
      }),
    )

    render(<App />)

    for (let roundNumber = 0; roundNumber < 20; roundNumber += 1) {
      const drawButton = screen.getByRole('button', { name: 'Draw' })
      expect(drawButton).toBeEnabled()
      fireEvent.click(drawButton)

      const region = screen.getByRole('region', { name: 'Current round' })
      expect(document.querySelector('[aria-hidden="true"]')).toBeNull()
      expect(within(region).getByRole('timer').textContent).toBe('00:10')
      expect(screen.getAllByRole('button', { name: 'Next round' })).toHaveLength(1)
      expect(screen.getByRole('button', { name: 'Next round' })).toBeEnabled()

      advance(3000)
      expect(within(region).getByRole('timer')).toHaveTextContent('00:07')
      expect(screen.queryByText("Time's up!")).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Next round' }))
      expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
    }
  })

  it('never ends a round by itself: no round runs past the answer time on its own (SC-011)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSession()))
    render(<App />)
    goToSetup()
    commitByBlur(animationField(), '0')
    commitByEnter(answerField(), '10')
    goToPlay()

    fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
    const region = screen.getByRole('region', { name: 'Current round' })
    advance(9999)

    expect(screen.getByRole('region', { name: 'Current round' })).toBe(region)
    expect(within(region).getByRole('timer')).toHaveTextContent('00:01')
    expect(screen.queryByText("Time's up!")).toBeNull()

    advance(1)
    expect(within(region).getByText("Time's up!")).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Current round' })).toBe(region)

    advance(60_000)
    expect(screen.getByRole('region', { name: 'Current round' })).toBe(region)
    expect(screen.getByRole('button', { name: 'Draw' })).toBeDisabled()
  })
})
