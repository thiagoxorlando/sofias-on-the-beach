'use client'

import { useState, useTransition } from 'react'
import { updateHousekeepingStatusAction } from '../actions'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-3 py-2 ' +
  'text-[11px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_ACTIVE =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-3 py-2 ' +
  'text-[11px] font-semibold cursor-default'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[12px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 resize-none'

const BTN_NOTE =
  'inline-flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 px-3 py-2 ' +
  'text-[11px] font-semibold hover:border-slate-400 hover:text-slate-600 transition-colors'

const STATUS_BUTTONS: { status: string; label: string }[] = [
  { status: 'dirty',     label: 'Sujo' },
  { status: 'cleaning',  label: 'Em limpeza' },
  { status: 'clean',     label: 'Limpo' },
  { status: 'inspected', label: 'Inspecionado' },
  { status: 'ready',     label: 'Pronto' },
]

export function RoomActionBar({ roomId, currentStatus }: { roomId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
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
        setShowNote(false)
      }
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
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
        <button type="button" onClick={() => setShowNote((v) => !v)} className={BTN_NOTE}>
          {showNote ? 'Fechar nota' : '+ Nota'}
        </button>
      </div>

      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Nota sobre a limpeza (opcional)…"
          className={TEXTAREA}
        />
      )}

      {feedback && (
        <p className={`text-[12px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </p>
      )}
    </div>
  )
}
