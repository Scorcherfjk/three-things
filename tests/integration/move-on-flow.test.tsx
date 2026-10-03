import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
import { GAME_OVER_QUESTIONS } from '@/components/StatusBanner'
import type { SessionData } from '@/domain/types'
import { STORAGE_KEY } from '@/storage/storageKeys'

function seedSession(
  timing: SessionData['timing'] = { animationSeconds: 0, answerSeconds: 30 },
): SessionData {
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

function draw(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'Draw' }))
  return screen.getByRole('region', { name: 'Current round' })
}

function moveOn(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Next round' }))
}

function goToSetup(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Setup' }))
}

function goToPlay(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Play' }))
}

function setTiming(animationSeconds: number, answerSeconds: number): void {
  goToSetup()
  const animationField = screen.getByLabelText('Animation time')
  fireEvent.change(animationField, { target: { value: String(animationSeconds) } })
  fireEvent.focusOut(animationField)
  const answerField = screen.getByLabelText('Answer time')
  fireEvent.change(answerField, { target: { value: String(answerSeconds) } })
  fireEvent.focusOut(answerField)
  goToPlay()
}

describe('move-on flow', () => {
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

  it('shows no move-on control while the draw animation runs and keeps Draw disabled (V10, FR-017)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(seedSession({ animationSeconds: 3, answerSeconds: 30 })),
    )
    render(<App />)

    const drawButton = screen.getByRole('button', { name: 'Draw' })
    fireEvent.click(drawButton)

    expect(screen.queryByRole('button', { name: 'Next round' })).toBeNull()
    expect(drawButton).toBeDisabled()
  })

  it('shows exactly one Next round control in the running state, enabled from the first paint (V10, FR-015, SC-004)', () => {
    render(<App />)

    const region = draw()

    expect(screen.getAllByRole('button', { name: 'Next round' })).toHaveLength(1)
    expect(within(region).getByRole('button', { name: 'Next round' })).toBeEnabled()
  })

  it('reveals the assignment and an enabled control in the same render when the animation time is 0 (SC-001, SC-004)', () => {
    render(<App />)

    const clickAt = performance.now()
    const region = draw()
    const revealMs = performance.now() - clickAt

    expect(revealMs).toBeLessThan(1000)
    expect(within(region).getByRole('button', { name: 'Next round' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Resume countdown' })).toBeNull()
    expect(within(region).getAllByRole('button')).toHaveLength(1)
  })

  it('keeps the control present and enabled in the final second without flickering (SC-004)', () => {
    render(<App />)
    const region = draw()

    advance(10_000)
    for (let tick = 0; tick < 39; tick += 1) {
      advance(500)
      const controls = within(region).getAllByRole('button', { name: 'Next round' })
      expect(controls).toHaveLength(1)
      expect(controls[0]).toBeEnabled()
    }

    expect(within(region).getByRole('timer')).toHaveTextContent('00:01')

    advance(500)
    const finalControls = within(region).getAllByRole('button', { name: 'Next round' })
    expect(finalControls).toHaveLength(1)
    expect(finalControls[0]).toBeEnabled()
    expect(within(region).getByText("Time's up!")).toBeInTheDocument()
  })

  it('keeps the same single control enabled in the final second (V10, SC-004, SC-017)', () => {
    render(<App />)
    const region = draw()

    advance(29_000)

    expect(within(region).getByRole('timer')).toHaveTextContent('00:01')
    const controls = screen.getAllByRole('button', { name: 'Next round' })
    expect(controls).toHaveLength(1)
    expect(controls[0]).toBeEnabled()
  })

  it('shows the same single control after time is up (V10, FR-014, SC-017)', () => {
    render(<App />)
    const region = draw()

    advance(30_000)

    expect(within(region).getByText("Time's up!")).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Next round' })).toHaveLength(1)
    expect(within(region).getByRole('button', { name: 'Next round' })).toBeEnabled()
  })

  it('stops the countdown at once and clears the screen when the host moves on early (V9, FR-016, SC-005)', () => {
    render(<App />)
    const region = draw()
    expect(within(region).getByRole('timer')).toHaveTextContent('00:30')

    advance(10_000)
    expect(within(region).getByRole('timer')).toHaveTextContent('00:20')

    moveOn()

    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
    expect(screen.queryByText("Time's up!")).toBeNull()

    advance(30_000)
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(screen.queryByText("Time's up!")).toBeNull()
  })

  it('draws nothing by itself after an early move-on (FR-022)', () => {
    render(<App />)
    draw()
    moveOn()

    advance(60_000)

    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
  })

  it('leaves the counts unchanged and the skipped pair drawable again (FR-018, FR-019, SC-006)', () => {
    render(<App />)
    const counts = screen.getByText(
      'Eligible participants: 2 · Eligible questions: 2 · Disabled: 0 participants, 0 questions',
    )

    draw()
    expect(
      within(screen.getByRole('region', { name: 'Current round' })).getByText('Ada'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Current round' })).getByText('Tell a short story'),
    ).toBeInTheDocument()
    moveOn()

    expect(
      screen.getByText(
        'Eligible participants: 2 · Eligible questions: 2 · Disabled: 0 participants, 0 questions',
      ),
    ).toBeInTheDocument()
    expect(counts).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Ada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Tell a short story' })).toBeInTheDocument()

    draw()
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
  })

  it('offers Resume countdown plus Next round while interrupted, and Next round drops the round (V10 step 4, US2 AS5)', () => {
    render(<App />)
    draw()
    advance(5_000)

    goToSetup()
    goToPlay()

    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(within(interrupted).getByRole('button', { name: 'Resume countdown' })).toBeEnabled()
    expect(within(interrupted).getByRole('button', { name: 'Next round' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Discard round' })).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Next round' })).toHaveLength(1)

    moveOn()

    expect(screen.queryByRole('region', { name: 'Interrupted round' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeEnabled()
  })

  it('ends exactly one round on a rapid double press (V11, FR-021)', () => {
    render(<App />)
    draw()

    const control = screen.getByRole('button', { name: 'Next round' })
    act(() => {
      fireEvent.click(control)
      fireEvent.click(control)
    })

    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()

    const region = draw()
    expect(screen.getAllByRole('region', { name: 'Current round' })).toHaveLength(1)
    expect(within(region).getByText('Ada')).toBeInTheDocument()
    expect(within(region).getByText('Tell a short story')).toBeInTheDocument()
  })

  it('reports questions as exhausted with no pair and no animation after moving on early (V11, FR-020)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        participants: [{ id: 'p1', text: 'Ada', status: 'eligible' }],
        questions: [
          { id: 'q1', text: 'Tell a short story', status: 'eligible' },
          { id: 'q2', text: 'Do an impression', status: 'eligible' },
        ],
        timing: { animationSeconds: 0, answerSeconds: 30 },
        currentRound: null,
        view: 'play',
      }),
    )
    render(<App />)

    draw()
    moveOn()
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Disable Tell a short story' }))
    fireEvent.click(screen.getByRole('button', { name: 'Disable Do an impression' }))

    expect(screen.getByText(GAME_OVER_QUESTIONS)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Current round' })).toBeNull()
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Draw' })).toBeDisabled()
  })

  it('leaves a round on screen untouched by a later timing change while the control stays available (FR-010)', () => {
    render(<App />)
    draw()
    advance(10_000)

    setTiming(0, 120)

    const interrupted = screen.getByRole('region', { name: 'Interrupted round' })
    expect(within(interrupted).getByRole('timer')).toHaveTextContent('00:20')
    expect(within(interrupted).getByRole('button', { name: 'Next round' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Resume countdown' }))
    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Current round' })).getByRole('timer'),
    ).toHaveTextContent('00:20')
  })
})
