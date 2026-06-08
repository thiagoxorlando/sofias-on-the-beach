'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined

const MANUAL_METHOD_VALUES = ['pix_manual', 'cash', 'bank_transfer', 'card_machine', 'other'] as const
type ManualMethod = (typeof MANUAL_METHOD_VALUES)[number]

const MANUAL_METHOD_LABELS: Record<ManualMethod, string> = {
  pix_manual:    'PIX manual',
  cash:          'Dinheiro',
  bank_transfer: 'Transferência bancária',
  card_machine:  'Máquina de cartão',
  other:         'Outro',
}

const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function isManualMethod(value: string): value is ManualMethod {
  return (MANUAL_METHOD_VALUES as readonly string[]).includes(value)
}

async function logEvent(
  db: ReturnType<typeof createAdminClient>,
  reservationId: string,
  eventType: string,
  description: string,
  adminEmail: string,
) {
  await db.from('reservation_events').insert({
    reservation_id: reservationId,
    event_type:     eventType,
    description,
    created_by:     `admin:${adminEmail}`,
  })
}

function revalidatePayment(reservationId: string) {
  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/reservations')
  revalidatePath(`/dashboard/reservations/${reservationId}`)
}

// ── Manual payment confirmation ───────────────────────────────────────────────
// Replaces the old one-click "mark as paid". Staff must record how the money
// actually arrived (method, date, optional note, optional receipt upload) so
// finance has an audit trail for payments confirmed outside Asaas — e.g. PIX
// sent directly, cash, bank transfer, card machine. Mirrors the webhook's
// payment → reservation → timeline sequence, but guards the reservation
// transition (only 'pending_payment' → 'confirmed'; the webhook's unconditional
// update would be wrong for a manual correction).
//
// Two entry shapes, one form: the modal submits either `payment_id` (an
// existing charge being confirmed — e.g. a pending Asaas charge paid in cash
// instead) or `reservation_id` (the reservation has NO payment row at all —
// e.g. a walk-in or staff-arranged stay) and a brand-new payment row is
// created directly as paid/manual/manual. This is the ONLY path that may turn
// a reservation "confirmed" from 'pending_payment' — guaranteeing a reservation
// never reads as paid to the guest without a real `payments.status = 'paid'`
// row backing it.
//
// audit_logs is populated automatically by the SECURITY DEFINER triggers
// (trg_audit_payments / trg_audit_reservations) — inserting here would
// duplicate those rows.

export async function confirmManualPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('payments')

  const paymentId     = str(formData, 'payment_id') || null
  const reservationId = str(formData, 'reservation_id') || null
  const manualMethod  = str(formData, 'manual_payment_method')
  const amountRaw     = str(formData, 'amount_brl')
  const paidAtRaw     = str(formData, 'paid_at')
  const note          = str(formData, 'note') || null
  const receipt       = formData.get('receipt') as File | null

  if (!paymentId && !reservationId) return { error: 'Pagamento ou reserva inválidos.' }
  if (!isManualMethod(manualMethod)) return { error: 'Selecione a forma de pagamento.' }

  const amount = parseFloat(amountRaw.replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Informe um valor pago válido (maior que zero).' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAtRaw)) return { error: 'Informe a data do pagamento.' }
  const paidAtIso = new Date(`${paidAtRaw}T12:00:00`).toISOString()
  if (Number.isNaN(new Date(paidAtIso).getTime())) return { error: 'Data do pagamento inválida.' }

  const hasReceipt = !!receipt && receipt.size > 0
  if (hasReceipt) {
    if (!ALLOWED_RECEIPT_TYPES.includes(receipt!.type)) {
      return { error: 'Formato de comprovante inválido. Envie uma imagem (JPG, PNG, WebP) ou PDF.' }
    }
    if (receipt!.size > MAX_RECEIPT_SIZE) {
      return { error: 'Comprovante muito grande. O limite é 5MB.' }
    }
  }

  const db = createAdminClient()

  // Resolve the target: either an existing payment row to confirm, or a brand
  // new one to create for a reservation that currently has none.
  let targetPaymentId: string
  let targetReservationId: string
  let isNewPayment = false

  if (paymentId) {
    const { data: payment } = await db
      .from('payments')
      .select('id, reservation_id, status')
      .eq('id', paymentId)
      .maybeSingle()

    if (!payment) return { error: 'Pagamento não encontrado.' }
    if (payment.status === 'paid') return { error: 'Este pagamento já está marcado como pago.' }
    if (payment.status === 'refunded') return { error: 'Não é possível marcar um pagamento estornado como pago.' }

    targetPaymentId = payment.id
    targetReservationId = payment.reservation_id
  } else {
    const { data: reservation } = await db
      .from('reservations')
      .select('id, status')
      .eq('id', reservationId!)
      .maybeSingle()

    if (!reservation) return { error: 'Reserva não encontrada.' }
    if (reservation.status !== 'pending_payment' && reservation.status !== 'confirmed') {
      return { error: 'Só é possível registrar pagamento manual para reservas aguardando pagamento ou confirmadas.' }
    }

    // Re-check for a payment row — the UI only offers this path when none
    // exists, but guard against a stale page / race condition regardless.
    const { data: existing } = await db
      .from('payments')
      .select('id')
      .eq('reservation_id', reservation.id)
      .neq('status', 'failed')
      .neq('status', 'cancelled')
      .maybeSingle()

    if (existing) return { error: 'Já existe um pagamento para esta reserva. Atualize a página e tente novamente.' }

    targetPaymentId = crypto.randomUUID()
    targetReservationId = reservation.id
    isNewPayment = true
  }

  // Upload the receipt before touching the payment row — if this fails we bail
  // out with nothing changed; if the later DB write fails we clean it back up.
  let receiptPath: string | null = null
  if (hasReceipt) {
    const safeFilename = receipt!.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
    receiptPath = `${targetReservationId}/${targetPaymentId}/${Date.now()}-${safeFilename}`

    const { error: uploadError } = await db.storage
      .from('payment-receipts')
      .upload(receiptPath, await receipt!.arrayBuffer(), { contentType: receipt!.type, upsert: false })

    if (uploadError) {
      console.error('[payments] failed to upload manual payment receipt:', uploadError)
      return { error: 'Erro ao enviar o comprovante. Tente novamente.' }
    }
  }

  const manualFields = {
    status:                'paid' as const,
    paid_at:               paidAtIso,
    amount_brl:            amount,
    manual_payment_method: manualMethod,
    manual_payment_note:   note,
    manual_paid_by:        admin.id,
    manual_receipt_path:   receiptPath,
  }

  const { error } = isNewPayment
    ? await db.from('payments').insert({
        id:             targetPaymentId,
        reservation_id: targetReservationId,
        method:         'manual',
        provider:       'manual',
        ...manualFields,
      })
    : await db.from('payments').update({ method: 'manual', ...manualFields }).eq('id', targetPaymentId)

  if (error) {
    console.error('[payments] failed to confirm manual payment:', error)
    if (receiptPath) await db.storage.from('payment-receipts').remove([receiptPath])
    return { error: 'Erro ao confirmar o pagamento. Tente novamente.' }
  }

  await logEvent(
    db, targetReservationId, 'payment_received',
    `Pagamento de ${formatBRL(amount)} confirmado manualmente por ${admin.full_name} — ` +
    `${MANUAL_METHOD_LABELS[manualMethod]}, recebido em ${formatDateLabel(paidAtRaw)}.` +
    (note ? ` Obs.: ${note}` : ''),
    admin.email,
  )

  const { data: reservation } = await db
    .from('reservations')
    .select('status')
    .eq('id', targetReservationId)
    .maybeSingle()

  if (reservation?.status === 'pending_payment') {
    const { error: resError } = await db
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', targetReservationId)

    if (!resError) {
      await logEvent(
        db, targetReservationId, 'reservation_confirmed',
        `Reserva confirmada automaticamente após confirmação manual de pagamento por ${admin.full_name}.`,
        admin.email,
      )
    } else {
      console.error('[payments] failed to confirm reservation after manual payment:', resError)
    }
  }

  revalidatePayment(targetReservationId)
  return { success: true }
}

// ── Mark as failed / cancelled (manual) ───────────────────────────────────────
// Status correction only — does NOT touch the reservation. The existing flows
// (webhook, guest cancellation) already decide if/when a reservation should be
// cancelled; a failed or cancelled charge does not necessarily mean the stay
// itself is off (staff may simply generate a new charge). No 'payment_failed'/
// 'payment_cancelled' event_type exists in reservation_events_type_check, so
// 'manual_update' is the correct timeline entry for this kind of correction.

async function markPaymentAs(
  paymentId: string,
  targetStatus: 'failed' | 'cancelled',
  label: string,
): Promise<ActionState> {
  const admin = await requireModule('payments')
  const db = createAdminClient()

  const { data: payment } = await db
    .from('payments')
    .select('id, reservation_id, status, amount_brl')
    .eq('id', paymentId)
    .maybeSingle()

  if (!payment) return { error: 'Pagamento não encontrado.' }
  if (payment.status === 'paid') return { error: 'Não é possível alterar um pagamento já confirmado como pago.' }
  if (payment.status === targetStatus) return { error: `Este pagamento já está marcado como ${label}.` }

  const { error } = await db
    .from('payments')
    .update({ status: targetStatus })
    .eq('id', payment.id)

  if (error) {
    console.error(`[payments] failed to mark payment as ${targetStatus}:`, error)
    return { error: 'Erro ao atualizar o pagamento. Tente novamente.' }
  }

  await logEvent(
    db, payment.reservation_id, 'manual_update',
    `Pagamento de ${formatBRL(payment.amount_brl)} marcado como ${label} manualmente por ${admin.full_name}.`,
    admin.email,
  )

  revalidatePayment(payment.reservation_id)
  return { success: true }
}

export async function markPaymentFailedAction(paymentId: string): Promise<ActionState> {
  return markPaymentAs(paymentId, 'failed', 'falho')
}

export async function markPaymentCancelledAction(paymentId: string): Promise<ActionState> {
  return markPaymentAs(paymentId, 'cancelled', 'cancelado')
}

// ── Receipt access ────────────────────────────────────────────────────────────
// payment-receipts is a private bucket — every view goes through a freshly
// minted, short-lived signed URL (never cache one in the DB; it would expire).

export async function getReceiptSignedUrlAction(receiptPath: string): Promise<{ url: string } | { error: string }> {
  await requireModule('payments')
  if (!receiptPath) return { error: 'Comprovante não encontrado.' }

  const db = createAdminClient()
  const { data, error } = await db.storage
    .from('payment-receipts')
    .createSignedUrl(receiptPath, 60 * 5)

  if (error || !data?.signedUrl) {
    console.error('[payments] failed to sign receipt url:', error)
    return { error: 'Erro ao abrir o comprovante. Tente novamente.' }
  }

  return { url: data.signedUrl }
}
