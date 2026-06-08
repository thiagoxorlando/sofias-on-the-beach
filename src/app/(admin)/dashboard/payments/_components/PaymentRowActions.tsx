'use client'

import { useState, useTransition } from 'react'
import {
  markPaymentFailedAction,
  markPaymentCancelledAction,
  type ActionState,
} from '../actions'
import { ManualPaymentModal } from './ManualPaymentModal'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-3.5 py-2 ' +
  'text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-3.5 py-2 ' +
  'text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-xl border border-red-200 text-red-600 px-3.5 py-2 ' +
  'text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export function PaymentRowActions({ paymentId, amount, status }: { paymentId: string; amount: number; status: string }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)

  function run(action: (id: string) => Promise<ActionState>, successText: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await action(paymentId)
      if (result && 'error' in result) setFeedback({ kind: 'error', text: result.error })
      else setFeedback({ kind: 'success', text: successText })
    })
  }

  const canCorrect = status === 'pending' || status === 'overdue'

  if (!canCorrect && !feedback) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canCorrect && (
        <>
          <button type="button" disabled={isPending} onClick={() => setShowManualModal(true)} className={BTN_PRIMARY}>
            Marcar como pago
          </button>
          <button type="button" disabled={isPending} onClick={() => run(markPaymentFailedAction, 'Pagamento marcado como falho.')} className={BTN_SECONDARY}>
            Marcar como falho
          </button>
          <button type="button" disabled={isPending} onClick={() => run(markPaymentCancelledAction, 'Pagamento marcado como cancelado.')} className={BTN_DANGER}>
            Marcar como cancelado
          </button>
        </>
      )}
      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}

      {showManualModal && (
        <ManualPaymentModal
          paymentId={paymentId}
          amount={amount}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false)
            setFeedback({ kind: 'success', text: 'Pagamento confirmado manualmente.' })
          }}
        />
      )}
    </div>
  )
}
