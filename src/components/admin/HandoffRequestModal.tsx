'use client'

import { useEffect, useActionState } from 'react'
import { createHandoffRequestAction, type ActionState } from '@/app/(admin)/dashboard/handoff/actions'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 ' +
  'placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 ' +
  'focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-3 text-[13px] text-slate-800 ' +
  'placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 ' +
  'focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 resize-none'

const LABEL = 'block text-[11px] font-bold text-slate-500 uppercase tracking-[0.10em] mb-1.5'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-slate-50 transition-colors'

const DEPT_LABELS: Record<string, string> = {
  housekeeping: 'Governança',
  maintenance:  'Manutenção',
}

const PRIORITY_LABELS: Record<string, string> = {
  low:    'Baixa',
  normal: 'Normal',
  high:   'Alta',
  urgent: 'Urgente',
}

export function HandoffRequestModal({
  reservationId,
  roomId,
  roomName,
  onClose,
}: {
  reservationId?: string | null
  roomId?: string | null
  roomName?: string | null
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createHandoffRequestAction,
    undefined,
  )

  useEffect(() => {
    if (state && 'success' in state) {
      const t = setTimeout(onClose, 1200)
      return () => clearTimeout(t)
    }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-admin-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-800">Enviar solicitação</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        {state && 'success' in state ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-emerald-600">Solicitação enviada com sucesso.</p>
            <p className="text-[12px] text-slate-400 mt-1">Fechando…</p>
          </div>
        ) : (
          <form action={formAction} className="px-6 py-5 space-y-4">
            {reservationId && <input type="hidden" name="reservation_id" value={reservationId} />}
            {roomId        && <input type="hidden" name="room_id"        value={roomId} />}

            {roomName && (
              <p className="text-[12px] text-slate-500">
                Quarto: <span className="font-semibold text-slate-700">{roomName}</span>
              </p>
            )}

            <div>
              <label className={LABEL}>Departamento</label>
              <select name="target_department" required defaultValue="" className={INPUT}>
                <option value="" disabled>Selecione</option>
                {Object.entries(DEPT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>Título</label>
              <input
                name="title"
                required
                placeholder="Ex.: Toalhas extras, problema com o AC…"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>
                Descrição{' '}
                <span className="normal-case font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Detalhes adicionais sobre a solicitação…"
                className={TEXTAREA}
              />
            </div>

            <div>
              <label className={LABEL}>Prioridade</label>
              <select name="priority" defaultValue="normal" className={INPUT}>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {state && 'error' in state && (
              <p className="text-[12px] font-medium text-red-600">{state.error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancelar</button>
              <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
                {isPending ? 'Enviando…' : 'Enviar solicitação'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
