'use client'

import { useState, useTransition } from 'react'
import { deleteRoomAction } from '../actions'
import { ModalOverlay, BTN_SECONDARY, ErrorMessage } from './form-helpers'
import type { RoomRow } from './types'
import { cn } from '@/lib/utils'

type Props = {
  room: RoomRow
  onClose: () => void
}

export function DeleteRoomModal({ room, onClose }: Props) {
  const [confirm, setConfirm] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const label = room.room_number ?? room.name
  const isMatch = confirm.trim() === label

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isMatch) return
    startTransition(async () => {
      const res = await deleteRoomAction(room.id)
      if (!res) return
      if ('error' in res) {
        setResult(res.error)
        return
      }
      // Success — close after a brief message
      onClose()
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <TrashIcon />
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-slate-800">Excluir quarto</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {room.room_number ? `#${room.room_number} · ` : ''}{room.name}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-amber-800 leading-relaxed">
        Esta ação só é permitida para quartos sem histórico importante. Quartos com reservas ou movimentações serão <strong>arquivados/desativados</strong> em vez de excluídos.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-[13px] text-slate-700 mb-2">
            Para confirmar, digite{' '}
            <span className="font-bold text-slate-900">{label}</span>:
          </p>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={label}
            autoFocus
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-xl border border-admin-border bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400/60 disabled:opacity-50"
          />
        </div>

        {result && <ErrorMessage message={result} />}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={BTN_SECONDARY} disabled={isPending}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isMatch || isPending}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors',
              isMatch && !isPending
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            {isPending ? 'Processando…' : 'Excluir / Arquivar quarto'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
