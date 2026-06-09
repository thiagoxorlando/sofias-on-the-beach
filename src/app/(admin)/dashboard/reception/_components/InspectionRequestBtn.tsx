'use client'

import { useState, useTransition } from 'react'
import { requestRoomInspectionAction } from '../actions'

export function InspectionRequestBtn({
  reservationId,
  roomId,
  roomName,
  guestName,
}: {
  reservationId: string
  roomId: string
  roomName: string
  guestName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function handleClick() {
    setErr(null)
    startTransition(async () => {
      const res = await requestRoomInspectionAction(reservationId, roomId, roomName, guestName)
      if (res && 'error' in res) {
        setErr(res.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
        <CheckIcon />
        Inspeção solicitada
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2 py-1 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? 'Enviando…' : 'Solicitar inspeção'}
      </button>
      {err && <p className="text-[10px] text-red-600 leading-tight">{err}</p>}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
