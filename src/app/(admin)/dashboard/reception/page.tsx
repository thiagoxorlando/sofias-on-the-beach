import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { ReservationStatusBadge, PaymentStatusBadge } from '../reservations/_components/badges'
import { ReceptionActionBar } from './_components/ReceptionActionBar'

export const metadata: Metadata = { title: "Recepção — Painel Sofia's" }

const CARD = 'bg-white rounded-[18px] border border-ocean-100 p-5'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

type GuestJoin = { full_name: string; email: string; phone: string | null }
type RoomJoin = { name: string }
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
  special_requests: string | null
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
  specialRequests: string | null
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

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

const SELECT = `
  id, token, status, check_in, check_out, adults, children, total_brl, special_requests,
  guests ( full_name, email, phone ),
  rooms ( name ),
  payments ( status, created_at )
`

function toRow(r: ReservationRow): Row {
  const guest = one(r.guests)
  const room = one(r.rooms)
  return {
    id: r.id,
    token: r.token,
    status: r.status,
    checkIn: r.check_in,
    checkOut: r.check_out,
    adults: r.adults,
    children: r.children,
    total: r.total_brl,
    specialRequests: r.special_requests,
    guestName: guest?.full_name ?? '—',
    guestEmail: guest?.email ?? '—',
    guestPhone: guest?.phone ?? null,
    roomName: room?.name ?? '—',
    paymentStatus: latestPaymentStatus(r.payments),
  }
}

function waHrefFor(row: Row): string | null {
  if (!row.guestPhone) return null
  const msg = encodeURIComponent(`Olá ${row.guestName}! Aqui é da Sofia's on the Beach, sobre a sua reserva ${row.token}.`)
  return `https://wa.me/${row.guestPhone.replace(/\D/g, '')}?text=${msg}`
}

export default async function ReceptionPage() {
  await requireModule('reception')

  const db = createAdminClient()
  const today = todayISO()
  const weekAhead = addDaysISO(today, 7)

  const [{ data: checkInsData }, { data: checkOutsData }, { data: stayingData }, { data: upcomingData }] = await Promise.all([
    db.from('reservations').select(SELECT)
      .eq('check_in', today).in('status', ['confirmed', 'pending_payment'])
      .order('created_at', { ascending: true })
      .returns<ReservationRow[]>(),
    db.from('reservations').select(SELECT)
      .eq('check_out', today).in('status', ['checked_in', 'confirmed'])
      .order('created_at', { ascending: true })
      .returns<ReservationRow[]>(),
    db.from('reservations').select(SELECT)
      .eq('status', 'checked_in')
      .order('check_out', { ascending: true })
      .returns<ReservationRow[]>(),
    db.from('reservations').select(SELECT)
      .gt('check_in', today).lte('check_in', weekAhead)
      .in('status', ['confirmed', 'pending_payment'])
      .order('check_in', { ascending: true })
      .returns<ReservationRow[]>(),
  ])

  const checkIns = (checkInsData ?? []).map(toRow)
  const checkOuts = (checkOutsData ?? []).map(toRow)
  const staying = (stayingData ?? []).map(toRow)
  const upcoming = (upcomingData ?? []).map(toRow)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">Operação diária</p>
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">Recepção</h1>
        <p className="text-[13px] text-ocean-500 mt-1.5">
          Chegadas, saídas e hóspedes na pousada — hoje, {formatDate(today)}.
        </p>
      </div>

      <ReceptionSection
        title="Check-ins de hoje"
        emptyText="Nenhuma chegada prevista para hoje."
        rows={checkIns}
        renderAction={(row) => (
          <ReceptionActionBar
            reservationId={row.id}
            action={row.status === 'confirmed' ? 'check_in' : null}
            waHref={waHrefFor(row)}
            note={row.status !== 'confirmed' ? 'Aguardando confirmação de pagamento para liberar o check-in.' : null}
          />
        )}
      />

      <ReceptionSection
        title="Check-outs de hoje"
        emptyText="Nenhuma saída prevista para hoje."
        rows={checkOuts}
        renderAction={(row) => (
          <ReceptionActionBar
            reservationId={row.id}
            action={row.status === 'checked_in' ? 'check_out' : null}
            waHref={waHrefFor(row)}
            note={row.status !== 'checked_in' ? 'Check-in ainda não foi registrado para esta reserva.' : null}
          />
        )}
      />

      <ReceptionSection
        title="Hospedados agora"
        emptyText="Nenhum hóspede com check-in ativo no momento."
        rows={staying}
        renderAction={(row) => (
          <ReceptionActionBar reservationId={row.id} action={null} waHref={waHrefFor(row)} note={null} />
        )}
      />

      <ReceptionSection
        title="Próximas chegadas (7 dias)"
        emptyText="Nenhuma chegada prevista para os próximos 7 dias."
        rows={upcoming}
        renderAction={(row) => (
          <ReceptionActionBar reservationId={row.id} action={null} waHref={waHrefFor(row)} note={null} />
        )}
      />

    </div>
  )
}

// ─── Section & card ───────────────────────────────────────────────────────────

function ReceptionSection({
  title,
  emptyText,
  rows,
  renderAction,
}: {
  title: string
  emptyText: string
  rows: Row[]
  renderAction: (row: Row) => React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-[18px] font-bold text-ocean-900">{title}</h2>
        <span className="text-[12px] font-semibold text-ocean-400">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className={`${CARD} text-center text-[13px] text-ocean-400 py-8`}>
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ReceptionCard key={row.id} row={row} action={renderAction(row)} />
          ))}
        </div>
      )}
    </section>
  )
}

function ReceptionCard({ row, action }: { row: Row; action: React.ReactNode }) {
  return (
    <div className={CARD}>

      {/* Guest + token */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ocean-900 text-[14px]">{row.guestName}</p>
            <ReservationStatusBadge status={row.status} />
          </div>
          <p className="text-[12px] text-ocean-400 mt-0.5 truncate">
            {row.guestEmail}{row.guestPhone ? ` · ${row.guestPhone}` : ''}
          </p>
        </div>
        <span className="font-mono text-[11px] text-ocean-500 shrink-0">{row.token}</span>
      </div>

      {/* Booking facts */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mt-3.5 pt-3.5 border-t border-ocean-50">
        <Field label="Quarto" value={row.roomName} />
        <Field label="Período" value={`${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}`} />
        <Field label="Hóspedes" value={`${row.adults}${row.children > 0 ? ` + ${row.children}` : ''}`} />
        <Field label="Total" value={formatBRL(row.total)} />
        <div>
          <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-1">Pagamento</p>
          <PaymentStatusBadge status={row.paymentStatus} />
        </div>
      </div>

      {/* Special requests */}
      {row.specialRequests && (
        <p className="text-[12px] text-ocean-600 bg-ocean-50/60 rounded-xl px-3.5 py-2.5 mt-3.5 leading-relaxed">
          <span className="font-semibold">Pedido especial:</span> {row.specialRequests}
        </p>
      )}

      {/* Actions */}
      <div className="mt-3.5 pt-3.5 border-t border-ocean-50">
        {action}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">{label}</p>
      <p className="text-[13px] font-medium text-ocean-900 whitespace-nowrap">{value}</p>
    </div>
  )
}
