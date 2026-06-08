'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { nextDay } from '@/lib/pricing'

export type ActionState = { error: string } | { success: true } | undefined

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const STATUSES = ['open', 'in_progress', 'fixed'] as const
type Priority = typeof PRIORITIES[number]
type Status = typeof STATUSES[number]

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

type Db = ReturnType<typeof createAdminClient>

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value)
}

function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value)
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

// Best-effort audit logging — mirrors the pattern in availability/actions.ts.
// `audit_logs.action` is constrained to 'INSERT' | 'UPDATE' | 'DELETE', so the
// descriptive event name travels inside the JSON payload as `action_type`. A
// logging failure must never break the underlying maintenance action.
async function logAudit(
  db: Db,
  adminId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string,
  data: Record<string, unknown>,
  field: 'new_data' | 'old_data',
) {
  try {
    const { error } = await db.from('audit_logs').insert({
      table_name: 'maintenance_tickets',
      record_id: recordId,
      action,
      admin_user_id: adminId,
      [field]: data,
    })
    if (error) console.error('[maintenance] audit log insert failed:', error)
  } catch (err) {
    console.error('[maintenance] audit log threw:', err)
  }
}

function revalidateMaintenance() {
  revalidatePath('/dashboard/maintenance')
}

// ── Photo upload helper ───────────────────────────────────────────────────────
// Uploads valid files to the private maintenance-photos bucket and returns the
// storage paths. Invalid/oversized files are skipped silently — the ticket
// itself must never fail just because one photo didn't make it.

async function uploadTicketPhotos(db: Db, ticketId: string, files: File[]): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    if (file.size === 0) continue
    if (!ALLOWED_PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_SIZE) continue

    const safeFilename = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
    const storagePath = `tickets/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeFilename}`

    const { error } = await db.storage
      .from('maintenance-photos')
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })

    if (!error) paths.push(storagePath)
  }
  return paths
}

// ── Room blocking helpers ─────────────────────────────────────────────────────
// Range is [start_date, end_date) — checkout-style, matching the booking flow
// and the availability module's manual-block convention.

function validateBlockRange(roomId: string, startDate: string, endDate: string): string | null {
  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!roomId) return 'Selecione um quarto para bloquear.'
  if (!startDate || !ISO.test(startDate) || !endDate || !ISO.test(endDate)) return 'Informe o período de bloqueio.'
  if (startDate >= endDate) return 'A data final deve ser depois da data inicial.'
  return null
}

// Inserts manual blocks tagged with this ticket's id. Refuses to overwrite any
// existing reservation or manual block in the range — returns a friendly error
// string on conflict (caller is responsible for rolling back the ticket).
//
// `blocked_reason` is constrained to ('reservation' | 'maintenance' |
// 'owner_use' | 'channel') by room_availability_reason_check, so it can't hold
// the free-text "Manutenção: {title}" the spec describes — the new
// maintenance_ticket_id column is the traceability link back to the ticket
// (and its title) instead, which is exactly why it was added.
async function blockRoomForTicket(
  db: Db,
  roomId: string,
  ticketId: string,
  startDate: string,
  endDate: string,
): Promise<string | null> {
  const dates = datesInRange(startDate, endDate)

  const { data: existing, error: fetchError } = await db
    .from('room_availability')
    .select('date')
    .eq('room_id', roomId)
    .in('date', dates)

  if (fetchError) {
    console.error('[maintenance] failed to read existing availability before block:', fetchError)
    return 'Não foi possível bloquear o período. Tente novamente.'
  }
  if ((existing ?? []).length > 0) {
    return 'O período selecionado já contém reservas ou bloqueios. Escolha outras datas.'
  }

  const { error } = await db.from('room_availability').insert(
    dates.map((date) => ({
      room_id: roomId,
      date,
      is_available: false,
      blocked_reason: 'maintenance',
      reservation_id: null,
      maintenance_ticket_id: ticketId,
    })),
  )

  if (error) {
    console.error('[maintenance] block insert failed:', error)
    return 'Não foi possível bloquear o período. Tente novamente.'
  }

  return null
}

// Removes ONLY the manual blocks created by this ticket (maintenance_ticket_id
// match). Reservation blocks and unrelated manual blocks are never touched.
async function unblockRoomForTicket(db: Db, ticketId: string) {
  await db.from('room_availability').delete().eq('maintenance_ticket_id', ticketId)
}

// ── Create ticket ─────────────────────────────────────────────────────────────

export async function createMaintenanceTicketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('maintenance')

  const roomId = str(formData, 'room_id') || null
  const title = str(formData, 'title')
  const description = str(formData, 'description') || null
  const priority = str(formData, 'priority')
  const assignedTo = str(formData, 'assigned_to') || null
  const blocksRoom = formData.get('blocks_room') === 'on'
  const startDate = str(formData, 'blocked_start_date')
  const endDate = str(formData, 'blocked_end_date')
  const files = (formData.getAll('photos') as File[]).filter((f) => f.size > 0)

  if (!title) return { error: 'Informe um título para o chamado.' }
  if (!isPriority(priority)) return { error: 'Selecione uma prioridade válida.' }
  if (blocksRoom && !roomId) return { error: 'Selecione um quarto para poder bloqueá-lo.' }

  let rangeError: string | null = null
  if (blocksRoom) rangeError = validateBlockRange(roomId ?? '', startDate, endDate)
  if (rangeError) return { error: rangeError }

  const db = createAdminClient()

  const { data: ticket, error: insertError } = await db
    .from('maintenance_tickets')
    .insert({
      room_id: roomId,
      title,
      description,
      priority,
      status: 'open',
      blocks_room: blocksRoom,
      blocked_start_date: blocksRoom ? startDate : null,
      blocked_end_date: blocksRoom ? endDate : null,
      reported_by: admin.id,
      assigned_to: assignedTo,
    })
    .select('id')
    .single()

  if (insertError || !ticket) {
    console.error('[maintenance] ticket insert failed:', insertError)
    return { error: 'Erro ao criar o chamado. Tente novamente.' }
  }

  // Block the room before uploading photos — if blocking fails on a date
  // conflict, we remove the ticket immediately rather than leave an
  // inconsistent "blocks_room = true" record with no actual block.
  if (blocksRoom && roomId) {
    const blockError = await blockRoomForTicket(db, roomId, ticket.id, startDate, endDate)
    if (blockError) {
      await db.from('maintenance_tickets').delete().eq('id', ticket.id)
      return { error: blockError }
    }
  }

  let photoPaths: string[] = []
  if (files.length > 0) {
    photoPaths = await uploadTicketPhotos(db, ticket.id, files)
    if (photoPaths.length > 0) {
      await db.from('maintenance_tickets').update({ photo_paths: photoPaths }).eq('id', ticket.id)
    }
  }

  await logAudit(db, admin.id, 'INSERT', ticket.id, {
    action_type: 'maintenance_ticket_created',
    title, priority, room_id: roomId, blocks_room: blocksRoom,
    blocked_start_date: blocksRoom ? startDate : null,
    blocked_end_date: blocksRoom ? endDate : null,
  }, 'new_data')

  if (blocksRoom) {
    await logAudit(db, admin.id, 'INSERT', ticket.id, {
      action_type: 'maintenance_room_blocked',
      room_id: roomId, start_date: startDate, end_date: endDate,
    }, 'new_data')
  }

  revalidateMaintenance()
  if (roomId) revalidatePath('/dashboard/availability')
  return { success: true }
}

// ── Update ticket details (title, description, priority, assignment) ─────────

export async function updateMaintenanceTicketAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('maintenance')

  const id = str(formData, 'id')
  const title = str(formData, 'title')
  const description = str(formData, 'description') || null
  const priority = str(formData, 'priority')
  const assignedTo = str(formData, 'assigned_to') || null
  const files = (formData.getAll('photos') as File[]).filter((f) => f.size > 0)

  if (!id) return { error: 'Chamado inválido.' }
  if (!title) return { error: 'Informe um título para o chamado.' }
  if (!isPriority(priority)) return { error: 'Selecione uma prioridade válida.' }

  const db = createAdminClient()
  const { data: existing } = await db
    .from('maintenance_tickets')
    .select('id, photo_paths')
    .eq('id', id)
    .maybeSingle()

  if (!existing) return { error: 'Chamado não encontrado.' }

  let photoPaths = existing.photo_paths ?? []
  if (files.length > 0) {
    const newPaths = await uploadTicketPhotos(db, id, files)
    photoPaths = [...photoPaths, ...newPaths]
  }

  const { error } = await db
    .from('maintenance_tickets')
    .update({
      title,
      description,
      priority,
      assigned_to: assignedTo,
      photo_paths: photoPaths,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: 'Erro ao atualizar o chamado. Tente novamente.' }

  await logAudit(db, admin.id, 'UPDATE', id, {
    action_type: 'maintenance_ticket_updated', title, priority, assigned_to: assignedTo,
  }, 'new_data')

  revalidateMaintenance()
  return { success: true }
}

// ── Update status (open / in_progress / fixed) ────────────────────────────────
// Marking "fixed" sets resolved_at and lifts only this ticket's own room
// blocks — reservation blocks and unrelated manual blocks are never touched.

export async function updateMaintenanceStatusAction(ticketId: string, status: string): Promise<ActionState> {
  const admin = await requireModule('maintenance')

  if (!ticketId) return { error: 'Chamado inválido.' }
  if (!isStatus(status)) return { error: 'Status inválido.' }

  const db = createAdminClient()
  const { data: ticket } = await db
    .from('maintenance_tickets')
    .select('id, status, room_id, blocks_room')
    .eq('id', ticketId)
    .maybeSingle()

  if (!ticket) return { error: 'Chamado não encontrado.' }
  if (ticket.status === status) return { error: 'O chamado já está nesse status.' }

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'fixed') update.resolved_at = new Date().toISOString()
  if (status !== 'fixed') update.resolved_at = null

  const { error } = await db.from('maintenance_tickets').update(update).eq('id', ticketId)
  if (error) return { error: 'Erro ao atualizar o status do chamado. Tente novamente.' }

  if (status === 'fixed' && ticket.blocks_room) {
    await unblockRoomForTicket(db, ticketId)
    if (ticket.room_id) revalidatePath('/dashboard/availability')
  }

  await logAudit(db, admin.id, 'UPDATE', ticketId, {
    action_type: 'maintenance_status_changed', from: ticket.status, to: status,
  }, 'new_data')

  if (status === 'fixed') {
    await logAudit(db, admin.id, 'UPDATE', ticketId, { action_type: 'maintenance_ticket_resolved' }, 'new_data')
  }

  revalidateMaintenance()
  return { success: true }
}

// ── Photo signed URL (private bucket) ─────────────────────────────────────────
// Mints a short-lived signed URL on demand — never cached, mirrors
// getReceiptSignedUrlAction in payments/actions.ts.

export async function getMaintenancePhotoSignedUrlAction(photoPath: string): Promise<{ url: string } | { error: string }> {
  await requireModule('maintenance')
  if (!photoPath) return { error: 'Foto não encontrada.' }

  const db = createAdminClient()
  const { data, error } = await db.storage
    .from('maintenance-photos')
    .createSignedUrl(photoPath, 60 * 5)

  if (error || !data?.signedUrl) {
    console.error('[maintenance] failed to sign photo url:', error)
    return { error: 'Erro ao abrir a foto. Tente novamente.' }
  }

  return { url: data.signedUrl }
}

// ── Delete a single photo ─────────────────────────────────────────────────────

export async function deleteMaintenancePhotoAction(ticketId: string, photoPath: string): Promise<ActionState> {
  await requireModule('maintenance')
  if (!ticketId || !photoPath) return { error: 'Foto inválida.' }

  const db = createAdminClient()
  const { data: ticket } = await db
    .from('maintenance_tickets')
    .select('id, photo_paths')
    .eq('id', ticketId)
    .maybeSingle()

  if (!ticket) return { error: 'Chamado não encontrado.' }

  const remaining = (ticket.photo_paths ?? []).filter((p: string) => p !== photoPath)

  const { error } = await db
    .from('maintenance_tickets')
    .update({ photo_paths: remaining })
    .eq('id', ticketId)

  if (error) return { error: 'Erro ao remover a foto. Tente novamente.' }

  await db.storage.from('maintenance-photos').remove([photoPath])

  revalidateMaintenance()
  return { success: true }
}
