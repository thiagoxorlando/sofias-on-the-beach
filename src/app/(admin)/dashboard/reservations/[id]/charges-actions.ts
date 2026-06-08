'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

const CATEGORIES = [
  'beach_towel', 'lost_key', 'damage', 'late_checkout',
  'extra_cleaning', 'minibar', 'laundry', 'transfer', 'other',
] as const

// Recording extras is core front-desk work — reception, plus the roles that
// already see the full reception module (manager, admin, super_admin).
async function requireChargeAccess() {
  const admin = await requireAdmin()
  if (!canAccessModule(admin.role, 'reception')) redirect('/dashboard')
  return admin
}

// Settling a charge as paid overlaps with finance's job (reconciling what the
// guest owes), so finance may also mark charges paid — but NOT waive them
// (waiving is a front-desk/managerial judgment call, not a payments decision).
async function requireChargeSettlementAccess() {
  const admin = await requireAdmin()
  if (!canAccessModule(admin.role, 'reception') && !canAccessModule(admin.role, 'payments')) {
    redirect('/dashboard')
  }
  return admin
}

function revalidateCharges(reservationId: string) {
  revalidatePath(`/dashboard/reservations/${reservationId}`)
  revalidatePath('/dashboard/reception')
}

// ── Add charge ────────────────────────────────────────────────────────────────

export async function addReservationChargeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireChargeAccess()

  const reservationId = str(formData, 'reservation_id')
  const category = str(formData, 'category')
  const description = str(formData, 'description')
  const quantityRaw = str(formData, 'quantity')
  const unitAmountRaw = str(formData, 'unit_amount_brl')

  if (!reservationId) return { error: 'Reserva inválida.' }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return { error: 'Selecione uma categoria válida.' }
  if (!description) return { error: 'Descreva a cobrança.' }

  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1
  if (!Number.isFinite(quantity) || quantity < 1) return { error: 'Informe uma quantidade válida.' }

  const unitAmount = Number(unitAmountRaw)
  if (!unitAmountRaw || !Number.isFinite(unitAmount) || unitAmount < 0) return { error: 'Informe um valor unitário válido.' }

  const db = createAdminClient()
  const { error } = await db.from('reservation_charges').insert({
    reservation_id:   reservationId,
    category,
    description,
    quantity,
    unit_amount_brl:  Math.round(unitAmount),
    total_amount_brl: Math.round(unitAmount) * quantity,
    status:           'pending',
    created_by:       admin.id,
  })

  if (error) {
    console.error('[reservation-charges] insert failed:', error)
    return { error: 'Erro ao registrar a cobrança. Tente novamente.' }
  }

  revalidateCharges(reservationId)
  return { success: true }
}

// ── Mark paid / waive ─────────────────────────────────────────────────────────

async function setChargeStatus(chargeId: string, status: 'paid' | 'waived'): Promise<ActionState> {
  const db = createAdminClient()
  const { data: charge } = await db
    .from('reservation_charges')
    .select('id, reservation_id, status')
    .eq('id', chargeId)
    .maybeSingle()

  if (!charge) return { error: 'Cobrança não encontrada.' }
  if (charge.status !== 'pending') return { error: 'Esta cobrança já foi quitada ou dispensada.' }

  const { error } = await db
    .from('reservation_charges')
    .update({ status })
    .eq('id', chargeId)

  if (error) {
    console.error('[reservation-charges] status update failed:', error)
    return { error: 'Erro ao atualizar a cobrança. Tente novamente.' }
  }

  revalidateCharges(charge.reservation_id)
  return { success: true }
}

export async function markChargePaidAction(chargeId: string): Promise<ActionState> {
  await requireChargeSettlementAccess()
  return setChargeStatus(chargeId, 'paid')
}

export async function waiveChargeAction(chargeId: string): Promise<ActionState> {
  await requireChargeAccess()
  return setChargeStatus(chargeId, 'waived')
}
