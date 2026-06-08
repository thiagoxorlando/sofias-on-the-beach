'use client'

import { useEffect, useState, useTransition, useActionState } from 'react'
import Link from 'next/link'
import {
  markCheckedInAction,
  markCheckedOutAction,
  addReservationNoteAction,
  type ActionState,
} from '../../reservations/actions'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-ocean-200 text-ocean-700 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const LINK =
  'inline-flex items-center text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors'

const TEXTAREA =
  'w-full border border-ocean-200 rounded-xl px-3.5 py-3 text-[13px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none'

type ActionKind = 'check_in' | 'check_out' | null

export function ReceptionActionBar({
  reservationId,
  action,
  waHref,
  note,
}: {
  reservationId: string
  action: ActionKind
  waHref: string | null
  note: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [showNote, setShowNote] = useState(false)

  function run(fn: (id: string) => Promise<ActionState>, successText: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await fn(reservationId)
      if (result && 'error' in result) setFeedback({ kind: 'error', text: result.error })
      else setFeedback({ kind: 'success', text: successText })
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {action === 'check_in' && (
          <button type="button" disabled={isPending} onClick={() => run(markCheckedInAction, 'Check-in registrado.')} className={BTN_PRIMARY}>
            Registrar check-in
          </button>
        )}
        {action === 'check_out' && (
          <button type="button" disabled={isPending} onClick={() => run(markCheckedOutAction, 'Check-out registrado.')} className={BTN_PRIMARY}>
            Registrar check-out
          </button>
        )}
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
            WhatsApp
          </a>
        )}
        <button type="button" onClick={() => setShowNote((v) => !v)} className={BTN_SECONDARY}>
          {showNote ? 'Fechar nota' : 'Adicionar nota'}
        </button>
        <Link href={`/dashboard/reservations/${reservationId}`} className={LINK}>
          Ver reserva →
        </Link>
      </div>

      {note && <p className="text-[12px] text-ocean-400">{note}</p>}

      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}

      {showNote && <QuickNoteForm reservationId={reservationId} onDone={() => setShowNote(false)} />}
    </div>
  )
}

function QuickNoteForm({ reservationId, onDone }: { reservationId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addReservationNoteAction, undefined)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={formAction} className="max-w-md space-y-2">
      <input type="hidden" name="reservation_id" value={reservationId} />
      <textarea name="note" rows={2} required placeholder="Nota interna rápida sobre esta reserva…" className={TEXTAREA} />
      {state && 'error' in state && (
        <p className="text-[12px] font-medium text-red-600">{state.error}</p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? 'Salvando…' : 'Salvar nota'}
        </button>
      </div>
    </form>
  )
}
