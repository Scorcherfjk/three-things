import { useCallback, useEffect, useRef, useState } from 'react'
import { createId } from '@/domain/ids'
import { emptySession } from '@/domain/types'
import type { Item, ItemKind, Round, SessionData, View } from '@/domain/types'
import { clearSession, loadSession, saveSession } from '@/storage/sessionStore'

function appendItems(prev: SessionData, kind: ItemKind, texts: string[]): SessionData {
  const additions: Item[] = texts
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .map((text) => ({ id: createId(), text, status: 'eligible' as const }))

  if (kind === 'participant') {
    return { ...prev, participants: [...prev.participants, ...additions] }
  }
  return { ...prev, questions: [...prev.questions, ...additions] }
}

function updateItem(items: Item[], id: string, update: (item: Item) => Item): Item[] {
  return items.map((item) => (item.id === id ? update(item) : item))
}

export function useSessionData() {
  const [session, setSession] = useState<SessionData>(() => loadSession())
  const [storageError, setStorageError] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    const result = saveSession(session)
    setStorageError(!result.ok)
  }, [session])

  const setView = useCallback((view: View) => {
    setSession((prev) => ({ ...prev, view }))
  }, [])

  const addItems = useCallback((kind: ItemKind, texts: string[]) => {
    setSession((prev) => appendItems(prev, kind, texts))
  }, [])

  const addItem = useCallback(
    (kind: ItemKind, text: string) => {
      addItems(kind, [text])
    },
    [addItems],
  )

  const removeItem = useCallback((kind: ItemKind, id: string) => {
    setSession((prev) => {
      if (kind === 'participant') {
        return { ...prev, participants: prev.participants.filter((item) => item.id !== id) }
      }
      return { ...prev, questions: prev.questions.filter((item) => item.id !== id) }
    })
  }, [])

  const editItemText = useCallback((kind: ItemKind, id: string, text: string) => {
    const nextText = text.trim()
    if (nextText.length === 0) {
      return
    }
    setSession((prev) => {
      const edit = (item: Item): Item => (item.id === id ? { ...item, text: nextText } : item)
      if (kind === 'participant') {
        return { ...prev, participants: updateItem(prev.participants, id, edit) }
      }
      return { ...prev, questions: updateItem(prev.questions, id, edit) }
    })
  }, [])

  const toggleItemStatus = useCallback((kind: ItemKind, id: string) => {
    setSession((prev) => {
      const toggle = (item: Item): Item => ({
        ...item,
        status: item.status === 'eligible' ? 'disabled' : 'eligible',
      })
      if (kind === 'participant') {
        return { ...prev, participants: updateItem(prev.participants, id, toggle) }
      }
      return { ...prev, questions: updateItem(prev.questions, id, toggle) }
    })
  }, [])

  const restoreAll = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      participants: prev.participants.map((item) => ({ ...item, status: 'eligible' as const })),
      questions: prev.questions.map((item) => ({ ...item, status: 'eligible' as const })),
    }))
  }, [])

  const clearAll = useCallback(() => {
    const result = clearSession()
    setStorageError(!result.ok)
    setSession(emptySession())
  }, [])

  const setCurrentRound = useCallback((round: Round | null) => {
    setSession((prev) => ({ ...prev, currentRound: round }))
  }, [])

  return {
    participants: session.participants,
    questions: session.questions,
    view: session.view,
    currentRound: session.currentRound,
    storageError,
    setView,
    addItem,
    addItems,
    removeItem,
    editItemText,
    toggleItemStatus,
    restoreAll,
    clearAll,
    setCurrentRound,
  }
}

export type SessionController = ReturnType<typeof useSessionData>
