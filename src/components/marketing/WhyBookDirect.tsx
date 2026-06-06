const benefits = [
  {
    id: 'tarifa',
    icon: <TagIcon />,
    title: 'Melhor tarifa direta',
    body: 'Ao reservar diretamente conosco, você garante as melhores condições sem taxas de plataformas.',
  },
  {
    id: 'whatsapp',
    icon: <ChatIcon />,
    title: 'Atendimento pelo WhatsApp',
    body: 'Fale direto com a equipe da pousada antes, durante e depois da sua estadia.',
  },
  {
    id: 'taxas',
    icon: <ShieldIcon />,
    title: 'Sem taxas de plataforma',
    body: 'Reserve com transparência, sem acréscimos de intermediários.',
  },
  {
    id: 'comunicacao',
    icon: <MessageIcon />,
    title: 'Comunicação direta',
    body: 'Pedidos especiais, dúvidas e detalhes resolvidos diretamente com quem conhece a pousada.',
  },
]

export function WhyBookDirect() {
  return (
    <section className="bg-white py-14 md:py-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-14 md:mb-18">
          <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.30em] mb-4">
            Vantagens exclusivas
          </p>
          <h2
            className="font-serif font-bold text-ocean-900 leading-[1.1] mx-auto"
            style={{ fontSize: 'clamp(26px, 2.6vw, 38px)', maxWidth: '520px' }}
          >
            Por que reservar direto?
          </h2>
          <div className="w-10 h-[3px] rounded-full bg-ocean-500 mx-auto mt-5" />
        </div>

        {/* 4 benefit columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 lg:gap-14">
          {benefits.map((b) => (
            <div key={b.id} className="border-t-2 border-ocean-100 pt-7">
              <div className="text-ocean-600 mb-5 w-6 h-6">
                {b.icon}
              </div>
              <h3 className="font-serif text-[17px] font-bold text-ocean-900 leading-snug mb-3">
                {b.title}
              </h3>
              <p className="text-[13px] text-foreground/58 leading-relaxed">
                {b.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z" />
      <circle cx={7} cy={7} r={1} fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1={9} y1={10} x2={9} y2={10} strokeWidth={2.5} />
      <line x1={12} y1={10} x2={12} y2={10} strokeWidth={2.5} />
      <line x1={15} y1={10} x2={15} y2={10} strokeWidth={2.5} />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}
