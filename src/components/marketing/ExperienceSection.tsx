const experiences = [
  {
    id: 'cafe',
    title: 'Café da manhã incluso',
    description:
      'Café completo com frutas frescas, tapioca, pães artesanais e produtos regionais. Servido com vista para o jardim.',
    gradientFrom: 'from-sand-200',
    gradientTo: 'to-sand-400',
    icon: <CoffeeIcon />,
  },
  {
    id: 'praia',
    title: 'Acesso à beira-mar',
    description:
      'A pousada fica a passos da praia. Acordar, abrir a janela e sentir a brisa do oceano faz parte da estadia.',
    gradientFrom: 'from-ocean-200',
    gradientTo: 'to-ocean-500',
    icon: <WaveIcon />,
  },
  {
    id: 'vista',
    title: 'Vista para o oceano',
    description:
      'Quartos com vista privilegiada para o Atlântico. O horizonte do mar como cenário a qualquer hora do dia.',
    gradientFrom: 'from-ocean-300',
    gradientTo: 'to-ocean-700',
    icon: <HorizonIcon />,
  },
  {
    id: 'buzios',
    title: 'O melhor de Búzios',
    description:
      'A poucos minutos das praias mais bonitas do Brasil e do encantador centro histórico de Búzios.',
    gradientFrom: 'from-sand-300',
    gradientTo: 'to-ocean-300',
    icon: <MapIcon />,
  },
]

export function ExperienceSection() {
  return (
    <section className="bg-ocean-50 py-20 px-6 md:px-10 border-y border-ocean-100">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-xs font-bold text-ocean-500 uppercase tracking-widest mb-3">
            Experiência
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            A experiência Sofia&apos;s
          </h2>
          <p className="text-muted-foreground text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Cada detalhe foi pensado para que sua estadia em Búzios seja inesquecível.
          </p>
          <div className="h-0.5 w-12 bg-accent rounded-full mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row"
            >
              {/* Image block */}
              <div className={`relative w-full sm:w-36 h-40 sm:h-auto shrink-0 bg-gradient-to-br ${exp.gradientFrom} ${exp.gradientTo}`}>
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  {exp.icon}
                </div>
              </div>

              {/* Text */}
              <div className="p-6 flex flex-col justify-center">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                  {exp.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Inline icons ── */

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1={6} y1={2} x2={6} y2={4} />
      <line x1={10} y1={2} x2={10} y2={4} />
      <line x1={14} y1={2} x2={14} y2={4} />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-10 h-10" aria-hidden="true">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11s2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17s2.5 2 5 2 2.5-2 5-2" />
    </svg>
  )
}

function HorizonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" aria-hidden="true">
      <circle cx={12} cy={12} r={4} />
      <line x1={1.05} y1={12} x2={7} y2={12} />
      <line x1={17.01} y1={12} x2={22.96} y2={12} />
      <path d="M4 4c2 2 5 3 8 3s6-1 8-3" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1={9} y1={3} x2={9} y2={18} />
      <line x1={15} y1={6} x2={15} y2={21} />
    </svg>
  )
}
