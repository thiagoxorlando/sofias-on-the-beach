import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReservationStatusBadge, PaymentStatusBadge } from '../../reservations/_components/badges'
import { GuestNotesPanel } from './_components/GuestNotesPanel'

export const metadata: Metadata = { title: "Hóspede — Painel Sofia's" }

const CARD = 'bg-white rounded-[18px] border border-ocean-100 p-5 md:p-6'

const METHOD_LABELS: Record<string, string> = {
  pix:          'PIX',
  credit_card:  'Cartão de crédito',
  boleto:       'Boleto',
  manual:       'Manual',
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function latestPaymentStatus(payments: { status: string; created_at: string }[] | null): string | null {
  if (!payments || payments.length === 0) return null
  const sorted = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (sorted.find((p) => p.status !== 'failed') ?? sorted[0]).status
}

type RoomJoin = { name: string }
type PaymentJoin = {
  id: string
  method: string
  status: string
  amount_brl: number
  paid_at: string | null
  created_at: string
}
type ReservationJoin = {
  id: string
  token: string
  status: string
  check_in: string
  check_out: string
  adults: number
  children: number
  total_brl: number
  rooms: RoomJoin | RoomJoin[] | null
  payments: PaymentJoin[] | null
}

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()

  const { data: guest } = await db
    .from('guests')
    .select('id, full_name, email, phone, cpf, nationality, notes, total_stays, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!guest) notFound()

  const { data: reservationsData } = await db
    .from('reservations')
    .select(`
      id, token, status, check_in, check_out, adults, children, total_brl,
      rooms ( name ),
      payments ( id, method, status, amount_brl, paid_at, created_at )
    `)
    .eq('guest_id', id)
    .order('check_in', { ascending: false })
    .returns<ReservationJoin[]>()

  const reservations = (reservationsData ?? []).map((r) => ({
    id:            r.id,
    token:         r.token,
    status:        r.status,
    checkIn:       r.check_in,
    checkOut:      r.check_out,
    adults:        r.adults,
    children:      r.children,
    total:         r.total_brl,
    roomName:      one(r.rooms)?.name ?? '—',
    paymentStatus: latestPaymentStatus(r.payments),
  }))

  const payments = (reservationsData ?? [])
    .flatMap((r) => (r.payments ?? []).map((p) => ({ ...p, reservationId: r.id, reservationToken: r.token })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const waMsg = encodeURIComponent(`Olá ${guest.full_name}! Aqui é da Sofia's on the Beach.`)
  const waHref = guest.phone ? `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${waMsg}` : null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/guests" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ocean-500 hover:text-ocean-800 transition-colors mb-3">
          ← Todos os hóspedes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">
              {guest.full_name}
            </h1>
            <p className="text-[13px] text-ocean-500 mt-1.5">
              Cadastrado em {formatDateTime(guest.created_at)} · {guest.total_stays} estadia{guest.total_stays !== 1 ? 's' : ''} concluída{guest.total_stays !== 1 ? 's' : ''}
            </p>
          </div>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors rounded-xl px-4 py-2.5 shrink-0"
            >
              Falar no WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Reservation history */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Histórico de reservas</h2>
            {reservations.length > 0 ? (
              <ul className="divide-y divide-ocean-50 -mx-1">
                {reservations.map((r) => (
                  <li key={r.id} className="px-1 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Quarto</p>
                        <p className="text-[13px] font-medium text-ocean-900 truncate">{r.roomName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Check-in / Check-out</p>
                        <p className="text-[13px] font-medium text-ocean-700 whitespace-nowrap">
                          {formatDate(r.checkIn)} <span className="text-ocean-300">→</span> {formatDate(r.checkOut)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Hóspedes</p>
                        <p className="text-[13px] font-medium text-ocean-700">
                          {r.adults}{r.children > 0 ? ` + ${r.children}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Total</p>
                        <p className="text-[13px] font-bold text-ocean-900 whitespace-nowrap">{formatBRL(r.total)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ReservationStatusBadge status={r.status} />
                        <PaymentStatusBadge status={r.paymentStatus} />
                      </div>
                      <Link
                        href={`/dashboard/reservations/${r.id}`}
                        className="sm:ml-auto text-ocean-600 hover:text-ocean-900 text-[12px] font-semibold transition-colors whitespace-nowrap"
                      >
                        Ver reserva →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ocean-400">Nenhuma reserva registrada para este hóspede.</p>
            )}
          </section>

          {/* Payment history */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Histórico de pagamentos</h2>
            {payments.length > 0 ? (
              <ul className="divide-y divide-ocean-50">
                {payments.map((p) => (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <PaymentStatusBadge status={p.status} />
                    <span className="text-[13px] text-ocean-700">{METHOD_LABELS[p.method] ?? p.method}</span>
                    <span className="text-[13px] font-bold text-ocean-900">{formatBRL(p.amount_brl)}</span>
                    <span className="text-[12px] text-ocean-400">
                      {p.paid_at ? `pago em ${formatDateTime(p.paid_at)}` : `criado em ${formatDateTime(p.created_at)}`}
                    </span>
                    <Link
                      href={`/dashboard/reservations/${p.reservationId}`}
                      className="sm:ml-auto text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors whitespace-nowrap"
                    >
                      Reserva {p.reservationToken} →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ocean-400">Nenhum pagamento registrado para este hóspede.</p>
            )}
          </section>

        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Profile */}
          <section className={CARD}>
            <h2 className="font-serif text-[15px] font-bold text-ocean-900 mb-4">Perfil do hóspede</h2>
            <div className="space-y-3.5">
              <Field label="Nome completo" value={guest.full_name} />
              <Field label="E-mail" value={guest.email} />
              <Field label="Telefone" value={guest.phone ?? '—'} />
              <Field label="CPF" value={guest.cpf ?? '—'} />
              <Field label="Nacionalidade" value={guest.nationality} />
              <Field label="Cadastrado em" value={formatDateTime(guest.created_at)} />
            </div>
          </section>

          {/* Internal notes */}
          <section className={CARD}>
            <h2 className="font-serif text-[15px] font-bold text-ocean-900 mb-4">Notas internas</h2>
            <GuestNotesPanel guestId={guest.id} notes={guest.notes} />
          </section>

        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-1">{label}</p>
      <p className="text-[13px] font-medium text-ocean-900">{value}</p>
    </div>
  )
}
