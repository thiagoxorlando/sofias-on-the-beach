import { createClient } from '@/lib/supabase/server'

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
        room_categories ( name )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(6)

    if (error || !data || data.length === 0) return FALLBACK_ROOMS

    return data.map((room) => {
      const categoryName =
        room.room_categories && !Array.isArray(room.room_categories)
          ? (room.room_categories as { name: string }).name
          : null

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
        imageUrl: `/images/rooms/${room.slug}.jpg`,
        imageAlt: `${room.name} em Búzios`,
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
