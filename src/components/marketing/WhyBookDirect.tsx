import Image from 'next/image'

const features = [
  {
    id: 'vista',
    icon: <WaveIcon />,
    label: 'Vista privilegiada',
    text: 'Acorde com o oceano como cenário todos os dias.',
  },
  {
    id: 'experiencias',
    icon: <StarIcon />,
    label: 'Experiências autênticas',
    text: 'O melhor de Búzios aos seus pés, curado com cuidado.',
  },
  {
    id: 'atendimento',
    icon: <ServiceBellIcon />,
    label: 'Atendimento personalizado',
    text: 'Cuidado em cada detalhe da sua estadia à beira-mar.',
  },
  {
    id: 'tarifa',
    icon: <TagIcon />,
    label: 'Melhor tarifa direta',
    text: 'Reserve direto e garanta o menor preço disponível.',
  },
]

export function WhyBookDirect() {
  return (
    <section className="bg-white py-20 px-6 md:px-10 border-b border-ocean-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-10 md:gap-16 items-start">

          {/* Left: editorial intro */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-ocean-300" />
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-[0.28em]">
                Sofisticação à beira-mar
              </p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-[1.1] mb-5">
              Suítes que abraçam<br />o mar e o conforto
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-7 max-w-xs">
              Ambientes exclusivos com varanda, design inspirado nas cores do mar
              e todo o conforto que você merece.
            </p>
            <a
              href="/quartos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
            >
              Conhecer suítes
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Center: features */}
          <div className="flex flex-col gap-7 md:pt-1">
            {features.map((f) => (
              <div key={f.id} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-ocean-50 border border-ocean-100 flex items-center justify-center text-ocean-500 shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-ocean-500 uppercase tracking-widest mb-1">
                    {f.label}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: arch-framed photo */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-[220px] md:w-[260px] lg:w-[300px] h-[320px] md:h-[380px] lg:h-[420px] rounded-t-full rounded-b-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero/exterior-blue-white.jpg"
                alt="Exterior da pousada Sofia's on the Beach com arquitectura branca e detalhes azuis"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 220px, (max-width: 1024px) 260px, 300px"
              />
              {/* Subtle bottom vignette for blend */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ocean-900/10 to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
      <path d="M2 7c.6.5 1.2 1 2.5 1C7 8 7 6 9.5 6s2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 14c.6.5 1.2 1 2.5 1C7 15 7 13 9.5 13s2.5 2 5 2 2.5-2 5-2" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={2} x2={12} y2={6} />
      <line x1={12} y1={18} x2={12} y2={22} />
      <line x1={2} y1={12} x2={6} y2={12} />
      <line x1={18} y1={12} x2={22} y2={12} />
    </svg>
  )
}

function ServiceBellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z" />
      <circle cx={7} cy={7} r={1} fill="currentColor" stroke="none" />
    </svg>
  )
}
