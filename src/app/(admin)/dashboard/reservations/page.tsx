import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReservationsFilters } from './_components/ReservationsFilters'
import { ReservationStatusBadge, PaymentStatusBadge } from './_components/badges'

export const metadata: Metadata = { title: "Reservas — Painel Sofia's" }

const PAGE_SIZE = 20

type GuestJoin = { full_name: string; email: string; phone: string | null }
type RoomJoin  = { name: string }
type PaymentJoin = { status: string; created_at: string }

type ReservationRow = {
  id: string
  token: string
  status: string
  check_in: string
  check_out: string
  adults: number
  children: number
  total_brl: number
  created_at: string
  guests: GuestJoin | GuestJoin[] | null
  rooms: RoomJoin | RoomJoin[] | null
  payments: PaymentJoin[] | null
}

type Row = {
  id: string
  token: string
  status: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  total: number
  createdAt: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  roomName: string
  paymentStatus: string | null
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function latestPaymentStatus(payments: PaymentJoin[] | null): string | null {
  if (!payments || payments.length === 0) return null
  const sorted = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (sorted.find((p) => p.status !== 'failed') ?? sorted[0]).status
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

type SP = Promise<{
  q?: string
  status?: string
  payment_status?: string
  from?: string
  to?: string
  page?: string
}>

export default async function ReservationsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q              = (sp.q ?? '').trim().toLowerCase()
  const statusFilter   = sp.status ?? ''
  const paymentFilter  = sp.payment_status ?? ''
  const fromFilter     = sp.from ?? ''
  const toFilter       = sp.to ?? ''
  const page           = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const db = createAdminClient()
  const { data } = await db
    .from('reservations')
    .select(`
      id, token, status, check_in, check_out, adults, children, total_brl, created_at,
      guests ( full_name, email, phone ),
      rooms ( name ),
      payments ( status, created_at )
    `)
    .order('created_at', { ascending: false })
    .returns<ReservationRow[]>()

  const all: Row[] = (data ?? []).map((r) => {
    const guest = one(r.guests)
    const room  = one(r.rooms)
    return {
      id:            r.id,
      token:         r.token,
      status:        r.status,
      checkIn:       r.check_in,
      checkOut:      r.check_out,
      adults:        r.adults,
      children:      r.children,
      total:         r.total_brl,
      createdAt:     r.created_at,
      guestName:     guest?.full_name ?? '—',
      guestEmail:    guest?.email ?? '—',
      guestPhone:    guest?.phone ?? null,
      roomName:      room?.name ?? '—',
      paymentStatus: latestPaymentStatus(r.payments),
    }
  })

  const filtered = all.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false

    if (paymentFilter === 'none' && row.paymentStatus !== null) return false
    if (paymentFilter && paymentFilter !== 'none' && row.paymentStatus !== paymentFilter) return false

    if (fromFilter && row.checkIn < fromFilter) return false
    if (toFilter && row.checkIn > toFilter) return false

    if (q) {
      const haystack = `${row.guestName} ${row.guestEmail} ${row.token}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (q)             params.set('q', sp.q ?? '')
    if (statusFilter)  params.set('status', statusFilter)
    if (paymentFilter) params.set('payment_status', paymentFilter)
    if (fromFilter)    params.set('from', fromFilter)
    if (toFilter)      params.set('to', toFilter)
    if (p > 1)         params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/dashboard/reservations?${qs}` : '/dashboard/reservations'
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-bold text-ocean-900">Reservas</h1>
        <p className="text-[14px] text-ocean-500 mt-1">
          {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== all.length ? ` de ${all.length} no total` : ''}
        </p>
      </div>

      <ReservationsFilters />

      {pageRows.length === 0 ? (
        <div className="bg-white rounded-[18px] border border-ocean-100 py-14 text-center text-[13px] text-ocean-400">
          Nenhuma reserva encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="bg-white rounded-[18px] border border-ocean-100 overflow-hidden">
          <div className="divide-y divide-ocean-50">
            {pageRows.map((row) => (
              <div key={row.id} className="px-4 sm:px-5 py-4 hover:bg-ocean-50/30 transition-colors">

                {/* Row 1 — guest */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-ocean-900 text-[14px]">{row.guestName}</span>
                  <span className="text-[12px] text-ocean-400">{row.guestEmail}</span>
                  {row.guestPhone && <span className="text-[12px] text-ocean-400">{row.guestPhone}</span>}
                  <span className="sm:ml-auto font-mono text-[11px] text-ocean-500">{row.token}</span>
                  <span className="text-[11px] text-ocean-400">· criada em {formatDateTime(row.createdAt)}</span>
                </div>

                {/* Row 2 — booking */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3 pt-3 border-t border-ocean-50">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Quarto</p>
                    <p className="text-[13px] font-medium text-ocean-900 truncate">{row.roomName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Check-in / Check-out</p>
                    <p className="text-[13px] font-medium text-ocean-700 whitespace-nowrap">
                      {formatDate(row.checkIn)} <span className="text-ocean-300">→</span> {formatDate(row.checkOut)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Hóspedes</p>
                    <p className="text-[13px] font-medium text-ocean-700">
                      {row.adults}{row.children > 0 ? ` + ${row.children}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Total</p>
                    <p className="text-[13px] font-bold text-ocean-900 whitespace-nowrap">{formatBRL(row.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReservationStatusBadge status={row.status} />
                    <PaymentStatusBadge status={row.paymentStatus} />
                  </div>
                  <Link
                    href={`/dashboard/reservations/${row.id}`}
                    className="sm:ml-auto text-ocean-600 hover:text-ocean-900 text-[12px] font-semibold transition-colors whitespace-nowrap"
                  >
                    Ver detalhes →
                  </Link>
                </div>

              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-ocean-100 bg-ocean-50/30">
              <p className="text-[12px] text-ocean-500">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <PageLink href={pageHref(safePage - 1)} disabled={safePage <= 1}>← Anterior</PageLink>
                <PageLink href={pageHref(safePage + 1)} disabled={safePage >= totalPages}>Próxima →</PageLink>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="text-[12px] font-semibold text-ocean-300 px-3 py-1.5 cursor-not-allowed">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className="text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
      {children}
    </Link>
  )
}
