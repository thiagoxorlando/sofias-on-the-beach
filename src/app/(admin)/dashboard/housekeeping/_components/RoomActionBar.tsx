'use client'

import { useState, useTransition } from 'react'
import { updateHousekeepingStatusAction } from '../actions'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-ocean-200 text-ocean-700 px-3.5 py-2 ' +
  'text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-ocean-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_ACTIVE =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-3.5 py-2 ' +
  'text-[11px] font-bold uppercase tracking-[0.06em] cursor-default'

const TEXTAREA =
  'w-full border border-ocean-200 rounded-xl px-3.5 py-2.5 text-[12px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none'

const STATUS_BUTTONS: { status: string; label: string }[] = [
  { status: 'dirty',     label: 'Marcar sujo' },
  { status: 'cleaning',  label: 'Iniciar limpeza' },
  { status: 'clean',     label: 'Marcar limpo' },
  { status: 'inspected', label: 'Marcar inspecionado' },
  { status: 'ready',     label: 'Marcar pronto' },
]

export function RoomActionBar({ roomId, currentStatus }: { roomId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  function run(status: string, label: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateHousekeepingStatusAction(roomId, status, note.trim() || undefined)
      if (result && 'error' in result) {
        setFeedback({ kind: 'error', text: result.error })
      } else {
        setFeedback({ kind: 'success', text: `${label} — registrado.` })
        setNote('')
      }
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {STATUS_BUTTONS.map((btn) => {
          const isCurrent = btn.status === currentStatus
          return (
            <button
              key={btn.status}
              type="button"
              disabled={isPending || isCurrent}
              onClick={() => run(btn.status, btn.label)}
              className={isCurrent ? BTN_ACTIVE : BTN_SECONDARY}
            >
              {btn.label}
            </button>
          )
        })}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Nota opcional sobre a limpeza…"
        className={TEXTAREA}
      />

      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}
    </div>
  )
}
