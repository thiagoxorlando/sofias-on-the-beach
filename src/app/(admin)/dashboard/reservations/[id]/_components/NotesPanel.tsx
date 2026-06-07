'use client'

import { useActionState } from 'react'
import { addReservationNoteAction, type ActionState } from '../../actions'

const TEXTAREA =
  'w-full border border-ocean-200 rounded-xl px-3.5 py-3 text-[13px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

type Note = {
  id: string
  note: string
  createdAtLabel: string
  authorName: string | null
}

export function NotesPanel({
  reservationId,
  notes,
}: {
  reservationId: string
  notes: Note[]
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addReservationNoteAction, undefined)

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-2.5">
        <input type="hidden" name="reservation_id" value={reservationId} />
        <textarea
          name="note"
          rows={3}
          required
          placeholder="Escreva uma nota interna sobre esta reserva…"
          className={TEXTAREA}
        />
        {state && 'error' in state && (
          <p className="text-[12px] font-medium text-red-600">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
            {isPending ? 'Salvando…' : 'Salvar nota'}
          </button>
        </div>
      </form>

      {notes.length > 0 ? (
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl bg-ocean-50/50 px-4 py-3">
              <p className="text-[13px] text-ocean-800 leading-relaxed whitespace-pre-wrap">{n.note}</p>
              <p className="text-[11px] text-ocean-400 mt-1.5">
                {n.authorName ?? 'Equipe'} · {n.createdAtLabel}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ocean-400">Nenhuma nota registrada ainda.</p>
      )}
    </div>
  )
}
