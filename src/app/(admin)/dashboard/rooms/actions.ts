'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { toSlug } from '@/lib/utils'
import type { ImageRow } from './_components/types'

export type FormState = { error: string } | { success: true } | undefined
export type ImageFormState = { error: string } | { success: true; image: ImageRow } | undefined

export type UploadItemResult =
  | { index: number; success: true; image: ImageRow }
  | { index: number; success: false; filename: string; error: string }
export type UploadBatchResult = { results: UploadItemResult[] } | { error: string } | undefined

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
  const is_active     = formData.get('is_active') === 'on'
  const amenities_raw = str(formData, 'amenities')
  const amenities     = amenities_raw
    ? amenities_raw.split(',').map((a) => a.trim()).filter(Boolean)
    : []
  const homepage_slot = str(formData, 'homepage_slot')
  const featured      = homepage_slot !== 'none'
  const sort_order    = featured ? parseInt(homepage_slot, 10) : 0

  if (!name)                          return { error: 'Nome é obrigatório.' }
  if (!slug)                          return { error: 'Slug é obrigatório.' }
  if (!category_id)                   return { error: 'Selecione uma categoria.' }
  if (!base_price || base_price <= 0) return { error: 'Preço base deve ser maior que zero.' }
  if (!max_guests || max_guests < 1)  return { error: 'Capacidade mínima é 1 hóspede.' }

  const db = createAdminClient()
  const { data: roomData, error } = await db.from('rooms').insert({
    name, slug, category_id,
    short_description: short_desc,
    base_price_brl: base_price,
    max_guests, ocean_view,
    size_sqm: size_sqm && !isNaN(size_sqm) ? size_sqm : null,
    sort_order, featured, is_active, amenities,
  }).select('id').single()

  if (error || !roomData) {
    if (error?.code === '23505') return { error: 'Slug já em uso. Escolha outro.' }
    return { error: 'Erro ao criar quarto. Tente novamente.' }
  }

  // Upload any photos selected during room creation
  const photoFiles = (formData.getAll('photos') as File[]).filter((f) => f && f.size > 0)
  if (photoFiles.length > 0) {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const MAX = 5 * 1024 * 1024
    let coverAssigned = false

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i]
      if (!ALLOWED.includes(file.type) || file.size > MAX) continue

      const alt_text    = str(formData, `photo_alt_${i}`) || null
      const is_cover    = !coverAssigned
      const safeFilename = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
      const storagePath  = `rooms/${roomData.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeFilename}`

      const { error: uploadError } = await db.storage
        .from('room-images')
        .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })

      if (uploadError) continue

      const { data: { publicUrl } } = db.storage.from('room-images').getPublicUrl(storagePath)

      const { error: insertError } = await db
        .from('room_images')
        .insert({ room_id: roomData.id, url: publicUrl, storage_path: storagePath, alt_text, sort_order: i, is_cover })

      if (!insertError && is_cover) coverAssigned = true
    }
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
  const is_active     = formData.get('is_active') === 'on'
  const amenities_raw = str(formData, 'amenities')
  const amenities     = amenities_raw
    ? amenities_raw.split(',').map((a) => a.trim()).filter(Boolean)
    : []
  const homepage_slot = str(formData, 'homepage_slot')
  const featured      = homepage_slot !== 'none'
  const sort_order    = featured ? parseInt(homepage_slot, 10) : 0

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
      sort_order, featured, is_active, amenities,
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

// ── Room images ───────────────────────────────────────────────────────────────

export async function addImageAction(
  _prev: ImageFormState,
  formData: FormData,
): Promise<ImageFormState> {
  const room_id      = str(formData, 'room_id')
  const url          = str(formData, 'url')
  const alt_text     = str(formData, 'alt_text') || null
  const sort_order   = int(formData, 'sort_order', 0)

  if (!room_id) return { error: 'ID do quarto inválido.' }
  if (!url)     return { error: 'URL da imagem é obrigatória.' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('room_images')
    .insert({ room_id, url, storage_path: url, alt_text, sort_order, is_cover: false })
    .select('id, room_id, url, storage_path, alt_text, is_cover, sort_order, created_at')
    .single()

  if (error || !data) return { error: 'Erro ao adicionar imagem. Tente novamente.' }

  revalidatePath('/dashboard/rooms')
  return { success: true, image: data as ImageRow }
}

export async function updateImageAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id         = str(formData, 'id')
  const url        = str(formData, 'url')
  const alt_text   = str(formData, 'alt_text') || null
  const sort_order = int(formData, 'sort_order', 0)

  if (!id)  return { error: 'ID inválido.' }
  if (!url) return { error: 'URL da imagem é obrigatória.' }

  const db = createAdminClient()
  const { error } = await db
    .from('room_images')
    .update({ url, storage_path: url, alt_text, sort_order })
    .eq('id', id)

  if (error) return { error: 'Erro ao atualizar imagem.' }

  revalidatePath('/dashboard/rooms')
  return { success: true }
}

export async function setCoverImageAction(
  imageId: string,
  roomId: string,
): Promise<void> {
  const db = createAdminClient()
  await db.from('room_images').update({ is_cover: false }).eq('room_id', roomId)
  await db.from('room_images').update({ is_cover: true }).eq('id', imageId)
  revalidatePath('/dashboard/rooms')
}

export async function uploadRoomImageAction(
  _prev: ImageFormState,
  formData: FormData,
): Promise<ImageFormState> {
  const room_id    = str(formData, 'room_id')
  const alt_text   = str(formData, 'alt_text') || null
  const sort_order = int(formData, 'sort_order', 0)
  const file       = formData.get('file') as File | null

  if (!room_id)                return { error: 'ID do quarto inválido.' }
  if (!file || file.size === 0) return { error: 'Selecione uma imagem.' }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX     = 5 * 1024 * 1024

  if (!ALLOWED.includes(file.type)) return { error: 'Formato de imagem inválido. Use JPG, PNG ou WebP.' }
  if (file.size > MAX)              return { error: 'Arquivo muito grande. Máximo 5MB.' }

  const safeFilename = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const storagePath  = `rooms/${room_id}/${Date.now()}-${safeFilename}`

  const db = createAdminClient()

  // Is this the first image for the room? → auto-set as cover
  const { count } = await db
    .from('room_images')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room_id)
  const is_cover = (count ?? 0) === 0

  const { error: uploadError } = await db.storage
    .from('room-images')
    .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (uploadError) return { error: 'Erro ao enviar imagem. Tente novamente.' }

  const { data: { publicUrl } } = db.storage.from('room-images').getPublicUrl(storagePath)

  const { data, error: insertError } = await db
    .from('room_images')
    .insert({ room_id, url: publicUrl, storage_path: storagePath, alt_text, sort_order, is_cover })
    .select('id, room_id, url, storage_path, alt_text, is_cover, sort_order, created_at')
    .single()

  if (insertError || !data) {
    await db.storage.from('room-images').remove([storagePath])
    return { error: 'Erro ao salvar imagem. Tente novamente.' }
  }

  revalidatePath('/dashboard/rooms')
  return { success: true, image: data as ImageRow }
}

export async function deleteImageAction(imageId: string, storagePath: string): Promise<void> {
  const db = createAdminClient()

  // Delete from Storage only if it's a Storage-managed path (not an old external URL)
  if (storagePath && storagePath.startsWith('rooms/')) {
    await db.storage.from('room-images').remove([storagePath])
  }

  await db.from('room_images').delete().eq('id', imageId)
  revalidatePath('/dashboard/rooms')
}

export async function uploadRoomImagesAction(formData: FormData): Promise<UploadBatchResult> {
  const room_id = str(formData, 'room_id')
  if (!room_id) return { error: 'ID do quarto inválido.' }

  const files = formData.getAll('files') as File[]
  if (files.length === 0 || (files.length === 1 && files[0].size === 0)) {
    return { error: 'Selecione pelo menos uma imagem.' }
  }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX = 5 * 1024 * 1024

  const db = createAdminClient()

  const { count: existingCount } = await db
    .from('room_images')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room_id)

  let coverAssigned = (existingCount ?? 0) > 0
  const results: UploadItemResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filename = file.name

    if (!ALLOWED.includes(file.type)) {
      results.push({ index: i, success: false, filename, error: 'Formato inválido. Use JPG, PNG ou WebP.' })
      continue
    }
    if (file.size > MAX) {
      results.push({ index: i, success: false, filename, error: 'Arquivo muito grande. Máximo 5MB.' })
      continue
    }

    const alt_text   = str(formData, `alt_${i}`) || null
    const sort_order = int(formData, `sort_order_${i}`, 0)
    const is_cover   = !coverAssigned

    const safeFilename = filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
    const storagePath  = `rooms/${room_id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeFilename}`

    const { error: uploadError } = await db.storage
      .from('room-images')
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false })

    if (uploadError) {
      results.push({ index: i, success: false, filename, error: 'Erro ao enviar imagem.' })
      continue
    }

    const { data: { publicUrl } } = db.storage.from('room-images').getPublicUrl(storagePath)

    const { data, error: insertError } = await db
      .from('room_images')
      .insert({ room_id, url: publicUrl, storage_path: storagePath, alt_text, sort_order, is_cover })
      .select('id, room_id, url, storage_path, alt_text, is_cover, sort_order, created_at')
      .single()

    if (insertError || !data) {
      await db.storage.from('room-images').remove([storagePath])
      results.push({ index: i, success: false, filename, error: 'Erro ao salvar imagem.' })
      continue
    }

    if (is_cover) coverAssigned = true
    results.push({ index: i, success: true, image: data as ImageRow })
  }

  revalidatePath('/dashboard/rooms')
  return { results }
}
