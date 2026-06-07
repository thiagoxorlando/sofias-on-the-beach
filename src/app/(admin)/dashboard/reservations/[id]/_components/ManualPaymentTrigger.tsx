'use client'

import { useState } from 'react'
import { ManualPaymentModal } from '../../../payments/_components/ManualPaymentModal'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

type Props =
  | { paymentId: string; reservationId?: never; amount: number }
  | { paymentId?: never; reservationId: string; amount: number }

export function ManualPaymentTrigger({ paymentId, reservationId, amount }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return <p className="text-[12px] font-medium text-emerald-600">Pagamento confirmado manualmente.</p>
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>
        Confirmar pagamento manual
      </button>
      {open && (
        <ManualPaymentModal
          paymentId={paymentId}
          reservationId={reservationId}
          amount={amount}
          onClose={() => setOpen(false)}
          onSuccess={() => { setOpen(false); setConfirmed(true) }}
        />
      )}
    </>
  )
}
