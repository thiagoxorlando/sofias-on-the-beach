'use client'

import { useTransition, useState } from 'react'
import { markCheckedInAction, markCheckedOutAction } from '@/app/(admin)/dashboard/reservations/actions'

export function QuickCheckBtn({
  reservationId,
  type,
}: {
  reservationId: string
  type: 'in' | 'out'
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleClick() {
    startTransition(async () => {
      const res = type === 'in'
        ? await markCheckedInAction(reservationId)
        : await markCheckedOutAction(reservationId)

      if (res && 'error' in res) {
        setResult({ ok: false, msg: res.error })
      } else {
        setResult({ ok: true, msg: type === 'in' ? 'Check-in feito!' : 'Check-out feito!' })
      }
    })
  }

  if (result) {
    return (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
          result.ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        {result.msg}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${
        type === 'in'
          ? 'bg-sky-600 hover:bg-sky-700 text-white'
          : 'bg-amber-500 hover:bg-amber-600 text-white'
      }`}
    >
      {isPending ? (
        <SpinnerIcon />
      ) : (
        type === 'in' ? 'Check-in' : 'Check-out'
      )}
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
