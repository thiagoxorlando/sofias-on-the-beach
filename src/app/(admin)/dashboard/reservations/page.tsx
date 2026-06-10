import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { ReservationsFilters } from './_components/ReservationsFilters'
import { ReservationsBulkActions } from './_components/ReservationsBulkActions'
import { DemoReservationButton } from './_components/DemoReservationButton'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminEmptyState,
} from '@/components/admin/AdminUI'

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
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
  const admin = await requireModule('reservations')

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

  const today = todayISO()
  const summary = {
    total:        all.length,
    awaitingPay:  all.filter((r) => r.status === 'pending_payment').length,
    confirmed:    all.filter((r) => r.status === 'confirmed').length,
    checkInToday:  all.filter((r) => r.checkIn === today && (r.status === 'confirmed' || r.status === 'pending_payment')).length,
    checkOutToday: all.filter((r) => r.checkOut === today && (r.status === 'checked_in' || r.status === 'confirmed')).length,
  }

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
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl space-y-6">

      <AdminPageHeader
        eyebrow="Operação"
        title="Reservas"
        subtitle={`${filtered.length} reserva${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}${filtered.length !== all.length ? ` de ${all.length} no total` : ''}.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <AdminStatCard label="Total de reservas" value={summary.total} tone="navy"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#061A2A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>}
        />
        <AdminStatCard label="Aguardando pagamento" value={summary.awaitingPay} tone="warning"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>}
        />
        <AdminStatCard label="Confirmadas" value={summary.confirmed} tone="success"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <AdminStatCard label="Check-in hoje" value={summary.checkInToday} tone="info"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1={15} y1={12} x2={3} y2={12} /></svg>}
        />
        <AdminStatCard label="Check-out hoje" value={summary.checkOutToday} tone="info"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1={21} y1={12} x2={9} y2={12} /></svg>}
        />
      </div>

      {(admin.role === 'admin' || admin.role === 'super_admin') && (
        <DemoReservationButton />
      )}

      <ReservationsFilters />

      {pageRows.length === 0 ? (
        <AdminEmptyState>Nenhuma reserva encontrada com os filtros atuais.</AdminEmptyState>
      ) : (
        <>
          <ReservationsBulkActions rows={pageRows} adminRole={admin.role} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 rounded-[18px] border border-admin-border bg-white">
              <p className="text-[12px] text-slate-500">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <PageLink href={pageHref(safePage - 1)} disabled={safePage <= 1}>← Anterior</PageLink>
                <PageLink href={pageHref(safePage + 1)} disabled={safePage >= totalPages}>Próxima →</PageLink>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="text-[12px] font-semibold text-slate-300 px-3 py-1.5 cursor-not-allowed">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
      {children}
    </Link>
  )
}
