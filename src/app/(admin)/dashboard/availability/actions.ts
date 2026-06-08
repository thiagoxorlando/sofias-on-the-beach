'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { nextDay } from '@/lib/pricing'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function datesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  let cur = startDate
  while (cur < endDate) {
    dates.push(cur)
    cur = nextDay(cur)
  }
  return dates
}

// Best-effort audit logging — `audit_logs.action` is constrained to
// 'INSERT' | 'UPDATE' | 'DELETE' by a CHECK constraint, so the more
// descriptive action name (e.g. "manual_block_created") travels inside the
// JSON payload as `action_type`. A logging failure must never fail the
// underlying availability/rate change, so errors are only logged to console.
async function logAudit(
  db: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  tableName: string,
  recordId: string,
  data: Record<string, unknown>,
  field: 'new_data' | 'old_data',
) {
  try {
    const { error } = await db.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action,
      admin_user_id: adminId,
      [field]: data,
    })
    if (error) console.error(`[availability] audit log insert failed (${tableName}):`, error)
  } catch (err) {
    console.error(`[availability] audit log threw (${tableName}):`, err)
  }
}

function validateRange(roomId: string, startDate: string, endDate: string): string | null {
  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!roomId) return 'Selecione um quarto.'
  if (!startDate || !ISO.test(startDate) || !endDate || !ISO.test(endDate)) return 'Informe o período.'
  if (startDate >= endDate) return 'A data final deve ser depois da data inicial.'
  return null
}

// ── Mark a date range as manually unavailable ────────────────────────────────
// Range is [start_date, end_date) — checkout-style, matching the guest booking
// flow's convention. Manual blocks are stored with reservation_id = null so
// they stay distinguishable from reservation-originated blocks. Refuses to
// touch any date that already belongs to a reservation.

export async function setManualBlockRangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('availability')
  const roomId = str(formData, 'room_id')
  const startDate = str(formData, 'start_date')
  const endDate = str(formData, 'end_date')
  const reasonPreset = str(formData, 'reason_preset')
  const reasonCustom = str(formData, 'reason_custom')
  const reason = reasonPreset === 'custom' ? reasonCustom : reasonPreset

  const rangeError = validateRange(roomId, startDate, endDate)
  if (rangeError) return { error: rangeError }
  if (!reason) return { error: 'Informe o motivo do bloqueio.' }

  const dates = datesInRange(startDate, endDate)
  const db = createAdminClient()

  const { data: existing, error: fetchError } = await db
    .from('room_availability')
    .select('date, reservation_id')
    .eq('room_id', roomId)
    .in('date', dates)

  if (fetchError) {
    console.error('[availability] failed to read existing rows before block:', fetchError)
    return { error: 'Não foi possível bloquear o período. Verifique os dados e tente novamente.' }
  }

  const reservedDates = (existing ?? []).filter((row) => row.reservation_id !== null)
  if (reservedDates.length > 0) {
    return { error: 'Esse período contém reserva. Cancele a reserva para liberar essas datas.' }
  }

  // Never duplicate rows — the table has a UNIQUE (room_id, date) constraint.
  // Dates that are already manually blocked are skipped rather than
  // overwritten, so re-blocking never silently changes an existing reason.
  const alreadyBlocked = new Set((existing ?? []).map((row) => row.date))
  const toInsert = dates.filter((date) => !alreadyBlocked.has(date))

  if (toInsert.length === 0) {
    return { error: 'Esse período já possui bloqueios manuais.' }
  }

  const { error } = await db.from('room_availability').insert(
    toInsert.map((date) => ({
      room_id: roomId,
      date,
      is_available: false,
      blocked_reason: reason,
      reservation_id: null,
    })),
  )

  if (error) {
    console.error('[availability] manual block insert failed:', error)
    return { error: 'Não foi possível bloquear o período. Verifique os dados e tente novamente.' }
  }

  await logAudit(
    db, admin.id, 'INSERT', 'room_availability', roomId,
    { action_type: 'manual_block_created', dates: toInsert, reason },
    'new_data',
  )

  revalidatePath('/dashboard/availability')
  return { success: true }
}

// ── Mark a date range as available again ─────────────────────────────────────
// Removes ONLY manual blocks (reservation_id = null) within the range. Never
// touches reservation-originated blocks — returns a friendly error instead.

export async function clearManualBlockRangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('availability')
  const roomId = str(formData, 'room_id')
  const startDate = str(formData, 'start_date')
  const endDate = str(formData, 'end_date')

  const rangeError = validateRange(roomId, startDate, endDate)
  if (rangeError) return { error: rangeError }

  const dates = datesInRange(startDate, endDate)
  const db = createAdminClient()

  const { data: existing, error: fetchError } = await db
    .from('room_availability')
    .select('id, date, reservation_id, blocked_reason')
    .eq('room_id', roomId)
    .in('date', dates)

  if (fetchError) {
    console.error('[availability] failed to read existing rows before unblock:', fetchError)
    return { error: 'Não foi possível liberar o período. Verifique os dados e tente novamente.' }
  }

  const reservedDates = (existing ?? []).filter((row) => row.reservation_id !== null)
  if (reservedDates.length > 0) {
    return { error: 'Esse período contém reserva. Cancele a reserva para liberar essas datas.' }
  }

  const manualRows = (existing ?? []).filter((row) => row.reservation_id === null)
  if (manualRows.length === 0) {
    return { error: 'Não há bloqueios manuais nesse período.' }
  }

  const { error } = await db
    .from('room_availability')
    .delete()
    .in('id', manualRows.map((row) => row.id))

  if (error) {
    console.error('[availability] manual block delete failed:', error)
    return { error: 'Não foi possível liberar o período. Verifique os dados e tente novamente.' }
  }

  await logAudit(
    db, admin.id, 'DELETE', 'room_availability', roomId,
    { action_type: 'manual_block_removed', dates: manualRows.map((row) => row.date) },
    'old_data',
  )

  revalidatePath('/dashboard/availability')
  return { success: true }
}

// ── Set a custom rate (and optional minimum stay) for a date range ───────────
// Replaces any overlapping room_rates rows for the room with a single new row
// — predictable "last write wins" semantics, avoids ambiguous overlap merging.

export async function setCustomRateRangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('availability')
  const roomId = str(formData, 'room_id')
  const startDate = str(formData, 'start_date')
  const endDate = str(formData, 'end_date')
  const name = str(formData, 'name') || 'Tarifa personalizada'
  const priceRaw = str(formData, 'price_per_night')
  const minNightsRaw = str(formData, 'min_nights')

  const rangeError = validateRange(roomId, startDate, endDate)
  if (rangeError) return { error: rangeError }

  const price = Number(priceRaw)
  if (!priceRaw || !Number.isFinite(price) || price <= 0) return { error: 'Informe um preço válido.' }

  const minNights = minNightsRaw ? parseInt(minNightsRaw, 10) : 1
  if (!Number.isFinite(minNights) || minNights < 1) return { error: 'Informe um número de noites mínimo válido.' }

  const db = createAdminClient()

  const { data: overlapping } = await db
    .from('room_rates')
    .select('id')
    .eq('room_id', roomId)
    .lt('start_date', endDate)
    .gt('end_date', startDate)

  if (overlapping && overlapping.length > 0) {
    const { error: deleteError } = await db
      .from('room_rates')
      .delete()
      .in('id', overlapping.map((row) => row.id))
    if (deleteError) {
      console.error('[availability] failed to clear overlapping rates before set:', deleteError)
      return { error: 'Erro ao atualizar a tarifa. Tente novamente.' }
    }
  }

  const { data: created, error } = await db
    .from('room_rates')
    .insert({
      room_id: roomId,
      name,
      start_date: startDate,
      end_date: endDate,
      price_per_night: price,
      min_nights: minNights,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[availability] custom rate insert failed:', error)
    return { error: 'Erro ao salvar a tarifa. Tente novamente.' }
  }

  await logAudit(
    db, admin.id, 'INSERT', 'room_rates', created.id,
    { action_type: 'custom_rate_set', room_id: roomId, start_date: startDate, end_date: endDate, price_per_night: price, min_nights: minNights, name },
    'new_data',
  )

  revalidatePath('/dashboard/availability')
  return { success: true }
}

// ── Clear custom rate(s) for a date range ────────────────────────────────────
// Removes any room_rates rows overlapping the range entirely (no partial
// trimming/splitting) — predictable, simple, appropriate for a boutique pousada.

export async function clearCustomRateRangeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('availability')
  const roomId = str(formData, 'room_id')
  const startDate = str(formData, 'start_date')
  const endDate = str(formData, 'end_date')

  const rangeError = validateRange(roomId, startDate, endDate)
  if (rangeError) return { error: rangeError }

  const db = createAdminClient()

  const { data: overlapping } = await db
    .from('room_rates')
    .select('id, name, start_date, end_date, price_per_night, min_nights')
    .eq('room_id', roomId)
    .lt('start_date', endDate)
    .gt('end_date', startDate)

  if (!overlapping || overlapping.length === 0) {
    return { error: 'Não há tarifas personalizadas nesse período.' }
  }

  const { error } = await db
    .from('room_rates')
    .delete()
    .in('id', overlapping.map((row) => row.id))

  if (error) {
    console.error('[availability] custom rate delete failed:', error)
    return { error: 'Erro ao remover a tarifa. Tente novamente.' }
  }

  await logAudit(
    db, admin.id, 'DELETE', 'room_rates', roomId,
    { action_type: 'custom_rate_cleared', cleared: overlapping },
    'old_data',
  )

  revalidatePath('/dashboard/availability')
  return { success: true }
}
