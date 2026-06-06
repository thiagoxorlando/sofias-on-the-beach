// Shared row types for the rooms management UI.
// Match the real database columns — do not add fields that do not exist.

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
}
