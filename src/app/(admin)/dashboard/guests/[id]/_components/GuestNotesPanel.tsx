'use client'

import { useActionState } from 'react'
import { updateGuestNotesAction, type ActionState } from '../../actions'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-3 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 resize-none'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export function GuestNotesPanel({ guestId, notes }: { guestId: string; notes: string | null }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateGuestNotesAction, undefined)

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="guest_id" value={guestId} />
      <textarea
        name="notes"
        rows={5}
        defaultValue={notes ?? ''}
        placeholder="Anote preferências, restrições, observações sobre este hóspede…"
        className={TEXTAREA}
      />
      <p className="text-[11px] text-slate-400">Visível apenas para a equipe — nunca para o hóspede.</p>
      {state && 'error' in state && (
        <p className="text-[12px] font-medium text-red-600">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-[12px] font-medium text-emerald-600">Notas salvas.</p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? 'Salvando…' : 'Salvar notas'}
        </button>
      </div>
    </form>
  )
}
