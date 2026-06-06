import Image from 'next/image'

const features = [
  {
    id: 'cafe',
    label: 'Café da manhã',
    title: 'Café da manhã com vista',
    text: 'Café completo com frutas frescas, tapioca e pães artesanais, servido com o oceano como cenário.',
    image: '/images/experience/cafe-da-manha.jpg',
    imageAlt: 'Café da manhã com buffet e vista para o oceano',
  },
  {
    id: 'praia',
    label: 'Beira-mar',
    title: 'Praia a poucos passos',
    text: 'Você acorda e está na praia. Sem distância entre você e o oceano. Acesso direto à beira-mar.',
    image: '/images/experience/praia-em-frente.jpg',
    imageAlt: 'Praia em frente à pousada com barcos e oceano ao entardecer',
  },
  {
    id: 'vista',
    label: 'Vista para o oceano',
    title: 'Vista para o Atlântico',
    text: 'Suítes com vista privilegiada para o Atlântico. O horizonte do mar como cenário a qualquer hora.',
    image: '/images/experience/vista-mar.jpg',
    imageAlt: 'Terraço aberto com vista direta para a baía de Búzios',
  },
  {
    id: 'buzios',
    label: 'Búzios',
    title: 'O melhor de Búzios',
    text: 'A poucos minutos das praias mais bonitas do Brasil e do encantador centro histórico de Búzios.',
    image: '/images/experience/area-externa.jpg',
    imageAlt: 'Área externa da pousada Sofia\'s on the Beach com arquitetura azul e branca',
  },
]

export function ExperienceSection() {
  return (
    <section className="bg-ocean-50 border-y border-ocean-100">

      {/* Cinematic full-width banner with overlaid headline */}
      <div className="relative overflow-hidden">
        {/* Large ocean photo frame */}
        <div className="relative h-[380px] md:h-[480px]">
          <Image
            src="/images/experience/praia-em-frente.jpg"
            alt="Praia em frente à pousada Sofia's on the Beach ao entardecer, com barcos e oceano"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient for text legibility at bottom-left */}
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/70 via-ocean-900/20 to-transparent" />

          {/* Overlaid text — positioned bottom-left */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-10 pb-10 md:pb-14">
              <p className="text-ocean-200 text-[11px] font-bold uppercase tracking-widest mb-3">
                Experiência
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] max-w-xl">
                Viva Búzios de frente<br className="hidden sm:block" /> para o mar
              </h2>
              <p className="text-white/70 text-base mt-3 max-w-md leading-relaxed">
                Cada detalhe foi pensado para que sua estadia seja inesquecível.
              </p>
            </div>
          </div>

          {/* Overlapping small card — café da manhã — floats at right */}
          <div className="absolute top-8 right-6 md:right-12 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/80 max-w-[160px] hidden md:block z-10">
            <div className="relative w-full h-20 rounded-xl overflow-hidden mb-3">
              <Image
                src="/images/experience/cafe-da-manha.jpg"
                alt="Café da manhã com vista para o oceano"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <p className="text-[9px] font-bold text-ocean-500 uppercase tracking-widest mb-0.5">
              Café da manhã
            </p>
            <p className="text-xs font-semibold text-foreground leading-snug">
              Com vista para o oceano
            </p>
          </div>
        </div>

        {/* Transition strip */}
        <div className="h-10 md:h-14 bg-ocean-50" />
      </div>

      {/* Feature items grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.id}>
              <div className="relative h-28 rounded-2xl overflow-hidden mb-4">
                <Image
                  src={f.image}
                  alt={f.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 45vw, 25vw"
                />
              </div>
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-2">
                {f.label}
              </p>
              <h3 className="font-serif text-base font-semibold text-foreground mb-2 leading-snug">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
