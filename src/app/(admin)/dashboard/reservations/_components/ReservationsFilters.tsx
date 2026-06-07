'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { STATUS_LABELS, PAYMENT_LABELS } from './badges'

const SELECT =
  'border border-ocean-200 rounded-xl px-3 py-2.5 text-[13px] text-ocean-900 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent'

const INPUT =
  'border border-ocean-200 rounded-xl px-3 py-2.5 text-[13px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent'

export function ReservationsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ]               = useState(searchParams.get('q') ?? '')
  const [status, setStatus]     = useState(searchParams.get('status') ?? '')
  const [payment, setPayment]   = useState(searchParams.get('payment_status') ?? '')
  const [from, setFrom]         = useState(searchParams.get('from') ?? '')
  const [to, setTo]             = useState(searchParams.get('to') ?? '')

  const hasFilters = !!(q || status || payment || from || to)

  function apply(overrides: Record<string, string> = {}) {
    const next = {
      q, status, payment_status: payment, from, to,
      ...overrides,
    }
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
      className="bg-white rounded-[18px] border border-ocean-100 p-4 md:p-5 mb-6 space-y-3.5"
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
          className="bg-ocean-900 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors shrink-0"
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
            className="text-[12px] font-semibold text-ocean-500 hover:text-ocean-800 transition-colors px-1 py-2.5"
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
      <label className="block text-[10px] font-bold text-ocean-500 uppercase tracking-[0.10em] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
