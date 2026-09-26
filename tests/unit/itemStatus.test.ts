import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionData } from '@/hooks/useSessionData'

describe('item status transitions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles an item between disabled and eligible', () => {
    const { result } = renderHook(() => useSessionData())

    act(() => {
      result.current.addItems('participant', ['Ada', 'Grace'])
    })
    const id = result.current.participants[0]?.id ?? ''
    expect(result.current.participants[0]?.status).toBe('eligible')

    act(() => {
      result.current.toggleItemStatus('participant', id)
    })
    expect(result.current.participants[0]?.status).toBe('disabled')

    act(() => {
      result.current.toggleItemStatus('participant', id)
    })
    expect(result.current.participants[0]?.status).toBe('eligible')
  })

  it('restore-all sets every participant and question to eligible', () => {
    const { result } = renderHook(() => useSessionData())

    act(() => {
      result.current.addItems('participant', ['Ada', 'Grace'])
      result.current.addItems('question', ['Tell a story'])
    })
    const participantId = result.current.participants[0]?.id ?? ''
    const questionId = result.current.questions[0]?.id ?? ''

    act(() => {
      result.current.toggleItemStatus('participant', participantId)
      result.current.toggleItemStatus('question', questionId)
    })
    expect(result.current.participants[0]?.status).toBe('disabled')
    expect(result.current.questions[0]?.status).toBe('disabled')

    act(() => {
      result.current.restoreAll()
    })
    expect(result.current.participants.every((item) => item.status === 'eligible')).toBe(true)
    expect(result.current.questions.every((item) => item.status === 'eligible')).toBe(true)
  })

  it('editing text never changes the status', () => {
    const { result } = renderHook(() => useSessionData())

    act(() => {
      result.current.addItems('participant', ['Ada'])
    })
    const id = result.current.participants[0]?.id ?? ''

    act(() => {
      result.current.toggleItemStatus('participant', id)
    })
    expect(result.current.participants[0]?.status).toBe('disabled')

    act(() => {
      result.current.editItemText('participant', id, 'Ada L.')
    })
    expect(result.current.participants[0]?.text).toBe('Ada L.')
    expect(result.current.participants[0]?.status).toBe('disabled')
  })

  it('persists disabled state to storage on every change', () => {
    const { result } = renderHook(() => useSessionData())

    act(() => {
      result.current.addItems('participant', ['Ada'])
    })
    const id = result.current.participants[0]?.id ?? ''

    act(() => {
      result.current.toggleItemStatus('participant', id)
    })

    const reloaded = renderHook(() => useSessionData())
    expect(reloaded.result.current.participants[0]?.status).toBe('disabled')
  })
})
