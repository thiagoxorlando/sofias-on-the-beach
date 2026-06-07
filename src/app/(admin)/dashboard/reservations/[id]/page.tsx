import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReservationStatusBadge, PaymentStatusBadge, PAYMENT_LABELS } from '../_components/badges'
import { ReservationActions } from './_components/ReservationActions'
import { ManualPaymentTrigger } from './_components/ManualPaymentTrigger'
import { NotesPanel } from './_components/NotesPanel'
import { ReceiptLink } from '../../payments/_components/ReceiptLink'

export const metadata: Metadata = { title: "Detalhe da reserva — Painel Sofia's" }

const CARD = 'bg-white rounded-[18px] border border-ocean-100 p-5 md:p-6'

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

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
}

const MANUAL_METHOD_LABELS: Record<string, string> = {
  pix_manual:    'PIX manual',
  cash:          'Dinheiro',
  bank_transfer: 'Transferência bancária',
  card_machine:  'Máquina de cartão',
  other:         'Outro',
}

const EVENT_LABELS: Record<string, string> = {
  reservation_created:   'Reserva criada',
  payment_initiated:     'Pagamento iniciado',
  payment_confirmed:     'Pagamento confirmado',
  reservation_confirmed: 'Reserva confirmada',
  reservation_cancelled: 'Reserva cancelada',
  checked_in:            'Check-in registrado',
  checked_out:           'Check-out registrado',
}

type GuestJoin = { id: string; full_name: string; email: string; phone: string | null; cpf: string | null; nationality: string; total_stays: number }
type CategoryJoin = { name: string }
type RoomJoin = { id: string; name: string; slug: string; max_guests: number; base_price_brl: number; room_categories: CategoryJoin | CategoryJoin[] | null }

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select(`
      id, token, status, check_in, check_out, adults, children,
      base_amount_brl, discount_brl, total_brl, special_requests,
      cancellation_reason, cancelled_at, checked_in_at, checked_out_at, created_at,
      guests ( id, full_name, email, phone, cpf, nationality, total_stays ),
      rooms ( id, name, slug, max_guests, base_price_brl, room_categories ( name ) )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!reservation) notFound()

  const guest = one(reservation.guests as GuestJoin | GuestJoin[] | null)
  const room  = one(reservation.rooms as RoomJoin | RoomJoin[] | null)
  const category = room ? one(room.room_categories) : null

  const [{ data: payments }, { data: events }, { data: notesData }, { data: blockedDates }] = await Promise.all([
    db
      .from('payments')
      .select('id, method, status, amount_brl, paid_at, asaas_invoice_url, refund_reason, refunded_at, created_at, manual_payment_method, manual_payment_note, manual_receipt_path')
      .eq('reservation_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('reservation_events')
      .select('id, event_type, description, created_by, created_at')
      .eq('reservation_id', id)
      .order('created_at', { ascending: true }),
    db
      .from('reservation_notes')
      .select('id, note, created_at, admin_users ( full_name )')
      .eq('reservation_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('room_availability')
      .select('date, blocked_reason')
      .eq('reservation_id', id)
      .order('date', { ascending: true }),
  ])

  const notes = (notesData ?? []).map((n) => ({
    id: n.id,
    note: n.note,
    createdAtLabel: formatDateTime(n.created_at),
    authorName: one(n.admin_users as { full_name: string } | { full_name: string }[] | null)?.full_name ?? null,
  }))

  const relevantPayment = (payments ?? []).find((p) => p.status !== 'failed') ?? payments?.[0] ?? null
  const nights = nightsBetween(reservation.check_in, reservation.check_out)
  const waMsg = encodeURIComponent(`Olá ${guest?.full_name ?? ''}! Aqui é da Sofia's on the Beach, sobre a sua reserva ${reservation.token}.`)
  const waHref = guest?.phone ? `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${waMsg}` : null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/reservations" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ocean-500 hover:text-ocean-800 transition-colors mb-3">
          ← Todas as reservas
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">
                Reserva {reservation.token}
              </h1>
              <ReservationStatusBadge status={reservation.status} />
            </div>
            <p className="text-[13px] text-ocean-500 mt-1.5">
              Criada em {formatDateTime(reservation.created_at)}
            </p>
          </div>
          <ReservationActions reservationId={reservation.id} status={reservation.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Summary */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Resumo da reserva</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <Field label="Check-in"  value={formatDate(reservation.check_in)} />
              <Field label="Check-out" value={formatDate(reservation.check_out)} />
              <Field label="Noites"    value={`${nights} noite${nights !== 1 ? 's' : ''}`} />
              <Field label="Hóspedes"  value={`${reservation.adults}${reservation.children > 0 ? ` + ${reservation.children}` : ''}`} />
            </div>
            <div className="rounded-2xl bg-ocean-50/60 px-5 py-4 space-y-1.5">
              <Row label="Diária base" value={formatBRL(reservation.base_amount_brl)} />
              {reservation.discount_brl > 0 && (
                <Row label="Desconto" value={`− ${formatBRL(reservation.discount_brl)}`} />
              )}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-ocean-100">
                <span className="text-[13px] font-bold text-ocean-900">Total</span>
                <span className="font-serif text-[19px] font-bold text-ocean-900">{formatBRL(reservation.total_brl)}</span>
              </div>
            </div>
            {reservation.special_requests && (
              <div className="mt-4">
                <p className="text-[11px] font-bold text-ocean-500 uppercase tracking-[0.10em] mb-1.5">Pedidos especiais</p>
                <p className="text-[13px] text-ocean-700 leading-relaxed bg-ocean-50/40 rounded-xl px-4 py-3">
                  {reservation.special_requests}
                </p>
              </div>
            )}
            {reservation.status === 'cancelled' && (
              <div className="mt-4">
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-[0.10em] mb-1.5">Cancelamento</p>
                <p className="text-[13px] text-red-600 leading-relaxed bg-red-50 rounded-xl px-4 py-3">
                  {reservation.cancellation_reason ?? 'Sem motivo registrado.'}
                  <span className="block text-[11px] text-red-400 mt-1">{formatDateTime(reservation.cancelled_at)}</span>
                </p>
              </div>
            )}
          </section>

          {/* Guest */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Hóspede</h2>
            {guest ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Nome"          value={guest.full_name} />
                <Field label="E-mail"        value={guest.email} />
                <Field label="Telefone"      value={guest.phone ?? '—'} />
                <Field label="CPF"           value={guest.cpf ?? '—'} />
                <Field label="Nacionalidade" value={guest.nationality} />
                <Field label="Estadias"      value={`${guest.total_stays}`} />
              </div>
            ) : (
              <p className="text-[13px] text-ocean-400">Hóspede não encontrado.</p>
            )}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors rounded-xl px-4 py-2.5"
              >
                Falar no WhatsApp
              </a>
            )}
          </section>

          {/* Room */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Acomodação</h2>
            {room ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Quarto"       value={room.name} />
                <Field label="Categoria"    value={category?.name ?? '—'} />
                <Field label="Capacidade"   value={`${room.max_guests} hóspedes`} />
                <Field label="Diária base"  value={formatBRL(room.base_price_brl)} />
              </div>
            ) : (
              <p className="text-[13px] text-ocean-400">Quarto não encontrado.</p>
            )}
          </section>

          {/* Payment */}
          <section className={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[17px] font-bold text-ocean-900">Pagamento</h2>
              <PaymentStatusBadge status={relevantPayment?.status ?? null} />
            </div>
            {relevantPayment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Método"  value={relevantPayment.method === 'pix' ? 'PIX' : relevantPayment.method === 'card' ? 'Cartão' : relevantPayment.method} />
                  <Field label="Valor"   value={formatBRL(relevantPayment.amount_brl)} />
                  <Field label="Pago em" value={formatDateTime(relevantPayment.paid_at)} />
                  <Field label="Status"  value={PAYMENT_LABELS[relevantPayment.status] ?? relevantPayment.status} />
                </div>
                {relevantPayment.manual_payment_method && (
                  <div className="bg-ocean-50/60 border border-ocean-100 rounded-xl px-4 py-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.10em]">Pago manualmente</p>
                    <p className="text-[13px] font-medium text-ocean-900">
                      {MANUAL_METHOD_LABELS[relevantPayment.manual_payment_method] ?? relevantPayment.manual_payment_method}
                      <span className="text-ocean-500"> · {formatBRL(relevantPayment.amount_brl)}</span>
                      {relevantPayment.paid_at && <span className="text-ocean-500"> · {formatDateTime(relevantPayment.paid_at)}</span>}
                    </p>
                    {relevantPayment.manual_payment_note && (
                      <p className="text-[12px] text-ocean-600 leading-relaxed">{relevantPayment.manual_payment_note}</p>
                    )}
                    {relevantPayment.manual_receipt_path && (
                      <ReceiptLink receiptPath={relevantPayment.manual_receipt_path} />
                    )}
                  </div>
                )}
                {relevantPayment.refund_reason && (
                  <p className="text-[12px] text-ocean-500">
                    Estorno: {relevantPayment.refund_reason} ({formatDateTime(relevantPayment.refunded_at)})
                  </p>
                )}
                {(relevantPayment.asaas_invoice_url || relevantPayment.status === 'pending' || relevantPayment.status === 'overdue') && (
                  <div className="flex flex-wrap items-center gap-3">
                    {relevantPayment.asaas_invoice_url && (
                      <a
                        href={relevantPayment.asaas_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors"
                      >
                        Ver cobrança no Asaas →
                      </a>
                    )}
                    {(relevantPayment.status === 'pending' || relevantPayment.status === 'overdue') && (
                      <ManualPaymentTrigger paymentId={relevantPayment.id} amount={relevantPayment.amount_brl} />
                    )}
                  </div>
                )}
                {(payments?.length ?? 0) > 1 && (
                  <details className="text-[12px] text-ocean-500">
                    <summary className="cursor-pointer font-semibold text-ocean-600 hover:text-ocean-900">
                      Ver todas as tentativas de pagamento ({payments!.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {payments!.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 flex-wrap">
                          <PaymentStatusBadge status={p.status} />
                          <span>{p.method === 'pix' ? 'PIX' : p.method === 'card' ? 'Cartão' : p.method}</span>
                          <span className="text-ocean-400">· {formatDateTime(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-ocean-400">Sem pagamento registrado para esta reserva.</p>
                {(reservation.status === 'pending_payment' || reservation.status === 'confirmed') && (
                  <ManualPaymentTrigger reservationId={reservation.id} amount={reservation.total_brl} />
                )}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section className={CARD}>
            <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-4">Histórico da reserva</h2>
            {events && events.length > 0 ? (
              <ol className="space-y-4">
                {events.map((ev, i) => (
                  <li key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-ocean-500 mt-1.5 shrink-0" />
                      {i < events.length - 1 && <span className="w-px flex-1 bg-ocean-100 mt-1" />}
                    </div>
                    <div className="pb-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ocean-900">
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                      </p>
                      <p className="text-[12px] text-ocean-500 mt-0.5 leading-relaxed">{ev.description}</p>
                      <p className="text-[11px] text-ocean-400 mt-1">
                        {formatDateTime(ev.created_at)} · {ev.created_by}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13px] text-ocean-400">Nenhum evento registrado.</p>
            )}
          </section>

        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Blocked dates */}
          <section className={CARD}>
            <h2 className="font-serif text-[15px] font-bold text-ocean-900 mb-4">Datas bloqueadas</h2>
            {blockedDates && blockedDates.length > 0 ? (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {blockedDates.map((b) => (
                  <li key={b.date} className="flex items-center justify-between text-[12px]">
                    <span className="text-ocean-700 font-medium">{formatDate(b.date)}</span>
                    <span className="text-ocean-400">{b.blocked_reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ocean-400">Nenhuma data bloqueada para esta reserva.</p>
            )}
          </section>

          {/* Internal notes */}
          <section className={CARD}>
            <h2 className="font-serif text-[15px] font-bold text-ocean-900 mb-4">Notas internas</h2>
            <NotesPanel reservationId={reservation.id} notes={notes} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-ocean-500">{label}</span>
      <span className="text-ocean-700 font-medium">{value}</span>
    </div>
  )
}
