'use client'

import { useState, useTransition } from 'react'
import { markSpecialRequestHandledAction } from '@/app/(admin)/dashboard/reception/actions'

export function SpecialRequestBtn({ reservationId }: { reservationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function handleClick() {
    setErr(null)
    startTransition(async () => {
      const res = await markSpecialRequestHandledAction(reservationId)
      if (res && 'error' in res) {
        setErr(res.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
        <CheckIcon />
        Pedido marcado como atendido
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50 self-start"
      >
        {isPending ? 'Salvando…' : 'Marcar pedido como atendido'}
      </button>
      {err && <p className="text-[12px] text-red-600">{err}</p>}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
