import type { ReactNode } from 'react'
import type { Item, ItemStatus } from '@/domain/types'
import styles from './ItemList.module.css'

interface ItemListProps {
  items: Item[]
  renderText?: (item: Item) => ReactNode
  renderControls?: (item: Item) => ReactNode
}

function statusLabel(status: ItemStatus): string {
  return status === 'eligible' ? 'Eligible' : 'Disabled'
}

export function ItemList({ items, renderText, renderControls }: ItemListProps) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {renderText ? renderText(item) : <span className={styles.text}>{item.text}</span>}
          <span
            className={item.status === 'eligible' ? styles.badgeEligible : styles.badgeDisabled}
          >
            {statusLabel(item.status)}
          </span>
          {renderControls ? renderControls(item) : null}
        </li>
      ))}
    </ul>
  )
}
