import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'

function imgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

const MAIN_IMG = '/images/experience/experience-main.jpg'

const stripImages = [
  {
    src: '/images/experience/experience-beach.jpg',
    alt: 'Praia em frente à pousada com oceano e barcos ao entardecer',
  },
  {
    src: '/images/experience/experience-exterior.jpg',
    alt: 'Área externa da pousada com arquitetura branca e azul',
  },
  {
    src: '/images/experience/experience-breakfast.jpg',
    alt: 'Café da manhã servido com vista para o oceano',
  },
]

const highlights = [
  {
    id: 'cafe',
    icon: <CafeIcon />,
    title: 'Café da manhã com vista',
    body: 'Comece o dia com um café completo e uma paisagem que inspira.',
  },
  {
    id: 'praia',
    icon: <WaveIcon />,
    title: 'Pé na areia',
    body: 'A poucos passos da praia, para você viver o mar com praticidade e exclusividade.',
  },
  {
    id: 'vista',
    icon: <WindowIcon />,
    title: 'Vista para o mar',
    body: 'Suítes e ambientes com vista privilegiada para o azul de Búzios.',
  },
  {
    id: 'atmosfera',
    icon: <PalmIcon />,
    title: 'Atmosfera exclusiva',
    body: 'Um ambiente intimista, elegante e acolhedor, feito para relaxar e aproveitar o melhor.',
  },
]

export function ExperienceSection() {
  const hasMainImg = imgExists(MAIN_IMG)

  return (
    <section className="bg-white overflow-hidden">

      {/* ── Top full-width editorial composition ── */}
      <div className="flex flex-col md:flex-row">

        {/* Left: text — white, padded */}
        <div className="w-full md:w-[43%] flex flex-col justify-center px-6 py-14 md:py-[90px] md:pl-[5vw] md:pr-16" style={{ maxWidth: 'min(100%, calc(43vw))' }}>
          <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.30em] mb-4">
            Experiências
          </p>
          <h2
            className="font-serif font-bold text-ocean-900 leading-[1.08] mb-5"
            style={{ fontSize: 'clamp(34px, 3.6vw, 56px)' }}
          >
            Viva Búzios de<br />frente para o mar
          </h2>
          <div className="w-10 h-[3px] rounded-full bg-ocean-500 mb-6" />
          <p className="text-[14px] md:text-[15px] text-foreground/58 leading-[1.75] mb-6" style={{ maxWidth: '420px' }}>
            No Sofia&apos;s on the Beach, cada detalhe foi pensado para que você viva momentos
            inesquecíveis. Experiências que despertam os sentidos e conectam você ao melhor de Búzios.
          </p>
          <p className="font-serif italic text-ocean-700 text-[16px]">
            Seu refúgio. Sua vista. Seu tempo.
          </p>
        </div>

        {/* Right: image — full column, no rounding, flush to edge */}
        <div className="w-full md:w-[57%] relative min-h-[280px] md:min-h-[520px] overflow-hidden">
          {hasMainImg ? (
            <Image
              src={MAIN_IMG}
              alt="Vista da varanda com panorâmica para o oceano de Búzios"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 57vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(160deg, #dceef9 0%, #c4dff0 55%, #a9cde7 100%)',
              }}
            >
              <span className="absolute bottom-2 left-3 text-[7px] font-mono leading-none select-none text-white/50">
                {MAIN_IMG.split('/').pop()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Full-bleed photo strip — no gap, no padding, no rounding ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 h-[180px] md:h-[260px]">
        {stripImages.map((img) => {
          const exists = imgExists(img.src)
          const filename = img.src.split('/').pop() ?? ''
          return (
            <div key={img.src} className="relative overflow-hidden">
              {exists ? (
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(160deg, #dceef9 0%, #c4dff0 55%, #a9cde7 100%)',
                  }}
                >
                  <span className="absolute bottom-2 left-3 text-[7px] font-mono leading-none select-none text-white/50">
                    {filename}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Feature highlights — padded, max-w-7xl ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-ocean-100">
          {highlights.map((h, i) => (
            <div
              key={h.id}
              className={[
                'py-4 md:py-0',
                i === 0 ? 'md:pr-8' : i === highlights.length - 1 ? 'md:pl-8' : 'md:px-8',
              ].join(' ')}
            >
              <div className="w-10 h-10 text-ocean-600 mb-4">
                {h.icon}
              </div>
              <h3 className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.14em] leading-snug mb-2.5">
                {h.title}
              </h3>
              <p className="text-[14px] text-foreground/58 leading-relaxed">
                {h.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom trust line ── */}
      <div className="flex items-center justify-center gap-2 pb-12 md:pb-14">
        <LockIcon />
        <p className="text-[10px] font-semibold text-ocean-800/50 uppercase tracking-[0.24em]">
          Reserva direta · Melhor tarifa garantida · Atendimento pelo WhatsApp
        </p>
      </div>

    </section>
  )
}

function CafeIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <circle cx={16} cy={10} r={3} />
      <line x1={16} y1={4} x2={16} y2={6} />
      <line x1={22} y1={6} x2={24} y2={4} />
      <line x1={10} y1={6} x2={8} y2={4} />
      <path d="M4 18c1 .8 2 1.4 4 1.4C12 19.4 12 17 16 17s4 2.4 8 2.4c2 0 3-.6 4-1.4" />
      <path d="M4 23c1 .8 2 1.4 4 1.4C12 24.4 12 22 16 22s4 2.4 8 2.4c2 0 3-.6 4-1.4" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="w-full h-full" aria-hidden="true">
      <path d="M2 20c1.4 1.2 3 2 5 2 4 0 4-3 8-3s4 3 8 3c2 0 3.6-.8 5-2" />
      <path d="M2 26c1.4 1.2 3 2 5 2 4 0 4-3 8-3s4 3 8 3c2 0 3.6-.8 5-2" />
      <path d="M9 14l4-8 4 4 4-8" />
    </svg>
  )
}

function WindowIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M6 28V16a10 10 0 0 1 20 0v12" />
      <line x1={4} y1={28} x2={28} y2={28} />
      <line x1={16} y1={6} x2={16} y2={28} />
      <line x1={6} y1={20} x2={26} y2={20} />
    </svg>
  )
}

function PalmIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
      <path d="M16 28c0-8 2-16 2-16" />
      <path d="M18 12c0 0-3-8-10-6 0 0 3 8 10 6z" />
      <path d="M18 12c0 0 3-8 10-6 0 0-3 8-10 6z" />
      <path d="M18 16c0 0-1-6 6-10 0 0 1 7-6 10z" />
      <line x1={12} y1={28} x2={24} y2={28} />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-ocean-800/40 shrink-0" aria-hidden="true">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
