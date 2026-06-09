'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

type Item = { id: string; label: string }

type Props = {
  title: string
  items: Item[]
  onConfirm: (ids: string[]) => Promise<{ error: string } | { success: true; count: number } | undefined>
  onClose: () => void
}

export function ForceDeleteModal({ title, items, onConfirm, onClose }: Props) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const confirmed = typed.trim() === 'DELETE'
  const ids = items.map((i) => i.id)

  function handleConfirm() {
    if (!confirmed || isPending) return
    setError(null)
    startTransition(async () => {
      const res = await onConfirm(ids)
      if (!res || 'error' in res) {
        setError(res && 'error' in res ? res.error : 'Erro desconhecido. Tente novamente.')
        return
      }
      setDone(true)
      setTimeout(() => onClose(), 1200)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[22px] shadow-[0_24px_64px_rgba(0,18,50,0.22)] w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-7">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <DangerIcon />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800">{title}</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''} selecionado{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-[12px] text-red-800 leading-relaxed">
          <p className="font-semibold mb-1">Esta ação é permanente e irreversível.</p>
          <p>Isto apagará registros relacionados e não poderá ser desfeito. Use apenas para limpar dados de teste.</p>
        </div>

        {/* Item list */}
        <div className="mb-4 space-y-1 max-h-[160px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5 font-mono truncate">
              {item.label}
            </div>
          ))}
        </div>

        {done ? (
          <p className="text-[13px] font-semibold text-emerald-600 py-2">
            Itens excluídos com sucesso.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-slate-700 mb-2">
                Para confirmar, digite{' '}
                <span className="font-mono font-bold text-red-700">DELETE</span>:
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Digite DELETE"
                autoFocus
                disabled={isPending}
                autoComplete="off"
                spellCheck={false}
                className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-[12px] font-medium text-red-600">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-2.5 px-4 rounded-xl border border-admin-border text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!confirmed || isPending}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors',
                  confirmed && !isPending
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                {isPending ? 'Excluindo…' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DangerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  )
}
