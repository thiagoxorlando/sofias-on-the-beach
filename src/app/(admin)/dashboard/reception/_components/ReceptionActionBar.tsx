'use client'

import { useEffect, useState, useTransition, useActionState } from 'react'
import Link from 'next/link'
import {
  markCheckedInAction,
  markCheckedOutAction,
  addReservationNoteAction,
  type ActionState,
} from '../../reservations/actions'
import { HandoffRequestModal } from '@/components/admin/HandoffRequestModal'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-4 py-2.5 ' +
  'text-[13px] font-semibold hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 ' +
  'text-[13px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const LINK =
  'inline-flex items-center text-[13px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-3 text-[13px] text-slate-700 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40 resize-none'

type ActionKind = 'check_in' | 'check_out' | null

export function ReceptionActionBar({
  reservationId,
  roomId,
  roomName,
  action,
  waHref,
  note,
  checkInWarnings,
  checkOutWarnings,
}: {
  reservationId: string
  roomId?: string | null
  roomName?: string | null
  action: ActionKind
  waHref: string | null
  note: string | null
  checkInWarnings?: string[]
  checkOutWarnings?: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [showHandoff, setShowHandoff] = useState(false)

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
      {action === 'check_in' && checkInWarnings && checkInWarnings.length > 0 && (
        <ul className="space-y-1 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
          {checkInWarnings.map((w) => (
            <li key={w} className="text-[12px] text-amber-700 flex items-start gap-1.5">
              <span className="mt-0.5">⚠</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      {action === 'check_out' && checkOutWarnings && checkOutWarnings.length > 0 && (
        <ul className="space-y-1 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
          {checkOutWarnings.map((w) => (
            <li key={w} className="text-[12px] text-amber-700 flex items-start gap-1.5">
              <span className="mt-0.5">⚠</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
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
        <button type="button" onClick={() => setShowHandoff(true)} className={BTN_SECONDARY}>
          Enviar solicitação
        </button>
        <Link href={`/dashboard/reservations/${reservationId}/print`} className={LINK}>
          Imprimir ficha
        </Link>
        <Link href={`/dashboard/reservations/${reservationId}`} className={LINK}>
          Ver reserva →
        </Link>
      </div>

      {note && <p className="text-[12px] text-slate-400">{note}</p>}

      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}

      {showNote && <QuickNoteForm reservationId={reservationId} onDone={() => setShowNote(false)} />}

      {showHandoff && (
        <HandoffRequestModal
          reservationId={reservationId}
          roomId={roomId}
          roomName={roomName}
          onClose={() => setShowHandoff(false)}
        />
      )}
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
