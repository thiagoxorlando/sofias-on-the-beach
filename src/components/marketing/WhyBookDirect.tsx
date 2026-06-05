const benefits = [
  {
    id: 'tarifa',
    icon: <TagIcon />,
    title: 'Melhor tarifa direta',
    description:
      'Ao reservar diretamente conosco, você garante o menor preço disponível. Sem acréscimos de plataforma.',
  },
  {
    id: 'whatsapp',
    icon: <ChatIcon />,
    title: 'Atendimento pelo WhatsApp',
    description:
      'Fale diretamente com a equipe da pousada pelo WhatsApp. Resposta rápida, atendimento humano e personalizado.',
  },
  {
    id: 'taxas',
    icon: <ShieldIcon />,
    title: 'Sem taxas de plataforma',
    description:
      'Nenhuma comissão de intermediários. Seu dinheiro vai integralmente para proporcionar a melhor estadia.',
  },
  {
    id: 'direto',
    icon: <UserIcon />,
    title: 'Comunicação direta',
    description:
      'Pedidos especiais, transfers, roteiros — tudo resolvido diretamente com quem conhece a pousada de verdade.',
  },
]

export function WhyBookDirect() {
  return (
    <section className="bg-sand-50 py-20 px-6 md:px-10 border-y border-sand-200">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-xs font-bold text-ocean-500 uppercase tracking-widest mb-3">
            Vantagens exclusivas
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Por que reservar direto?
          </h2>
          <div className="h-0.5 w-12 bg-accent rounded-full mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b) => (
            <div
              key={b.id}
              className="bg-card rounded-2xl border border-sand-200 p-7 hover:shadow-md hover:border-sand-300 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-2xl bg-ocean-50 border border-ocean-100 flex items-center justify-center mb-5 text-ocean-500">
                {b.icon}
              </div>
              <h3 className="font-serif text-base font-semibold text-foreground mb-2">
                {b.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Inline icons ── */

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z" />
      <circle cx={7} cy={7} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </svg>
  )
}
