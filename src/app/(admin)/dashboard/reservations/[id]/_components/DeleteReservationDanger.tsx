'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteReservationAction, type ActionState } from '../../actions'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 ' +
  'placeholder:text-slate-400 bg-white font-mono focus:outline-none ' +
  'focus:ring-2 focus:ring-red-300 focus:border-red-300'

export function DeleteReservationDanger({
  reservationId,
  token,
}: {
  reservationId: string
  token: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    deleteReservationAction,
    undefined,
  )

  const confirmed = typed.trim().toUpperCase() === token.trim().toUpperCase()

  useEffect(() => {
    if (state && 'success' in state) {
      const t = setTimeout(() => router.replace('/dashboard/reservations'), 1400)
      return () => clearTimeout(t)
    }
  }, [state, router])

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-[13px] font-semibold text-red-700">Zona de risco</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[12px] font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            Excluir reserva →
          </button>
        )}
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-red-100">
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-[12px] font-semibold text-red-700">
              Atenção: esta ação é irreversível.
            </p>
            <p className="text-[12px] text-red-600 leading-relaxed">
              Excluir remove permanentemente o registro do painel. Use apenas para reservas de
              teste, duplicatas ou erros de cadastro. Para reservas reais, use{' '}
              <span className="font-semibold">Cancelar reserva</span> — que preserva o histórico
              financeiro e operacional.
            </p>
          </div>

          {state && 'success' in state ? (
            <p className="mt-4 text-[13px] font-semibold text-emerald-600">
              Reserva excluída com sucesso. Redirecionando…
            </p>
          ) : (
            <form action={formAction} className="mt-4 space-y-3.5">
              <input type="hidden" name="reservation_id" value={reservationId} />

              <div>
                <p className="text-[12px] text-slate-600 mb-2">
                  Para confirmar, digite o código da reserva:
                  <span className="font-mono font-bold text-slate-800 ml-1.5 select-all">
                    {token}
                  </span>
                </p>
                <input
                  type="text"
                  name="confirm_token"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={`Digite ${token}`}
                  autoComplete="off"
                  spellCheck={false}
                  className={INPUT}
                />
              </div>

              {state && 'error' in state && (
                <p className="text-[12px] font-medium text-red-600">{state.error}</p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={!confirmed || isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-5 py-2.5 text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Excluindo…' : 'Excluir permanentemente'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setTyped('') }}
                  className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
