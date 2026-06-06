import Image from 'next/image'

const rooms = {
  featured: {
    id: 'suite-vista-mar',
    category: 'Suíte',
    name: 'Suíte Vista Mar',
    description: 'A suíte mais especial da pousada. Vista direta para o oceano, varanda privativa, decoração exclusiva e acesso imediato à beira-mar.',
    details: ['Vista para o oceano', 'Varanda privativa', '2 hóspedes'],
    price: 890,
    image: '/images/rooms/suite-vista-mar.jpg',
    imageAlt: 'Suíte Vista Mar com varanda e vista direta para o oceano em Búzios',
  },
  secondary: [
    {
      id: 'suite-superior',
      category: 'Suíte',
      name: 'Suíte Superior',
      description: 'Ampla e elegante, com área de estar, acabamento premium e frigobar.',
      details: ['Área de estar', '2 hóspedes', 'Frigobar'],
      price: 720,
      image: '/images/rooms/suite-superior.jpg',
      imageAlt: 'Suíte Superior com cama de casal e janela para o mar',
    },
    {
      id: 'quarto-familia',
      category: 'Familiar',
      name: 'Quarto Família',
      description: 'Espaçoso, com dois ambientes privativos, ideal para famílias.',
      details: ['2 ambientes', '4 hóspedes', 'Ar-condicionado'],
      price: 980,
      image: '/images/rooms/quarto-familia.jpg',
      imageAlt: 'Quarto Família espaçoso com múltiplas camas e parede azul',
    },
  ],
}

export function RoomsPreview() {
  return (
    <section className="bg-ocean-50/40 py-20 px-6 md:px-10 border-y border-ocean-100">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-[0.28em] mb-3">
              Acomodações
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Quartos e suítes
            </h2>
          </div>
          <a
            href="/quartos"
            className="text-sm font-semibold text-ocean-700 hover:text-ocean-900 transition-colors flex items-center gap-1.5 shrink-0"
          >
            Ver todas as acomodações
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Editorial grid: 1 featured large + 2 secondary stacked */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

          {/* Featured — 3 cols */}
          <div className="md:col-span-3 bg-white rounded-3xl overflow-hidden shadow-sm border border-ocean-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-72 md:h-[340px] overflow-hidden">
              <Image
                src={rooms.featured.image}
                alt={rooms.featured.imageAlt}
                fill
                className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              {/* Popular badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-white/92 backdrop-blur-sm text-ocean-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-ocean-100 shadow-sm">
                  Mais popular
                </span>
              </div>
              {/* Subtle bottom gradient for card readability */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            <div className="p-6 md:p-8">
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-1">
                {rooms.featured.category}
              </p>
              <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
                {rooms.featured.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {rooms.featured.description}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
                {rooms.featured.details.map((d) => (
                  <span key={d} className="text-xs text-foreground/50">· {d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-ocean-100">
                <div>
                  <span className="text-xs text-muted-foreground">A partir de </span>
                  <span className="font-serif text-2xl font-bold text-foreground">
                    R$ {rooms.featured.price}
                  </span>
                  <span className="text-xs text-muted-foreground">/noite</span>
                </div>
                <a
                  href="/quartos"
                  className="bg-ocean-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ocean-800 transition-colors shadow-sm"
                >
                  Ver quarto
                </a>
              </div>
            </div>
          </div>

          {/* Secondary rooms — 2 cols, stacked */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {rooms.secondary.map((room) => (
              <div
                key={room.id}
                className="flex-1 bg-white rounded-3xl overflow-hidden shadow-sm border border-ocean-100 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={room.image}
                    alt={room.imageAlt}
                    fill
                    className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-1">
                    {room.category}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-1.5">
                    {room.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-ocean-100">
                    <div>
                      <span className="text-xs text-muted-foreground">A partir de </span>
                      <span className="font-serif text-lg font-bold text-foreground">
                        R$ {room.price}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/noite</span>
                    </div>
                    <a
                      href="/quartos"
                      className="text-sm font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
                    >
                      Ver →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
