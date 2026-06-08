'use client'

import { useEffect, useState, useTransition, useActionState } from 'react'
import {
  addReservationChargeAction,
  markChargePaidAction,
  waiveChargeAction,
  type ActionState,
} from '../charges-actions'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_TINY =
  'inline-flex items-center justify-center rounded-lg border border-admin-border text-slate-600 px-2.5 py-1.5 ' +
  'text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const CATEGORY_LABELS: Record<string, string> = {
  beach_towel:    'Toalha de praia',
  lost_key:       'Chave perdida',
  damage:         'Dano / avaria',
  late_checkout:  'Late checkout',
  extra_cleaning: 'Limpeza extra',
  minibar:        'Frigobar',
  laundry:        'Lavanderia',
  transfer:       'Transfer',
  other:          'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid:    'Paga',
  waived:  'Dispensada',
}

const STATUS_TONES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid:    'bg-emerald-50 text-emerald-700',
  waived:  'bg-slate-100 text-slate-500',
}

export type ChargeRow = {
  id: string
  category: string
  description: string
  quantity: number
  unitAmount: number
  totalAmount: number
  status: string
  createdAtLabel: string
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function ChargesPanel({
  reservationId,
  originalTotal,
  charges,
  canAdd,
  canMarkPaid,
  canWaive,
}: {
  reservationId: string
  originalTotal: number
  charges: ChargeRow[]
  canAdd: boolean
  canMarkPaid: boolean
  canWaive: boolean
}) {
  const [showForm, setShowForm] = useState(false)

  const pending = charges.filter((c) => c.status === 'pending')
  const paid = charges.filter((c) => c.status === 'paid')
  const pendingTotal = pending.reduce((sum, c) => sum + c.totalAmount, 0)
  const paidTotal = paid.reduce((sum, c) => sum + c.totalAmount, 0)
  const totalToCharge = originalTotal + pendingTotal

  return (
    <div className="space-y-4">

      <div className="rounded-xl bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-600">Reserva original</span>
        <span className="text-[15px] font-bold text-slate-800">{formatBRL(originalTotal)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TotalCard label="Extras pendentes" value={formatBRL(pendingTotal)} tone="amber" />
        <TotalCard label="Extras pagos" value={formatBRL(paidTotal)} tone="emerald" />
      </div>
      <div className="rounded-xl bg-admin-sidebar px-4 py-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white/80">Total a cobrar (reserva + extras pendentes)</span>
        <span className="text-[16px] font-bold text-white">{formatBRL(totalToCharge)}</span>
      </div>

      {/* List */}
      {charges.length === 0 ? (
        <p className="text-[13px] text-slate-400">Nenhuma cobrança extra registrada.</p>
      ) : (
        <ul className="space-y-2.5">
          {charges.map((charge) => (
            <li key={charge.id} className="rounded-xl border border-admin-border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">
                    {CATEGORY_LABELS[charge.category] ?? charge.category}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{charge.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {charge.quantity}× {formatBRL(charge.unitAmount)} · {charge.createdAtLabel}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-bold text-slate-800">{formatBRL(charge.totalAmount)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold mt-1 ${STATUS_TONES[charge.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {STATUS_LABELS[charge.status] ?? charge.status}
                  </span>
                </div>
              </div>
              {charge.status === 'pending' && (canMarkPaid || canWaive) && (
                <ChargeActions chargeId={charge.id} canMarkPaid={canMarkPaid} canWaive={canWaive} />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add */}
      {canAdd && (
        <div>
          {showForm ? (
            <AddChargeForm reservationId={reservationId} onDone={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          ) : (
            <button type="button" onClick={() => setShowForm(true)} className={BTN_SECONDARY}>
              + Adicionar cobrança
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TotalCard({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'emerald' }) {
  const toneCls = tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
  return (
    <div className={`rounded-xl px-4 py-3 ${toneCls}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.10em] opacity-80">{label}</p>
      <p className="text-[17px] font-bold mt-0.5">{value}</p>
    </div>
  )
}

function ChargeActions({ chargeId, canMarkPaid, canWaive }: { chargeId: string; canMarkPaid: boolean; canWaive: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  function run(fn: (id: string) => Promise<ActionState>, successText: string) {
    setFeedback(null)
    startTransition(async () => {
      const result = await fn(chargeId)
      if (result && 'error' in result) setFeedback({ kind: 'error', text: result.error })
      else setFeedback({ kind: 'success', text: successText })
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
      {canMarkPaid && (
        <button type="button" disabled={isPending} onClick={() => run(markChargePaidAction, 'Cobrança marcada como paga.')} className={BTN_TINY}>
          Marcar como paga
        </button>
      )}
      {canWaive && (
        <button type="button" disabled={isPending} onClick={() => run(waiveChargeAction, 'Cobrança dispensada.')} className={BTN_TINY}>
          Dispensar
        </button>
      )}
      {feedback && (
        <span className={`text-[11px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {feedback.text}
        </span>
      )}
    </div>
  )
}

function AddChargeForm({ reservationId, onDone, onCancel }: { reservationId: string; onDone: () => void; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(addReservationChargeAction, undefined)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={formAction} className="space-y-2.5 bg-slate-50/60 border border-admin-border rounded-2xl p-4">
      <input type="hidden" name="reservation_id" value={reservationId} />
      <div className="grid grid-cols-2 gap-2.5">
        <select name="category" required defaultValue="" className={INPUT}>
          <option value="" disabled>Categoria</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input name="description" required placeholder="Descrição" className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <input name="quantity" type="number" min={1} step={1} defaultValue={1} required placeholder="Quantidade" className={INPUT} />
        <input name="unit_amount_brl" type="number" min={0} step={1} required placeholder="Valor unitário (R$)" className={INPUT} />
      </div>
      {state && 'error' in state && (
        <p className="text-[12px] font-medium text-red-600">{state.error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancelar</button>
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? 'Salvando…' : 'Adicionar cobrança'}
        </button>
      </div>
    </form>
  )
}
