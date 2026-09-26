import { useCallback, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { importLines } from '@/domain/importLines'
import type { Item, ItemKind } from '@/domain/types'
import type { SessionController } from '@/hooks/useSessionData'
import { ItemList } from './ItemList'
import styles from './ListPanel.module.css'

interface ListPanelProps {
  kind: ItemKind
  title: string
  session: SessionController
  onImportResult: (rejected: number) => void
}

export function ListPanel({ kind, title, session, onImportResult }: ListPanelProps) {
  const [bulkText, setBulkText] = useState('')
  const [singleText, setSingleText] = useState('')
  const { addItems, editItemText, removeItem } = session
  const items = kind === 'participant' ? session.participants : session.questions

  const handleBulkChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setBulkText(event.currentTarget.value)
  }, [])

  const handleSingleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSingleText(event.currentTarget.value)
  }, [])

  const handleAddLines = useCallback(() => {
    const result = importLines(bulkText, kind)
    if (result.accepted.length > 0) {
      addItems(kind, result.accepted)
    }
    onImportResult(result.rejected)
    setBulkText('')
  }, [addItems, bulkText, kind, onImportResult])

  const handleAddSingle = useCallback(() => {
    const result = importLines(singleText, kind)
    if (result.accepted.length > 0) {
      addItems(kind, result.accepted)
    }
    onImportResult(result.rejected)
    setSingleText('')
  }, [addItems, kind, onImportResult, singleText])

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      editItemText(kind, event.currentTarget.dataset.itemId ?? '', event.currentTarget.value)
    },
    [editItemText, kind],
  )

  const handleRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      removeItem(kind, event.currentTarget.dataset.itemId ?? '')
    },
    [kind, removeItem],
  )

  const renderText = useCallback(
    (item: Item) => (
      <input
        className={styles.itemEdit}
        type="text"
        value={item.text}
        data-item-id={item.id}
        aria-label={`Edit ${item.text}`}
        onChange={handleTextChange}
      />
    ),
    [handleTextChange],
  )

  const renderControls = useCallback(
    (item: Item) => (
      <button
        type="button"
        className={styles.removeButton}
        data-item-id={item.id}
        onClick={handleRemove}
      >
        Remove
      </button>
    ),
    [handleRemove],
  )

  return (
    <section className={styles.panel} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <label className={styles.bulkLabel} htmlFor={`bulk-${kind}`}>
        Paste {title.toLowerCase()} (one per line)
      </label>
      <textarea
        id={`bulk-${kind}`}
        className={styles.bulkInput}
        value={bulkText}
        onChange={handleBulkChange}
      />
      <button type="button" className={styles.addButton} onClick={handleAddLines}>
        Add lines
      </button>
      <div className={styles.singleRow}>
        <label className={styles.srOnly} htmlFor={`single-${kind}`}>
          Add a single {kind}
        </label>
        <input
          id={`single-${kind}`}
          className={styles.singleInput}
          type="text"
          value={singleText}
          onChange={handleSingleChange}
        />
        <button type="button" className={styles.addButton} onClick={handleAddSingle}>
          Add item
        </button>
      </div>
      <ItemList items={items} renderText={renderText} renderControls={renderControls} />
    </section>
  )
}
