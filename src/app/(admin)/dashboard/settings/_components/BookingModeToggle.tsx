'use client'

import { useTransition, useState } from 'react'
import { setOnlineBookingAction } from '../actions'

export function BookingModeToggle({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [localEnabled, setLocalEnabled] = useState(enabled)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  function toggle() {
    const next = !localEnabled
    setFeedback(null)
    startTransition(async () => {
      const res = await setOnlineBookingAction(next)
      if (res && 'error' in res) {
        setFeedback({ kind: 'error', text: res.error })
      } else {
        setLocalEnabled(next)
        setFeedback({
          kind: 'success',
          text: next
            ? 'Reservas online ativadas. Hóspedes já podem reservar pelo site.'
            : 'Site em modo landing page. Reservas online estão bloqueadas.',
        })
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-5 rounded-full relative transition-colors ${localEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className={`text-[14px] font-semibold ${localEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
            {localEnabled ? 'Reservas online ativas' : 'Site em modo landing page'}
          </span>
        </div>
        <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
          {localEnabled
            ? 'Hóspedes podem pesquisar quartos e fazer pré-reservas pelo site.'
            : 'O site está ativo, mas hóspedes são direcionados ao WhatsApp. Recepção e reservas internas continuam funcionando normalmente.'}
        </p>
        {feedback && (
          <p className={`text-[12px] font-medium mt-2 ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
            {feedback.text}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        className={`shrink-0 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          localEnabled
            ? 'border border-red-200 text-red-600 bg-white hover:bg-red-50'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isPending ? 'Salvando…' : localEnabled ? 'Desativar reservas online' : 'Ativar reservas online'}
      </button>
    </div>
  )
}
