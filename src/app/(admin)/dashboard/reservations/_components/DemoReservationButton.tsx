'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDemoReservationAction, deleteDemoReservationAction } from '../demo-actions'

export function DemoReservationButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createDemoReservationAction()
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/dashboard/reservations/${result.id}`)
      }
    })
  }

  function handleDelete() {
    if (!confirm('Excluir a reserva demo de maria.demo@exemplo.com? Esta ação não pode ser desfeita.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteDemoReservationAction()
      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
        <BeakerIcon />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
          Demo
        </span>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 px-4 py-2 text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {isPending ? <SpinnerIcon /> : <PlusIcon />}
        {isPending ? 'Aguarde…' : 'Criar reserva demo'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-4 py-2 text-[12px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <TrashIcon />
        Excluir demo
      </button>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          {error}
        </p>
      )}
    </div>
  )
}

function BeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-400" aria-hidden="true">
      <path d="M9 3h6M9 3v10l-5 7h14L14 13V3" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
