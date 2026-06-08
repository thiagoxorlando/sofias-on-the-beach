import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { RoomsManager } from './_components/RoomsManager'
import type { CategoryRow, RoomRow, ImageRow } from './_components/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Quartos — Sofia's Admin" }

export default async function RoomsPage() {
  await requireModule('rooms')

  const db = createAdminClient()

  const [{ data: categoriesData }, { data: roomsData }, { data: imagesData }] = await Promise.all([
    db
      .from('room_categories')
      .select('id, name, slug, short_description, is_active, sort_order')
      .order('sort_order', { ascending: true }),
    db
      .from('rooms')
      .select('id, name, slug, category_id, short_description, base_price_brl, max_guests, ocean_view, featured, is_active, sort_order, size_sqm, amenities')
      .order('sort_order', { ascending: true }),
    db
      .from('room_images')
      .select('id, room_id, url, storage_path, alt_text, is_cover, sort_order, created_at')
      .order('sort_order', { ascending: true }),
  ])

  const categories: CategoryRow[] = categoriesData ?? []
  const rooms: RoomRow[] = (roomsData ?? []).map((r) => ({
    ...r,
    amenities: Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
  }))

  const imagesByRoomId: Record<string, ImageRow[]> = {}
  for (const img of (imagesData ?? []) as ImageRow[]) {
    if (!imagesByRoomId[img.room_id]) imagesByRoomId[img.room_id] = []
    imagesByRoomId[img.room_id].push(img)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] font-bold text-ocean-900">Quartos</h1>
        <p className="text-[14px] text-ocean-500 mt-1">
          Gerencie as categorias e quartos da pousada.
        </p>
      </div>
      <RoomsManager categories={categories} rooms={rooms} imagesByRoomId={imagesByRoomId} />
    </div>
  )
}
