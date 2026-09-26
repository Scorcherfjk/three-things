import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/app/App'
import type { SessionData } from '@/domain/types'
import { ANIMATION_DURATION_MS } from '@/hooks/useRound'
import { STORAGE_KEY } from '@/storage/storageKeys'

function seedLargeSession(): SessionData {
  const participants = Array.from({ length: 200 }, (_, index) => ({
    id: `p${index}`,
    text: `Participant ${index}`,
    status: 'eligible' as const,
  }))
  const questions = Array.from({ length: 200 }, (_, index) => ({
    id: `q${index}`,
    text: `Question ${index}?`,
    status: 'eligible' as const,
  }))
  return {
    version: 1,
    participants,
    questions,
    currentRound: null,
    view: 'play',
  }
}

describe('performance with 200 participants and 200 questions (SC-006)', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLargeSession()))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders both lists and starts drawing within one second of activation', () => {
    const mountStart = performance.now()
    render(<App />)
    const mountMs = performance.now() - mountStart

    expect(screen.getAllByRole('listitem')).toHaveLength(400)
    expect(mountMs).toBeLessThan(1000)

    const drawButton = screen.getByRole('button', { name: 'Draw' })

    const clickStart = performance.now()
    fireEvent.click(drawButton)
    const activationMs = performance.now() - clickStart

    expect(activationMs).toBeLessThan(1000)
    expect(drawButton).toBeDisabled()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()

    expect(ANIMATION_DURATION_MS).toBeLessThan(5000)
    act(() => {
      vi.advanceTimersByTime(ANIMATION_DURATION_MS)
    })

    expect(screen.getByRole('region', { name: 'Current round' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable Participant 0' })).toBeInTheDocument()
  })
})
