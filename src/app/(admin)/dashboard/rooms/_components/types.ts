// Shared row types for the rooms management UI.
// Match the real database columns — do not add fields that do not exist.

export type PendingFile = {
  localId: string
  file: File
  previewUrl: string
  altText: string
  sortOrder: number
}

export type ImageRow = {
  id: string
  room_id: string
  url: string
  storage_path: string
  alt_text: string | null
  is_cover: boolean
  sort_order: number
  created_at: string
}

export type CategoryRow = {
  id: string
  name: string
  slug: string
  short_description: string | null
  is_active: boolean
  sort_order: number
}

export type RoomRow = {
  id: string
  name: string
  slug: string
  category_id: string
  short_description: string | null
  base_price_brl: number
  max_guests: number
  ocean_view: boolean
  featured: boolean
  is_active: boolean
  sort_order: number
  size_sqm: number | null
  amenities: string[]
  room_number: string | null
}
