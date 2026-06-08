'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { STATUS_LABELS, PAYMENT_LABELS } from './badges'

const SELECT =
  'border border-admin-border rounded-xl px-3 py-2.5 text-[13px] text-slate-700 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40'

const INPUT =
  'border border-admin-border rounded-xl px-3 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40'

export function ReservationsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ]             = useState(searchParams.get('q') ?? '')
  const [status, setStatus]   = useState(searchParams.get('status') ?? '')
  const [payment, setPayment] = useState(searchParams.get('payment_status') ?? '')
  const [from, setFrom]       = useState(searchParams.get('from') ?? '')
  const [to, setTo]           = useState(searchParams.get('to') ?? '')

  const hasFilters = !!(q || status || payment || from || to)

  function apply(overrides: Record<string, string> = {}) {
    const next = { q, status, payment_status: payment, from, to, ...overrides }
    const params = new URLSearchParams()
    if (next.q)              params.set('q', next.q)
    if (next.status)         params.set('status', next.status)
    if (next.payment_status) params.set('payment_status', next.payment_status)
    if (next.from)           params.set('from', next.from)
    if (next.to)             params.set('to', next.to)
    const qs = params.toString()
    router.push(qs ? `/dashboard/reservations?${qs}` : '/dashboard/reservations')
  }

  function clearAll() {
    setQ(''); setStatus(''); setPayment(''); setFrom(''); setTo('')
    router.push('/dashboard/reservations')
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply() }}
      className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 md:p-5 space-y-3.5"
    >
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, e-mail ou código da reserva…"
          className={`${INPUT} flex-1`}
        />
        <button
          type="submit"
          className="bg-admin-sidebar text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-admin-sidebar-act transition-colors shrink-0"
        >
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Status da reserva">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); apply({ status: e.target.value }) }}
            className={SELECT}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Status do pagamento">
          <select
            value={payment}
            onChange={(e) => { setPayment(e.target.value); apply({ payment_status: e.target.value }) }}
            className={SELECT}
          >
            <option value="">Todos</option>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
            <option value="none">Sem pagamento registrado</option>
          </select>
        </Field>

        <Field label="Check-in de">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); apply({ from: e.target.value }) }}
            className={SELECT}
          />
        </Field>

        <Field label="até">
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); apply({ to: e.target.value }) }}
            className={SELECT}
          />
        </Field>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 transition-colors px-1 py-2.5"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
