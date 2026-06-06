// Temporary fallback data. Later this will be replaced by rooms managed from the admin/Supabase.

export interface PublicRoom {
  id: string
  name: string
  /** Badge text shown on the card image, e.g. "MAIS PROCURADA". Null = no badge. */
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

export function getFeaturedRooms(): PublicRoom[] {
  return FALLBACK_ROOMS
}
