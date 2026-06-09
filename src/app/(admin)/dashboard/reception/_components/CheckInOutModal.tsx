'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type QueueItem = {
  id: string
  type: 'checkin' | 'checkout'
  token: string
  status: string
  guestName: string
  guestPhone: string | null
  roomId: string | null
  roomName: string
  roomNumber: string | null
  roomHkStatus: string | null
  payStatus: string | null
  time: string
}

type QueueData = {
  date: string
  checkIns: QueueItem[]
  checkOuts: QueueItem[]
}

const PAY_LABEL: Record<string, string> = {
  paid:      'Pago',
  pending:   'Pendente',
  overdue:   'Vencido',
  failed:    'Falhou',
  cancelled: 'Cancelado',
}

const HK_LABEL: Record<string, string> = {
  ready:     'Pronto',
  inspected: 'Inspecionado',
  clean:     'Limpo',
  cleaning:  'Em limpeza',
  dirty:     'Sujo',
}

const HK_TONE: Record<string, string> = {
  ready:     'bg-emerald-50 text-emerald-700',
  inspected: 'bg-blue-50    text-blue-700',
  clean:     'bg-teal-50    text-teal-700',
  cleaning:  'bg-amber-50   text-amber-700',
  dirty:     'bg-red-50     text-red-600',
}

export function CheckInOutModal({ onClose }: { onClose: () => void }) {
  const todayISO = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const [date, setDate] = useState(todayISO)
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // All setState calls live inside the timer — never synchronously in the effect body
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/dashboard/reception/queue?date=${date}`)
        if (r.ok) {
          const json = (await r.json()) as QueueData
          setData(json)
        }
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [date])

  // Check-outs first (morning), then check-ins (afternoon)
  const rows: (QueueItem & { _kind: 'checkin' | 'checkout' })[] = [
    ...(data?.checkOuts ?? []).map((r) => ({ ...r, _kind: 'checkout' as const })),
    ...(data?.checkIns  ?? []).map((r) => ({ ...r, _kind: 'checkin'  as const })),
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800">Check-ins e check-outs</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 shrink-0">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-[13px] border border-admin-border rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40 bg-admin-page"
          />
          <span className="text-[12px] text-slate-400">
            {loading
              ? 'Carregando…'
              : rows.length === 0
                ? 'Nenhuma operação'
                : `${rows.length} operação${rows.length !== 1 ? 'ões' : ''}`}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-12 text-center text-[13px] text-slate-400">Carregando…</div>
          )}

          {!loading && rows.length === 0 && (
            <div className="py-12 text-center text-[13px] text-slate-400">
              Nenhum check-in ou check-out nesta data.
            </div>
          )}

          {!loading && rows.map((row) => (
            <div
              key={`${row.id}-${row._kind}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors"
            >
              {/* Type + time */}
              <div className="flex items-center gap-2 shrink-0 w-[108px]">
                <span className="text-[12px] font-semibold text-slate-400 tabular-nums w-10 shrink-0">{row.time}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  row._kind === 'checkin' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {row._kind === 'checkin' ? 'Entrada' : 'Saída'}
                </span>
              </div>

              {/* Guest + room */}
              <div className="flex-1 min-w-[120px]">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{row.guestName}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {row.roomNumber ? `#${row.roomNumber} · ` : ''}{row.roomName}
                </p>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {row.payStatus && (
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    row.payStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {PAY_LABEL[row.payStatus] ?? row.payStatus}
                  </span>
                )}
                {row.roomHkStatus && (
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${HK_TONE[row.roomHkStatus] ?? 'bg-slate-100 text-slate-500'}`}>
                    {HK_LABEL[row.roomHkStatus] ?? row.roomHkStatus}
                  </span>
                )}
              </div>

              {/* Open reservation */}
              <Link
                href={`/dashboard/reservations/${row.id}`}
                className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors shrink-0 whitespace-nowrap"
              >
                Abrir reserva →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  )
}
