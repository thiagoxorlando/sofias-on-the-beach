'use client'

import { useActionState, useCallback, useEffect, useState, useTransition } from 'react'
import {
  markCheckedInAction,
  markCheckedOutAction,
  cancelReservationAction,
  type ActionState,
} from '../../actions'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-ocean-200 text-ocean-700 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-xl border border-red-200 text-red-600 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const TEXTAREA =
  'w-full border border-ocean-200 rounded-xl px-3.5 py-3 text-[13px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none'

export function ReservationActions({ reservationId, status, checkInWarnings }: { reservationId: string; status: string; checkInWarnings?: string[] }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const closeCancelForm = useCallback(() => setShowCancelForm(false), [])

  function run(action: (id: string) => Promise<ActionState>, successText: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await action(reservationId)
      if (result && 'error' in result) setFeedback({ kind: 'error', text: result.error })
      else setFeedback({ kind: 'success', text: successText })
    })
  }

  return (
    <div className="flex flex-col items-end gap-2.5">
      {status === 'confirmed' && checkInWarnings && checkInWarnings.length > 0 && (
        <ul className="w-full max-w-sm space-y-1 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
          {checkInWarnings.map((w) => (
            <li key={w} className="text-[12px] text-amber-700 flex items-start gap-1.5">
              <span className="mt-0.5">⚠</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === 'confirmed' && (
          <button type="button" disabled={isPending} onClick={() => run(markCheckedInAction, 'Check-in registrado.')} className={BTN_PRIMARY}>
            Registrar check-in
          </button>
        )}
        {status === 'checked_in' && (
          <button type="button" disabled={isPending} onClick={() => run(markCheckedOutAction, 'Check-out registrado.')} className={BTN_PRIMARY}>
            Registrar check-out
          </button>
        )}
        {(status === 'pending_payment' || status === 'confirmed' || status === 'checked_in') && (
          <button type="button" disabled={isPending} onClick={() => setShowCancelForm((v) => !v)} className={BTN_DANGER}>
            Cancelar reserva
          </button>
        )}
      </div>

      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}

      {showCancelForm && (
        <CancelForm
          reservationId={reservationId}
          onDone={closeCancelForm}
        />
      )}
    </div>
  )
}

function CancelForm({ reservationId, onDone }: { reservationId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(cancelReservationAction, undefined)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={formAction} className="w-full max-w-sm bg-red-50/60 border border-red-100 rounded-2xl p-4 space-y-3">
      <input type="hidden" name="reservation_id" value={reservationId} />
      <p className="text-[12px] font-semibold text-red-700">Motivo do cancelamento</p>
      <textarea
        name="reason"
        rows={3}
        required
        placeholder="Ex.: solicitação do hóspede, indisponibilidade, etc."
        className={TEXTAREA}
      />
      {state && 'error' in state && (
        <p className="text-[12px] font-medium text-red-600">{state.error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className={BTN_SECONDARY}>Voltar</button>
        <button type="submit" disabled={isPending} className={BTN_DANGER}>
          {isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
      </div>
    </form>
  )
}
