import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { ReservationStatusBadge, PaymentStatusBadge } from '../reservations/_components/badges'
import { ReceptionActionBar } from './_components/ReceptionActionBar'
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminListCard,
  AdminEmptyState,
} from '@/components/admin/AdminUI'

export const metadata: Metadata = { title: "Recepção — Painel Sofia's" }

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
type RoomJoin = { name: string; housekeeping_status: string }
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
  roomHousekeepingStatus: string | null
  paymentStatus: string | null
  latestNote: string | null
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
  rooms ( name, housekeeping_status ),
  payments ( status, created_at )
`

function toRow(r: ReservationRow, latestNote: string | null): Row {
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
    roomHousekeepingStatus: room?.housekeeping_status ?? null,
    paymentStatus: latestPaymentStatus(r.payments),
    latestNote,
  }
}

const HOUSEKEEPING_READY_LABEL: Record<string, string> = {
  dirty:     'sujo',
  cleaning:  'em limpeza',
  clean:     'limpo (aguardando inspeção)',
  inspected: 'inspecionado',
  ready:     'pronto',
}

type AttentionRow = { row: Row; reasons: string[] }

function attentionFor(checkIns: Row[], staying: Row[]): AttentionRow[] {
  const out: AttentionRow[] = []
  for (const row of checkIns) {
    const reasons: string[] = []
    if (row.paymentStatus !== 'paid') {
      reasons.push('Pagamento ainda não confirmado para a chegada de hoje')
    }
    if (row.roomHousekeepingStatus && row.roomHousekeepingStatus !== 'ready') {
      reasons.push(`Quarto ainda não está pronto (${HOUSEKEEPING_READY_LABEL[row.roomHousekeepingStatus] ?? row.roomHousekeepingStatus})`)
    }
    if (reasons.length > 0) out.push({ row, reasons })
  }
  for (const row of staying) {
    if (row.specialRequests) {
      out.push({ row, reasons: ['Hóspede com pedido especial em aberto'] })
    }
  }
  return out
}

function checkInWarningsFor(row: Row): string[] {
  const warnings: string[] = []
  if (row.paymentStatus !== 'paid') warnings.push('Pagamento ainda não confirmado.')
  if (row.roomHousekeepingStatus && row.roomHousekeepingStatus !== 'ready') {
    warnings.push(`Quarto ainda não está pronto (${HOUSEKEEPING_READY_LABEL[row.roomHousekeepingStatus] ?? row.roomHousekeepingStatus}).`)
  }
  if (row.specialRequests) warnings.push('Hóspede tem pedidos especiais — confira antes de liberar o check-in.')
  return warnings
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

  const allReservations = [
    ...(checkInsData ?? []), ...(checkOutsData ?? []), ...(stayingData ?? []), ...(upcomingData ?? []),
  ]
  const reservationIds = [...new Set(allReservations.map((r) => r.id))]

  const { data: notesData } = reservationIds.length > 0
    ? await db
        .from('reservation_notes')
        .select('reservation_id, note, created_at')
        .in('reservation_id', reservationIds)
        .order('created_at', { ascending: false })
    : { data: [] as { reservation_id: string; note: string; created_at: string }[] }

  const latestNoteByReservation = new Map<string, string>()
  for (const n of notesData ?? []) {
    if (!latestNoteByReservation.has(n.reservation_id)) latestNoteByReservation.set(n.reservation_id, n.note)
  }
  const noteFor = (id: string) => latestNoteByReservation.get(id) ?? null

  const checkIns = (checkInsData ?? []).map((r) => toRow(r, noteFor(r.id)))
  const checkOuts = (checkOutsData ?? []).map((r) => toRow(r, noteFor(r.id)))
  const staying = (stayingData ?? []).map((r) => toRow(r, noteFor(r.id)))
  const upcoming = (upcomingData ?? []).map((r) => toRow(r, noteFor(r.id)))
  const attention = attentionFor(checkIns, staying)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl space-y-8">

      <AdminPageHeader
        eyebrow="Operação diária"
        title="Recepção"
        subtitle={`Chegadas, saídas e hóspedes na pousada — hoje, ${formatDate(today)}.`}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <AdminStatCard label="Check-ins hoje" value={checkIns.length} tone="navy" />
        <AdminStatCard label="Check-outs hoje" value={checkOuts.length} tone="info" />
        <AdminStatCard label="Hospedados agora" value={staying.length} tone="success" />
        <AdminStatCard
          label="Atenção necessária"
          value={attention.length}
          tone={attention.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {attention.length > 0 && (
        <AdminSection title="Atenção necessária" count={attention.length}>
          <div className="space-y-3">
            {attention.map(({ row, reasons }) => (
              <AdminListCard
                key={row.id}
                tone="warning"
                title={row.guestName}
                titleMeta={`${row.roomName} · ${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}`}
                badges={<ReservationStatusBadge status={row.status} />}
                meta={row.token}
                notes={reasons.map((reason) => ({ label: 'Atenção', text: reason }))}
                actions={
                  <ReceptionActionBar
                    reservationId={row.id}
                    action={row.status === 'confirmed' && row.checkIn === today ? 'check_in' : null}
                    waHref={waHrefFor(row)}
                    note={null}
                    checkInWarnings={checkInWarningsFor(row)}
                  />
                }
              />
            ))}
          </div>
        </AdminSection>
      )}

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
            checkInWarnings={checkInWarningsFor(row)}
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
    <AdminSection title={title} count={rows.length}>
      {rows.length === 0 ? (
        <AdminEmptyState>{emptyText}</AdminEmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <AdminListCard
              key={row.id}
              title={row.guestName}
              titleMeta={`${row.guestEmail}${row.guestPhone ? ` · ${row.guestPhone}` : ''}`}
              badges={<ReservationStatusBadge status={row.status} />}
              meta={row.token}
              fields={[
                { label: 'Quarto', value: row.roomName },
                { label: 'Período', value: `${formatDate(row.checkIn)} → ${formatDate(row.checkOut)}` },
                { label: 'Hóspedes', value: `${row.adults}${row.children > 0 ? ` + ${row.children}` : ''}` },
                { label: 'Total', value: formatBRL(row.total) },
                { label: 'Pagamento', value: <PaymentStatusBadge status={row.paymentStatus} /> },
              ]}
              notes={[
                ...(row.specialRequests ? [{ label: 'Pedido especial', text: row.specialRequests }] : []),
                ...(row.latestNote ? [{ label: 'Última nota', text: row.latestNote }] : []),
              ]}
              actions={renderAction(row)}
            />
          ))}
        </div>
      )}
    </AdminSection>
  )
}
