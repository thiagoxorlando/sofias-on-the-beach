import { createClient } from '@/lib/supabase/server'

// ── All-rooms type (used by /quartos listing page) ────────────────────────────

export interface PublicRoomFull {
  id: string
  slug: string
  name: string
  categoryName: string | null
  description: string | null
  imageUrl: string
  imageAlt: string
  priceFrom: number
  maxGuests: number
  sizeSqm: number | null
  oceanView: boolean
  amenities: string[]
}

export async function getAllActiveRooms(): Promise<PublicRoomFull[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        slug,
        short_description,
        base_price_brl,
        max_guests,
        ocean_view,
        size_sqm,
        amenities,
        room_categories ( name ),
        room_images ( url, alt_text, is_cover, sort_order )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error || !data) return []

    type Img = { url: string; alt_text: string | null; is_cover: boolean; sort_order: number }

    return data.map((room) => {
      const catName =
        room.room_categories && !Array.isArray(room.room_categories)
          ? (room.room_categories as { name: string }).name
          : null

      const imgs = (Array.isArray(room.room_images) ? room.room_images : []) as Img[]
      const sortedImgs = [...imgs].sort((a, b) => a.sort_order - b.sort_order)
      const cover = sortedImgs.find((i) => i.is_cover) ?? sortedImgs[0] ?? null

      return {
        id: room.id,
        slug: room.slug,
        name: room.name,
        categoryName: catName,
        description: room.short_description ?? null,
        imageUrl: cover?.url ?? `/images/rooms/${room.slug}.jpg`,
        imageAlt: cover?.alt_text ?? `${room.name} em Búzios`,
        priceFrom: room.base_price_brl,
        maxGuests: room.max_guests,
        sizeSqm: room.size_sqm ?? null,
        oceanView: room.ocean_view,
        amenities: Array.isArray(room.amenities) ? (room.amenities as string[]) : [],
      }
    })
  } catch {
    return []
  }
}

// ── Featured-rooms type (used by homepage RoomsPreview) ───────────────────────

export interface PublicRoom {
  id: string
  name: string
  categoryLabel: string | null
  description: string
  imageUrl: string
  imageAlt: string
  priceFrom: number
  priceSuffix: string
  features: string[]
  featured: boolean
  ctaLabel: string
}

const FALLBACK_ROOMS: PublicRoom[] = [
  {
    id: 'suite-vista-mar',
    name: 'Suíte com Vista para o Mar',
    categoryLabel: 'MAIS PROCURADA',
    description:
      'Desperte com o mar aos seus pés. Suíte sofisticada com vista panorâmica e todo o conforto que você merece.',
    imageUrl: '/images/rooms/suite-vista-mar.jpg',
    imageAlt: 'Suíte com vista panorâmica para o oceano em Búzios',
    priceFrom: 890,
    priceSuffix: '/ noite',
    features: ['Vista para o mar', 'Ar-condicionado', 'Smart TV', 'Wi-Fi'],
    featured: true,
    ctaLabel: 'VER SUÍTE',
  },
  {
    id: 'suite-superior',
    name: 'Quarto Superior',
    categoryLabel: null,
    description:
      'Ambiente acolhedor com detalhes que remetem ao mar e à brisa de Búzios.',
    imageUrl: '/images/rooms/suite-superior.jpg',
    imageAlt: 'Quarto Superior com decoração elegante e luz natural',
    priceFrom: 590,
    priceSuffix: '/ noite',
    features: ['Ar-condicionado', 'Smart TV', 'Wi-Fi', 'Frigobar'],
    featured: false,
    ctaLabel: 'VER QUARTO',
  },
  {
    id: 'quarto-familia',
    name: 'Quarto Família',
    categoryLabel: null,
    description:
      'Ideal para famílias ou grupos. Espaço amplo e confortável para momentos inesquecíveis.',
    imageUrl: '/images/rooms/quarto-familia.jpg',
    imageAlt: 'Quarto Família espaçoso para famílias em Búzios',
    priceFrom: 790,
    priceSuffix: '/ noite',
    features: ['Até 4 hóspedes', 'Ar-condicionado', 'Wi-Fi', 'Frigobar'],
    featured: false,
    ctaLabel: 'VER QUARTO',
  },
]

export async function getFeaturedRooms(): Promise<PublicRoom[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        slug,
        short_description,
        base_price_brl,
        ocean_view,
        amenities,
        sort_order,
        room_categories ( name ),
        room_images ( url, alt_text, is_cover, sort_order )
      `)
      .eq('is_active', true)
      .eq('featured', true)
      .order('sort_order', { ascending: true })
      .limit(6)

    if (error || !data || data.length === 0) return FALLBACK_ROOMS

    type RoomImageJoin = { url: string; alt_text: string | null; is_cover: boolean; sort_order: number }

    return data.map((room) => {
      const categoryName =
        room.room_categories && !Array.isArray(room.room_categories)
          ? (room.room_categories as { name: string }).name
          : null

      const images = (Array.isArray(room.room_images) ? room.room_images : []) as RoomImageJoin[]
      const sortedImgs = images.sort((a, b) => a.sort_order - b.sort_order)
      const coverImg = sortedImgs.find((img) => img.is_cover) ?? sortedImgs[0] ?? null

      const amenities = Array.isArray(room.amenities)
        ? (room.amenities as string[]).slice(0, 4)
        : []

      if (room.ocean_view && !amenities.includes('Vista para o mar')) {
        amenities.unshift('Vista para o mar')
      }

      return {
        id: room.slug,
        name: room.name,
        categoryLabel: categoryName?.toUpperCase() ?? null,
        description: room.short_description ?? '',
        imageUrl: coverImg?.url ?? `/images/rooms/${room.slug}.jpg`,
        imageAlt: coverImg?.alt_text ?? `${room.name} em Búzios`,
        priceFrom: room.base_price_brl,
        priceSuffix: '/ noite',
        features: amenities.slice(0, 4),
        featured: room.ocean_view,
        ctaLabel: room.name.toLowerCase().includes('suíte') ? 'VER SUÍTE' : 'VER QUARTO',
      }
    })
  } catch {
    return FALLBACK_ROOMS
  }
}
