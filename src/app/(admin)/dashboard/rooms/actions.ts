'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { toSlug } from '@/lib/utils'

export type FormState = { error: string } | { success: true } | undefined

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function num(formData: FormData, key: string, fallback = 0): number {
  const v = parseFloat(str(formData, key))
  return isNaN(v) ? fallback : v
}

function int(formData: FormData, key: string, fallback = 0): number {
  const v = parseInt(str(formData, key), 10)
  return isNaN(v) ? fallback : v
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = str(formData, 'name')
  const slug = str(formData, 'slug') || toSlug(name)
  const short_description = str(formData, 'short_description') || null
  const sort_order = int(formData, 'sort_order', 0)
  const is_active = formData.get('is_active') === 'on'

  if (!name) return { error: 'Nome é obrigatório.' }
  if (!slug) return { error: 'Slug é obrigatório.' }

  const db = createAdminClient()
  const { error } = await db.from('room_categories').insert({
    name, slug, short_description, sort_order, is_active,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Slug já em uso. Escolha outro.' }
    return { error: 'Erro ao criar categoria. Tente novamente.' }
  }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = str(formData, 'id')
  const name = str(formData, 'name')
  const slug = str(formData, 'slug') || toSlug(name)
  const short_description = str(formData, 'short_description') || null
  const sort_order = int(formData, 'sort_order', 0)
  const is_active = formData.get('is_active') === 'on'

  if (!id)   return { error: 'ID inválido.' }
  if (!name) return { error: 'Nome é obrigatório.' }
  if (!slug) return { error: 'Slug é obrigatório.' }

  const db = createAdminClient()
  const { error } = await db
    .from('room_categories')
    .update({ name, slug, short_description, sort_order, is_active })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Slug já em uso. Escolha outro.' }
    return { error: 'Erro ao atualizar categoria.' }
  }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function toggleCategoryActiveAction(
  id: string,
  isActive: boolean,
): Promise<void> {
  const db = createAdminClient()
  await db.from('room_categories').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/dashboard/rooms')
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export async function createRoomAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name          = str(formData, 'name')
  const slug          = str(formData, 'slug') || toSlug(name)
  const category_id   = str(formData, 'category_id')
  const short_desc    = str(formData, 'short_description') || null
  const base_price    = num(formData, 'base_price_brl')
  const max_guests    = int(formData, 'max_guests', 2)
  const ocean_view    = formData.get('ocean_view') === 'on'
  const size_sqm_raw  = str(formData, 'size_sqm')
  const size_sqm      = size_sqm_raw ? parseFloat(size_sqm_raw) : null
  const sort_order    = int(formData, 'sort_order', 0)
  const is_active     = formData.get('is_active') === 'on'
  const amenities_raw = str(formData, 'amenities')
  const amenities     = amenities_raw
    ? amenities_raw.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  if (!name)                          return { error: 'Nome é obrigatório.' }
  if (!slug)                          return { error: 'Slug é obrigatório.' }
  if (!category_id)                   return { error: 'Selecione uma categoria.' }
  if (!base_price || base_price <= 0) return { error: 'Preço base deve ser maior que zero.' }
  if (!max_guests || max_guests < 1)  return { error: 'Capacidade mínima é 1 hóspede.' }

  const db = createAdminClient()
  const { error } = await db.from('rooms').insert({
    name, slug, category_id,
    short_description: short_desc,
    base_price_brl: base_price,
    max_guests, ocean_view,
    size_sqm: size_sqm && !isNaN(size_sqm) ? size_sqm : null,
    sort_order, is_active, amenities,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Slug já em uso. Escolha outro.' }
    return { error: 'Erro ao criar quarto. Tente novamente.' }
  }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function updateRoomAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id            = str(formData, 'id')
  const name          = str(formData, 'name')
  const slug          = str(formData, 'slug') || toSlug(name)
  const category_id   = str(formData, 'category_id')
  const short_desc    = str(formData, 'short_description') || null
  const base_price    = num(formData, 'base_price_brl')
  const max_guests    = int(formData, 'max_guests', 2)
  const ocean_view    = formData.get('ocean_view') === 'on'
  const size_sqm_raw  = str(formData, 'size_sqm')
  const size_sqm      = size_sqm_raw ? parseFloat(size_sqm_raw) : null
  const sort_order    = int(formData, 'sort_order', 0)
  const is_active     = formData.get('is_active') === 'on'
  const amenities_raw = str(formData, 'amenities')
  const amenities     = amenities_raw
    ? amenities_raw.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  if (!id)                            return { error: 'ID inválido.' }
  if (!name)                          return { error: 'Nome é obrigatório.' }
  if (!slug)                          return { error: 'Slug é obrigatório.' }
  if (!category_id)                   return { error: 'Selecione uma categoria.' }
  if (!base_price || base_price <= 0) return { error: 'Preço base deve ser maior que zero.' }
  if (!max_guests || max_guests < 1)  return { error: 'Capacidade mínima é 1 hóspede.' }

  const db = createAdminClient()
  const { error } = await db
    .from('rooms')
    .update({
      name, slug, category_id,
      short_description: short_desc,
      base_price_brl: base_price,
      max_guests, ocean_view,
      size_sqm: size_sqm && !isNaN(size_sqm) ? size_sqm : null,
      sort_order, is_active, amenities,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Slug já em uso. Escolha outro.' }
    return { error: 'Erro ao atualizar quarto.' }
  }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function toggleRoomActiveAction(
  id: string,
  isActive: boolean,
): Promise<void> {
  const db = createAdminClient()
  await db.from('rooms').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/dashboard/rooms')
}
