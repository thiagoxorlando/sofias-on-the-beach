'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCustomer, createPayment, createCardPayment, getPixQrCode } from '@/lib/asaas/client'
import { PAYMENT_UNAVAILABLE_MESSAGE } from './paymentMessages'

export type PaymentActionState =
  | { error: string }
  | { success: true; invoiceUrl: string | null; pixQrCode: string | null; pixCopyPaste: string | null }
  | undefined

type GuestJoin = { full_name: string; email: string; phone: string | null; cpf: string | null }

// True when the gateway itself is unreachable/unconfigured rather than the
// guest's card/data being rejected — these two cases need different messaging.
function isGatewayUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message.includes('not configured')
}

export async function generatePixPaymentAction(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const token = ((formData.get('token') as string) ?? '').trim()
  if (!token) return { error: 'Token inválido.' }

  const db = createAdminClient()

  // Load reservation + guest
  const { data: reservation } = await db
    .from('reservations')
    .select(`
      id, token, status, total_brl,
      guests ( full_name, email, phone, cpf )
    `)
    .eq('token', token)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'pending_payment') {
    return { error: 'Esta reserva não está aguardando pagamento.' }
  }

  // Return existing pending/paid payment rather than creating a duplicate
  const { data: existing } = await db
    .from('payments')
    .select('asaas_invoice_url, asaas_pix_qr_code, asaas_pix_copy_paste, status')
    .eq('reservation_id', reservation.id)
    .eq('method', 'pix')
    .neq('status', 'failed')
    .maybeSingle()

  if (existing) {
    return {
      success:      true,
      invoiceUrl:   existing.asaas_invoice_url,
      pixQrCode:    existing.asaas_pix_qr_code,
      pixCopyPaste: existing.asaas_pix_copy_paste,
    }
  }

  const guest =
    reservation.guests && !Array.isArray(reservation.guests)
      ? (reservation.guests as GuestJoin)
      : null
  if (!guest) return { error: 'Dados do hóspede não encontrados.' }

  // Create Asaas customer
  let asaasCustomerId: string
  try {
    const customer = await createCustomer({
      name:      guest.full_name,
      email:     guest.email,
      cpfCnpj:   guest.cpf   ?? undefined,
      phone:     guest.phone ?? undefined,
    })
    asaasCustomerId = customer.id
  } catch (err) {
    console.error('[Asaas] createCustomer:', err)
    return { error: PAYMENT_UNAVAILABLE_MESSAGE }
  }

  // Due date: 3 days from today
  const due = new Date()
  due.setDate(due.getDate() + 3)
  const dueDate = due.toISOString().split('T')[0]

  // Create PIX charge
  let asaasPaymentId: string
  let invoiceUrl: string | null = null
  try {
    const charge = await createPayment({
      customer:          asaasCustomerId,
      billingType:       'PIX',
      value:             reservation.total_brl,
      dueDate,
      description:       `Reserva ${token} — Sofia's on the Beach`,
      externalReference: token,
    })
    asaasPaymentId = charge.id
    invoiceUrl     = charge.invoiceUrl ?? null
  } catch (err) {
    console.error('[Asaas] createPayment:', err)
    return { error: PAYMENT_UNAVAILABLE_MESSAGE }
  }

  // Get QR code (non-fatal on failure)
  let pixQrCode:    string | null = null
  let pixCopyPaste: string | null = null
  try {
    const qr     = await getPixQrCode(asaasPaymentId)
    pixQrCode    = qr.encodedImage ?? null
    pixCopyPaste = qr.payload ?? null
  } catch (err) {
    console.error('[Asaas] getPixQrCode:', err)
    // guest can still use invoiceUrl
  }

  // Persist payment row
  await db.from('payments').insert({
    reservation_id:       reservation.id,
    amount_brl:           reservation.total_brl,
    method:               'pix',
    provider:             'asaas',
    asaas_payment_id:     asaasPaymentId,
    asaas_invoice_url:    invoiceUrl,
    asaas_pix_qr_code:    pixQrCode,
    asaas_pix_copy_paste: pixCopyPaste,
    asaas_due_date:       dueDate,
    status:               'pending',
  })

  await db.from('reservation_events').insert({
    reservation_id: reservation.id,
    event_type:     'payment_initiated',
    description:    'Cobrança PIX gerada pelo hóspede via site.',
    created_by:     'guest',
    metadata:       { asaas_payment_id: asaasPaymentId },
  })

  revalidatePath(`/reserva/${token}`)

  return { success: true, invoiceUrl, pixQrCode, pixCopyPaste }
}

export async function generateCardPaymentAction(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const token         = ((formData.get('token')          as string) ?? '').trim()
  const holderName    = ((formData.get('holder_name')    as string) ?? '').trim()
  const cardNumber    = ((formData.get('card_number')    as string) ?? '').replace(/\s/g, '')
  const expiryMonth   = ((formData.get('expiry_month')   as string) ?? '').trim()
  const expiryYear    = ((formData.get('expiry_year')    as string) ?? '').trim()
  const ccv           = ((formData.get('ccv')            as string) ?? '').trim()
  const cpfCnpj       = ((formData.get('cpf_cnpj')       as string) ?? '').replace(/\D/g, '')
  const postalCode    = ((formData.get('postal_code')    as string) ?? '').replace(/\D/g, '')
  const addressNumber = ((formData.get('address_number') as string) ?? '').trim()

  if (!token) return { error: 'Token inválido.' }
  if (!holderName || !cardNumber || !expiryMonth || !expiryYear || !ccv) {
    return { error: 'Preencha todos os dados do cartão.' }
  }
  if (!cpfCnpj || !postalCode || !addressNumber) {
    return { error: 'CPF/CNPJ, CEP e número do endereço são obrigatórios.' }
  }

  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select(`
      id, token, status, total_brl,
      guests ( full_name, email, phone, cpf )
    `)
    .eq('token', token)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'pending_payment') {
    return { error: 'Esta reserva não está aguardando pagamento.' }
  }

  // Idempotent — return existing card payment
  const { data: existing } = await db
    .from('payments')
    .select('asaas_invoice_url, status')
    .eq('reservation_id', reservation.id)
    .eq('method', 'card')
    .neq('status', 'failed')
    .maybeSingle()

  if (existing) {
    return { success: true, invoiceUrl: existing.asaas_invoice_url, pixQrCode: null, pixCopyPaste: null }
  }

  const guest =
    reservation.guests && !Array.isArray(reservation.guests)
      ? (reservation.guests as GuestJoin)
      : null
  if (!guest) return { error: 'Dados do hóspede não encontrados.' }

  let asaasCustomerId: string
  try {
    const customer = await createCustomer({
      name:    guest.full_name,
      email:   guest.email,
      cpfCnpj: cpfCnpj || undefined,
      phone:   guest.phone ?? undefined,
    })
    asaasCustomerId = customer.id
  } catch (err) {
    console.error('[Asaas] createCustomer (card):', err)
    return { error: PAYMENT_UNAVAILABLE_MESSAGE }
  }

  const due = new Date()
  due.setDate(due.getDate() + 1)
  const dueDate = due.toISOString().split('T')[0]

  let asaasPaymentId: string
  let invoiceUrl: string | null = null
  try {
    const charge = await createCardPayment({
      customer:          asaasCustomerId,
      value:             reservation.total_brl,
      dueDate,
      description:       `Reserva ${token} — Sofia's on the Beach`,
      externalReference: token,
      creditCard: {
        holderName,
        number:      cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
      },
      creditCardHolderInfo: {
        name:          guest.full_name,
        email:         guest.email,
        cpfCnpj,
        postalCode,
        addressNumber,
        phone:         guest.phone ?? undefined,
        mobilePhone:   guest.phone ?? undefined,
      },
    })
    asaasPaymentId = charge.id
    invoiceUrl     = charge.invoiceUrl ?? null
  } catch (err) {
    console.error('[Asaas] createCardPayment:', err)
    return {
      error: isGatewayUnavailable(err)
        ? PAYMENT_UNAVAILABLE_MESSAGE
        : 'Cartão recusado ou dados inválidos. Verifique os dados e tente novamente.',
    }
  }

  // Persist payment row — raw card data is NOT stored
  await db.from('payments').insert({
    reservation_id:    reservation.id,
    amount_brl:        reservation.total_brl,
    method:            'card',
    provider:          'asaas',
    asaas_payment_id:  asaasPaymentId,
    asaas_invoice_url: invoiceUrl,
    asaas_due_date:    dueDate,
    status:            'pending',
  })

  await db.from('reservation_events').insert({
    reservation_id: reservation.id,
    event_type:     'payment_initiated',
    description:    'Pagamento com cartão de crédito iniciado pelo hóspede via site.',
    created_by:     'guest',
    metadata:       { asaas_payment_id: asaasPaymentId },
  })

  revalidatePath(`/reserva/${token}`)

  return { success: true, invoiceUrl, pixQrCode: null, pixCopyPaste: null }
}
