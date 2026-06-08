import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { getAllActiveRooms } from '@/lib/publicRooms'
import { getBlockedRoomIds } from '@/lib/availability'
import { getSiteSettings } from '@/lib/settings'
import { RoomSearchBar } from './RoomSearchBar'
import type { PublicRoomFull } from '@/lib/publicRooms'
import { CARD, BTN_PRIMARY, BTN_SECONDARY, Eyebrow, PLACEHOLDER_GRADIENT } from '@/components/booking/ui'

export const metadata: Metadata = {
  title: "Quartos e Suítes — Sofia's on the Beach | Búzios",
  description:
    "Escolha sua acomodação à beira-mar em Búzios. Reserve diretamente na pousada boutique Sofia's on the Beach e garanta a melhor tarifa.",
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// ── Helpers ────────────────────────────────────────────────────────────────────

function localImgExists(src: string) {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function formatDatePt(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_PT[m - 1]}`
}

function roomWaHref(roomName: string, whatsapp: string): string {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no ${roomName} na pousada Sofia's on the Beach. Podem me ajudar com disponibilidade?`,
  )
  return `https://wa.me/${whatsapp}?text=${msg}`
}

function reservarUrl(roomId: string, checkIn: string, checkOut: string, guests: number): string {
  return `/reservar?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
}

// ── Page ───────────────────────────────────────────────────────────────────────

type SearchParams = Promise<{ check_in?: string | string[]; check_out?: string | string[]; guests?: string | string[] }>

export default async function QuartosPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const settings = await getSiteSettings()

  const rawCheckIn  = typeof sp.check_in  === 'string' ? sp.check_in  : null
  const rawCheckOut = typeof sp.check_out === 'string' ? sp.check_out : null
  const rawGuests   = typeof sp.guests    === 'string' ? sp.guests    : null

  const checkIn  = rawCheckIn  && ISO_DATE.test(rawCheckIn)  ? rawCheckIn  : null
  const checkOut = rawCheckOut && ISO_DATE.test(rawCheckOut) ? rawCheckOut : null
  const guests   = rawGuests   ? Math.max(1, parseInt(rawGuests, 10) || 1) : null

  const hasValidDates = !!(checkIn && checkOut && checkOut > checkIn)

  // Date validation error shown to user
  const dateError =
    rawCheckIn && rawCheckOut && !hasValidDates && (checkIn || checkOut)
      ? 'A data de check-out deve ser após o check-in.'
      : null

  // Fetch all active rooms
  const allRooms = await getAllActiveRooms()

  // Filter by guest capacity (hide rooms that can't accommodate)
  const guestFiltered = guests ? allRooms.filter((r) => r.maxGuests >= guests) : allRooms

  // Batch availability check — single query for all rooms
  let blockedIds = new Set<string>()
  if (hasValidDates && guestFiltered.length > 0) {
    blockedIds = await getBlockedRoomIds(
      guestFiltered.map((r) => r.id),
      checkIn!,
      checkOut!,
    )
  }

  type RoomWithStatus = PublicRoomFull & { available: boolean | null }
  const rooms: RoomWithStatus[] = guestFiltered.map((r) => ({
    ...r,
    available: hasValidDates ? !blockedIds.has(r.id) : null,
  }))

  const availableCount = rooms.filter((r) => r.available === true).length

  return (
    <>
      {/* ── Intro ──────────────────────────────────────────────────── */}
      <section className="bg-ivory pt-14 md:pt-20 pb-10 md:pb-14 px-6 md:px-10">
        <div className="max-w-[1240px] mx-auto">
          <Eyebrow className="mb-3">Conforto com vista</Eyebrow>
          <h1
            className="font-serif font-bold text-navy-deep leading-[1.08] mb-5"
            style={{ fontSize: 'clamp(34px, 4.2vw, 56px)' }}
          >
            Quartos e suítes
          </h1>
          <div className="w-10 h-[3px] rounded-full bg-warm-sand mb-5" />
          <p
            className="text-stone leading-relaxed mb-10 max-w-xl"
            style={{ fontSize: 'clamp(15px, 1.1vw, 17px)' }}
          >
            Escolha sua acomodação à beira-mar em Búzios — cada suíte foi pensada para que a vista do mar seja sempre protagonista.
          </p>

          <RoomSearchBar
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialGuests={guests}
          />
        </div>
      </section>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      <section className="bg-ivory pt-6 pb-16 md:pb-24 px-6 md:px-10">
        <div className="max-w-[1240px] mx-auto">

          {/* Date validation error */}
          {dateError && (
            <div className="mb-6 px-5 py-4 bg-red-50 rounded-2xl">
              <p className="text-[13px] text-red-600 font-medium">{dateError}</p>
            </div>
          )}

          {/* Active filter banner */}
          {hasValidDates && (
            <div className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4 bg-white border border-foam rounded-2xl shadow-[0_8px_28px_-12px_rgba(0,40,80,0.12)]">
              <div className="flex items-center gap-2 text-[13px] text-navy">
                <CalendarSmIcon />
                <span>
                  <strong>{formatDatePt(checkIn!)}</strong>
                  <span className="mx-1.5 text-stone">→</span>
                  <strong>{formatDatePt(checkOut!)}</strong>
                </span>
                {guests && (
                  <span className="text-stone">
                    · {guests} hóspede{guests > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {rooms.length > 0 && (
                <span className="text-[12px] text-stone">
                  {availableCount} de {rooms.length} disponíve{availableCount !== 1 ? 'is' : 'l'}
                </span>
              )}
              <Link
                href="/quartos"
                className="ml-auto text-[11px] font-semibold text-stone hover:text-navy-deep underline underline-offset-2 transition-colors"
              >
                Limpar filtro
              </Link>
            </div>
          )}

          {/* Empty state */}
          {rooms.length === 0 ? (
            <EmptyState guests={guests} hasFilter={!!guests || hasValidDates} whatsapp={settings.whatsapp} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-9">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  available={room.available}
                  reservarHref={
                    room.available === true && hasValidDates && guests
                      ? reservarUrl(room.id, checkIn!, checkOut!, guests)
                      : null
                  }
                  waHref={roomWaHref(room.name, settings.whatsapp)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// ── Room card ──────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  available,
  reservarHref,
  waHref,
}: {
  room: PublicRoomFull
  available: boolean | null  // null = no dates selected
  reservarHref: string | null // non-null only when available + dates selected
  waHref: string
}) {
  const isExternal = room.imageUrl.startsWith('http')
  const showImage = isExternal || localImgExists(room.imageUrl)
  const isUnavailable = available === false

  const features = [...room.amenities]
  if (room.oceanView && !features.includes('Vista para o mar')) features.unshift('Vista para o mar')
  const displayFeatures = features.slice(0, 5)

  return (
    <article
      className={`${CARD} overflow-hidden flex flex-col transition-all duration-300 ${
        isUnavailable
          ? 'opacity-60'
          : 'group hover:shadow-[0_36px_100px_-22px_rgba(0,40,80,0.26)] hover:-translate-y-1.5'
      }`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
        {showImage ? (
          <Image
            src={room.imageUrl}
            alt={room.imageAlt}
            fill
            unoptimized={isExternal}
            className={`object-cover object-center transition-transform duration-700 ${!isUnavailable ? 'group-hover:scale-[1.04]' : ''}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: PLACEHOLDER_GRADIENT }} />
        )}
        {room.categoryName && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-navy-deep text-ivory text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full shadow-[0_8px_20px_-6px_rgba(0,40,80,0.35)]">
              {room.categoryName}
            </span>
          </div>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 bg-navy-deep/15 flex items-end justify-start p-4 z-10">
            <span className="bg-navy-deep/85 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full">
              Indisponível nas datas
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-7 md:p-8 flex flex-col flex-1">
        <h2 className="font-serif text-[22px] md:text-[24px] font-bold text-navy-deep leading-snug mb-2.5">
          {room.name}
        </h2>

        {room.description && (
          <p className="text-[14px] text-stone leading-relaxed mb-5">
            {room.description}
          </p>
        )}

        {/* Guests + size */}
        <div className="flex items-center gap-5 text-[12px] text-navy/70 font-medium mb-5">
          <span className="flex items-center gap-1.5">
            <GuestsIcon />
            Até {room.maxGuests} hóspede{room.maxGuests > 1 ? 's' : ''}
          </span>
          {room.sizeSqm && (
            <span className="flex items-center gap-1.5">
              <SizeIcon />
              {room.sizeSqm} m²
            </span>
          )}
        </div>

        {/* Amenity list */}
        {displayFeatures.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
            {displayFeatures.map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckIcon />
                <span className="text-[12px] text-stone">{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Price + CTAs */}
        <div className="mt-auto pt-5">
          <div className="leading-none mb-4">
            <p className="text-[11px] text-stone/80 mb-1">A partir de</p>
            <p>
              <span className="font-serif text-[24px] font-bold text-navy-deep">
                {formatBRL(room.priceFrom)}
              </span>
              <span className="text-[11px] text-stone/80"> / noite</span>
            </p>
          </div>

          {isUnavailable ? (
            // Blocked: show unavailable state, no actions
            <div className="flex items-center justify-center py-3 rounded-2xl bg-foam/55">
              <span className="text-[11px] font-semibold text-stone uppercase tracking-[0.06em]">
                Indisponível nas datas
              </span>
            </div>
          ) : available === true ? (
            // Available + dates selected: primary CTA is Reservar
            <div className="flex gap-2.5">
              <Link
                href={reservarHref!}
                className={`flex-1 px-4 py-2.5 text-[11px] uppercase tracking-[0.08em] ${BTN_PRIMARY}`}
              >
                Reservar
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Perguntar sobre ${room.name} pelo WhatsApp`}
                className={`px-4 py-2.5 text-[11px] ${BTN_SECONDARY}`}
              >
                <WAIcon />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          ) : (
            // No dates selected: prompt user to the search bar at the top of this page
            <div className="flex gap-2.5">
              <Link
                href="/quartos#busca"
                className={`flex-1 px-4 py-2.5 text-[11px] uppercase tracking-[0.08em] ${BTN_PRIMARY}`}
              >
                Consultar datas
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Falar sobre ${room.name} pelo WhatsApp`}
                className={`px-4 py-2.5 text-[11px] ${BTN_SECONDARY}`}
              >
                <WAIcon />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ guests, hasFilter, whatsapp }: { guests: number | null; hasFilter: boolean; whatsapp: string }) {
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Olá! Gostaria de saber sobre disponibilidade na pousada Sofia's on the Beach.",
  )}`
  return (
    <div className="text-center py-20">
      <p className="font-serif text-[22px] font-bold text-navy-deep mb-3">
        {hasFilter && guests
          ? `Nenhuma suíte disponível para ${guests} hóspede${guests > 1 ? 's' : ''}.`
          : 'Nenhuma suíte disponível no momento.'}
      </p>
      <p className="text-[14px] text-stone mb-8 max-w-sm mx-auto leading-relaxed">
        {hasFilter
          ? 'Tente ajustar as datas ou o número de hóspedes, ou entre em contato pelo WhatsApp.'
          : 'Entre em contato e nossa equipe terá o prazer em ajudá-lo.'}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {hasFilter && (
          <Link href="/quartos" className={`px-7 py-3.5 text-[13px] ${BTN_SECONDARY}`}>
            Ver todas as suítes
          </Link>
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`gap-2 px-8 py-3.5 text-[14px] ${BTN_PRIMARY}`}
        >
          <WAIcon className="w-4 h-4" />
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CalendarSmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-navy/55 shrink-0" aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-navy/50 shrink-0" aria-hidden="true">
      <polyline points="2 6 5 9 10 3" />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1={21} y1={3} x2={14} y2={10} />
      <line x1={3} y1={21} x2={10} y2={14} />
    </svg>
  )
}

function WAIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? 'w-3.5 h-3.5 shrink-0'} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
