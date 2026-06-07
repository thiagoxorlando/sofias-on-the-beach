import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Asaas sends `asaas-access-token` header on every webhook call.
// If ASAAS_WEBHOOK_TOKEN is set, we verify it; otherwise accept all (dev).
export async function POST(req: NextRequest) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
  if (webhookToken) {
    const incoming = req.headers.get('asaas-access-token')
    if (incoming !== webhookToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, payment } = body as {
    event?: string
    payment?: { id?: string; externalReference?: string; status?: string; value?: number }
  }

  if (!event || !payment?.id) {
    return NextResponse.json({ ok: true }) // ignore unknown shapes
  }

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const db = createAdminClient()

    // Find our payment row by Asaas payment ID
    const { data: paymentRow } = await db
      .from('payments')
      .select('id, reservation_id, status')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle()

    if (!paymentRow) {
      return NextResponse.json({ ok: true }) // unknown payment, ignore
    }

    if (paymentRow.status === 'paid') {
      return NextResponse.json({ ok: true }) // already processed, idempotent
    }

    // Mark payment as paid
    await db
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', paymentRow.id)

    // Confirm the reservation
    await db
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', paymentRow.reservation_id)

    // Audit event
    await db.from('reservation_events').insert({
      reservation_id: paymentRow.reservation_id,
      event_type:     'payment_received',
      description:    `Pagamento PIX confirmado via Asaas (ID: ${payment.id}).`,
      created_by:     'system',
      metadata:       { asaas_payment_id: payment.id, asaas_event: event },
    })
  }

  return NextResponse.json({ ok: true })
}
