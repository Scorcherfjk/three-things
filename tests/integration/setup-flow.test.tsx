import { fireEvent, render, screen, within } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '@/app/App'
import { PRIVACY_LINE } from '@/components/SetupView'

function pasteLines(panel: HTMLElement, lines: string): void {
  fireEvent.change(within(panel).getByRole('textbox', { name: /paste/i }), {
    target: { value: lines },
  })
  fireEvent.click(within(panel).getByRole('button', { name: 'Add lines' }))
}

function itemInputs(panel: HTMLElement): HTMLElement[] {
  return within(panel).queryAllByRole('textbox', { name: /^edit/i })
}

describe('setup flow', () => {
  it('pastes items, persists them across reload, edits and clears after confirmation', () => {
    let view: RenderResult = render(<App />)

    const participantsPanel = screen.getByRole('region', { name: 'Participants' })
    const questionsPanel = screen.getByRole('region', { name: 'Questions' })

    expect(screen.getByText(PRIVACY_LINE)).toBeInTheDocument()

    pasteLines(participantsPanel, '  Ada  \n\n   \nJosé Muñoz\nGrace\n')
    pasteLines(questionsPanel, 'Tell a short story\nDo an impression\n')

    expect(within(participantsPanel).getByDisplayValue('Ada')).toBeInTheDocument()
    expect(within(participantsPanel).getByDisplayValue('José Muñoz')).toBeInTheDocument()
    expect(within(participantsPanel).getByDisplayValue('Grace')).toBeInTheDocument()
    expect(within(questionsPanel).getByDisplayValue('Tell a short story')).toBeInTheDocument()
    expect(within(questionsPanel).getByDisplayValue('Do an impression')).toBeInTheDocument()

    view.unmount()
    view = render(<App />)

    const restoredParticipants = screen.getByRole('region', { name: 'Participants' })
    expect(within(restoredParticipants).getByDisplayValue('José Muñoz')).toBeInTheDocument()

    fireEvent.change(within(restoredParticipants).getByDisplayValue('José Muñoz'), {
      target: { value: 'José A. Muñoz' },
    })

    view.unmount()
    view = render(<App />)

    expect(
      within(screen.getByRole('region', { name: 'Participants' })).getByDisplayValue(
        'José A. Muñoz',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear all data' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      within(screen.getByRole('region', { name: 'Participants' })).getByDisplayValue(
        'José A. Muñoz',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear all data' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear everything' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(itemInputs(screen.getByRole('region', { name: 'Participants' }))).toHaveLength(0)

    view.unmount()
    view = render(<App />)
    expect(itemInputs(screen.getByRole('region', { name: 'Participants' }))).toHaveLength(0)
    expect(itemInputs(screen.getByRole('region', { name: 'Questions' }))).toHaveLength(0)
    view.unmount()
  })
})
