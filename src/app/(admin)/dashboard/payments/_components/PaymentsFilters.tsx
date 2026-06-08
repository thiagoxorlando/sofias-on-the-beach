'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PAYMENT_LABELS } from '../../reservations/_components/badges'

const SELECT =
  'border border-admin-border rounded-xl px-3 py-2.5 text-[13px] text-slate-800 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const INPUT =
  'border border-admin-border rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const METHOD_LABELS: Record<string, string> = {
  pix:         'PIX',
  credit_card: 'Cartão de crédito',
  boleto:      'Boleto',
  manual:      'Manual',
}

export function PaymentsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ]           = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [method, setMethod] = useState(searchParams.get('method') ?? '')
  const [from, setFrom]     = useState(searchParams.get('from') ?? '')
  const [to, setTo]         = useState(searchParams.get('to') ?? '')

  const hasFilters = !!(q || status || method || from || to)

  function apply(overrides: Record<string, string> = {}) {
    const next = { q, status, method, from, to, ...overrides }
    const params = new URLSearchParams()
    if (next.q)      params.set('q', next.q)
    if (next.status) params.set('status', next.status)
    if (next.method) params.set('method', next.method)
    if (next.from)   params.set('from', next.from)
    if (next.to)     params.set('to', next.to)
    const qs = params.toString()
    router.push(qs ? `/dashboard/payments?${qs}` : '/dashboard/payments')
  }

  function clearAll() {
    setQ(''); setStatus(''); setMethod(''); setFrom(''); setTo('')
    router.push('/dashboard/payments')
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
          placeholder="Buscar por hóspede, e-mail, código da reserva ou ID Asaas…"
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
        <Field label="Status do pagamento">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); apply({ status: e.target.value }) }}
            className={SELECT}
          >
            <option value="">Todos</option>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Método">
          <select
            value={method}
            onChange={(e) => { setMethod(e.target.value); apply({ method: e.target.value }) }}
            className={SELECT}
          >
            <option value="">Todos</option>
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Criado de">
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
            className="text-[12px] font-semibold text-slate-500 hover:text-slate-800 transition-colors px-1 py-2.5"
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
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.10em] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
