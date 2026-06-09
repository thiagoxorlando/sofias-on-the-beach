'use client'

import { useState, useTransition } from 'react'
import { forceDeleteGuestsAction } from '../actions'

export type DeleteGuestInfo = {
  id: string
  name: string
  email: string
  phone: string | null
}

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 ' +
  'placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 ' +
  'focus:ring-red-300 focus:border-red-400 font-mono tracking-widest'

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-700 transition-colors ' +
  'disabled:opacity-40 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-slate-50 transition-colors'

export function DeleteGuestsModal({
  guests,
  onClose,
  onSuccess,
}: {
  guests: DeleteGuestInfo[]
  onClose: () => void
  onSuccess?: () => void
}) {
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const ready = confirm.trim() === 'DELETE'
  const isBatch = guests.length > 1

  function handleDelete() {
    if (!ready) return
    setError(null)
    startTransition(async () => {
      const result = await forceDeleteGuestsAction(guests.map((g) => g.id))
      if (!result) {
        setError('Erro desconhecido. Tente novamente.')
        return
      }
      if ('error' in result) {
        setError(result.error)
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/60 rounded-t-2xl">
          <h2 className="text-[16px] font-bold text-red-800">Excluir hóspede permanentemente</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Guest(s) summary */}
          {isBatch ? (
            <div className="rounded-xl border border-red-100 bg-red-50/40 px-4 py-3">
              <p className="text-[13px] font-semibold text-red-800 mb-2">
                {guests.length} hóspedes selecionados:
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {guests.map((g) => (
                  <li key={g.id} className="text-[12px] text-red-700">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-red-500 ml-1">· {g.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 space-y-1">
              <p className="text-[13px] font-semibold text-red-800">{guests[0].name}</p>
              <p className="text-[12px] text-red-600">{guests[0].email}</p>
              {guests[0].phone && (
                <p className="text-[12px] text-red-500">{guests[0].phone}</p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="text-[12px] text-amber-800 leading-relaxed">
              <span className="font-bold">Atenção:</span>{' '}
              Isso apagará {isBatch ? `os ${guests.length} hóspedes` : 'o hóspede'} e todos os registros relacionados
              — reservas, pagamentos e histórico.{' '}
              <span className="font-bold">Esta ação não pode ser desfeita.</span>
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <p className="text-[12px] text-slate-500 mb-2">
              Digite <span className="font-bold text-slate-700 font-mono">DELETE</span> para confirmar:
            </p>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              className={INPUT}
            />
          </div>

          {error && (
            <p className="text-[12px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending} className={BTN_SECONDARY}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!ready || isPending}
              className={BTN_DANGER}
            >
              {isPending
                ? 'Excluindo…'
                : isBatch
                  ? `Excluir ${guests.length} hóspedes`
                  : 'Excluir permanentemente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
