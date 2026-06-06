import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'
import { getFeaturedRooms } from '@/lib/publicRooms'

function imgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

export function RoomsPreview() {
  const rooms = getFeaturedRooms()

  return (
    <section className="bg-white py-14 md:py-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Intro */}
        <div className="mb-12 md:mb-16" style={{ maxWidth: '580px' }}>
          <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.30em] mb-3">
            Conforto com vista
          </p>
          <h2
            className="font-serif font-bold text-ocean-900 leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(28px, 2.8vw, 44px)' }}
          >
            Quartos e suítes
          </h2>
          <div className="w-10 h-[3px] rounded-full bg-ocean-500 mb-5" />
          <p className="text-[14px] md:text-[15px] text-foreground/58 leading-relaxed">
            Ambientes elegantes, acolhedores e equipados para o seu descanso.
            Escolha a opção perfeita para a sua estadia à beira-mar.
          </p>
        </div>

        {/* Room cards — rendered from publicRooms data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const hasImg = imgExists(room.imageUrl)
            const filename = room.imageUrl.split('/').pop() ?? ''
            return (
              <div
                key={room.id}
                className="bg-white rounded-[22px] overflow-hidden border border-ocean-100/60 shadow-[0_4px_24px_rgba(0,40,80,0.07)] group hover:shadow-[0_12px_48px_rgba(0,40,80,0.13)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Room photo */}
                <div className="relative aspect-[16/10] overflow-hidden shrink-0">
                  {hasImg ? (
                    <Image
                      src={room.imageUrl}
                      alt={room.imageAlt}
                      fill
                      className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
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
                  {room.categoryLabel && (
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="bg-ocean-900 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                        {room.categoryLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <h3 className="font-serif text-[19px] font-bold text-ocean-900 leading-snug mb-2.5">
                    {room.name}
                  </h3>
                  <p className="text-[13px] text-foreground/58 leading-relaxed mb-5">
                    {room.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
                    {room.features.map((f) => (
                      <div key={f} className="flex items-center gap-1.5">
                        <CheckIcon />
                        <span className="text-[11px] text-foreground/60">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price + CTA — pinned to bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-ocean-100 mt-auto">
                    <div className="leading-none">
                      <p className="text-[10px] text-muted-foreground mb-0.5">A partir de</p>
                      <p>
                        <span className="font-serif text-[20px] font-bold text-ocean-900">
                          R$ {room.priceFrom}
                        </span>
                        <span className="text-[10px] text-muted-foreground"> {room.priceSuffix}</span>
                      </p>
                    </div>
                    <a
                      href="/quartos"
                      className="bg-ocean-900 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl hover:bg-ocean-800 transition-colors shadow-sm uppercase tracking-[0.08em]"
                    >
                      {room.ctaLabel}
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom trust line */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <LockIcon />
          <p className="text-[10px] font-semibold text-ocean-800/55 uppercase tracking-[0.24em]">
            Melhor tarifa garantida · Atendimento pelo WhatsApp
          </p>
        </div>

      </div>
    </section>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-ocean-500 shrink-0"
      aria-hidden="true"
    >
      <polyline points="2 6 5 9 10 3" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3 text-ocean-800/40 shrink-0"
      aria-hidden="true"
    >
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
