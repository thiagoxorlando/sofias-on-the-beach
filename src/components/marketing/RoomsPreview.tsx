const rooms = [
  {
    id: 'suite-vista-mar',
    category: 'Suíte',
    name: 'Suíte Vista Mar',
    guests: 2,
    highlight: 'Vista direta para o oceano',
    tags: ['Vista mar', 'Varanda', 'Frigobar'],
    price: 'R$ 890',
    badge: 'Mais popular',
    gradientFrom: 'from-ocean-300',
    gradientTo: 'to-ocean-600',
  },
  {
    id: 'quarto-superior',
    category: 'Superior',
    name: 'Quarto Superior',
    guests: 2,
    highlight: 'Conforto e elegância',
    tags: ['Varanda', 'Ar-condicionado', 'Frigobar'],
    price: 'R$ 620',
    badge: null,
    gradientFrom: 'from-ocean-200',
    gradientTo: 'to-ocean-500',
  },
  {
    id: 'quarto-familia',
    category: 'Família',
    name: 'Quarto Família',
    guests: 4,
    highlight: 'Espaçoso, ideal para famílias',
    tags: ['2 ambientes', 'Sala', 'Ar-condicionado'],
    price: 'R$ 750',
    badge: null,
    gradientFrom: 'from-sand-200',
    gradientTo: 'to-ocean-400',
  },
]

export function RoomsPreview() {
  return (
    <section className="bg-background py-20 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-bold text-ocean-500 uppercase tracking-widest mb-3">
              Acomodações
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Nossos quartos
            </h2>
            <div className="h-0.5 w-12 bg-accent rounded-full mt-4" />
          </div>
          <a
            href="/quartos"
            className="text-sm font-semibold text-primary hover:text-ocean-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            Ver todos os quartos
            <ArrowIcon className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image placeholder */}
              <div className={`relative h-52 bg-gradient-to-br ${room.gradientFrom} ${room.gradientTo} overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                {room.badge && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {room.badge}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/50 text-xs font-medium tracking-wide">
                    [foto do quarto]
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="p-6">
                <span className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest">
                  {room.category}
                </span>
                <h3 className="font-serif text-xl font-semibold text-card-foreground mt-1 mb-1">
                  {room.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {room.highlight}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {room.guests} hóspedes
                  </span>
                  {room.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex items-end justify-between pt-4 border-t border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">
                      a partir de
                    </span>
                    <div className="font-serif text-2xl font-bold text-ocean-600 leading-none">
                      {room.price}
                      <span className="font-sans text-xs font-normal text-muted-foreground ml-1">
                        /noite
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/quartos`}
                    className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ocean-700 transition-colors shadow-sm"
                  >
                    Ver quarto
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
