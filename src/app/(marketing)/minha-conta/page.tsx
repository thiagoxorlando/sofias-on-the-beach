import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { requireGuest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteSettings } from '@/lib/settings'
import { signOutAction } from './actions'
import {
  PAGE_SURFACE, Container, CARD, CARD_SOFT, CARD_INTERACTIVE, Eyebrow,
  StatusBadge, PaymentBadge, BTN_PRIMARY, PLACEHOLDER_GRADIENT,
} from '@/components/booking/ui'

export const metadata: Metadata = {
  title: "Minha conta — Sofia's on the Beach",
  robots: { index: false },
}

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function fmt(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_PT[m - 1]}`
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function localImgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

type RoomImg = { url: string; alt_text: string | null; is_cover: boolean; sort_order: number }
type RoomJoin = { name: string; slug: string; room_images: RoomImg[] }
type PaymentJoin = { status: string; method: string; created_at: string }

type UpcomingView = {
  token: string
  checkIn: string
  checkOut: string
  adults: number
  total: number
  status: string
  roomName: string
  imageUrl: string | null
  isExternal: boolean
  paymentStatus: string | null
}

export default async function MinhaContaPage() {
  const guest = await requireGuest('/minha-conta')
  const settings = await getSiteSettings()
  const db = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: upcoming } = await db
    .from('reservations')
    .select(`
      id, token, check_in, check_out, adults, total_brl, status,
      rooms ( name, slug, room_images ( url, alt_text, is_cover, sort_order ) ),
      payments ( status, method, created_at )
    `)
    .eq('guest_id', guest.id)
    .neq('status', 'cancelled')
    .gte('check_out', today)
    .order('check_in', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { count: totalCount } = await db
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('guest_id', guest.id)

  let upcomingView: UpcomingView | null = null

  if (upcoming) {
    const room = upcoming.rooms && !Array.isArray(upcoming.rooms) ? (upcoming.rooms as RoomJoin) : null
    const imgs = (room?.room_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
    const cover = imgs.find((i) => i.is_cover) ?? imgs[0] ?? null
    const rawImageUrl = cover?.url ?? (room ? `/images/rooms/${room.slug}.jpg` : null)
    const isExternal = !!rawImageUrl?.startsWith('http')
    const showImage = !!rawImageUrl && (isExternal || localImgExists(rawImageUrl))

    const payments = (
      Array.isArray(upcoming.payments) ? upcoming.payments : upcoming.payments ? [upcoming.payments] : []
    ) as PaymentJoin[]
    const relevantPayment = payments.find((p) => p.status !== 'failed') ?? payments[0] ?? null

    upcomingView = {
      token:         upcoming.token,
      checkIn:       upcoming.check_in,
      checkOut:      upcoming.check_out,
      adults:        upcoming.adults,
      total:         upcoming.total_brl,
      status:        upcoming.status,
      roomName:      room?.name ?? 'Acomodação',
      imageUrl:      showImage ? rawImageUrl : null,
      isExternal,
      paymentStatus: relevantPayment?.status ?? null,
    }
  }

  const firstName = guest.full_name.trim().split(/\s+/)[0]
  const reservationsCount = totalCount ?? 0
  const waHref = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de falar sobre minha reserva.')}`

  return (
    <section className={`${PAGE_SURFACE} py-12 md:py-20`}>
      <Container size="default">

        {/* ── Welcome header ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div>
            <Eyebrow className="mb-3">Bem-vindo(a) de volta</Eyebrow>
            <h1
              className="font-serif font-bold text-navy-deep leading-[1.06]"
              style={{ fontSize: 'clamp(34px, 4.4vw, 52px)' }}
            >
              Olá, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-[13px] text-stone">
              <span>{guest.email}</span>
              {guest.phone && (
                <>
                  <span className="text-driftwood/50">·</span>
                  <span>{guest.phone}</span>
                </>
              )}
              <span className="text-driftwood/50">·</span>
              <span>{reservationsCount} reserva{reservationsCount !== 1 ? 's' : ''} no total</span>
            </div>
          </div>
          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-[12px] font-semibold text-stone hover:text-navy-deep bg-white border border-foam hover:shadow-[0_8px_28px_-10px_rgba(0,40,80,0.16)] rounded-2xl px-5 py-3 transition-all"
            >
              <SignOutIcon />
              Sair
            </button>
          </form>
        </div>

        {/* ── Upcoming reservation ────────────────────────────── */}
        <div className="mb-12">
          <Eyebrow className="mb-4 px-1">Próxima reserva</Eyebrow>

          {upcomingView ? (
            <Link
              href={`/reserva/${upcomingView.token}`}
              className={`flex flex-col lg:flex-row ${CARD} ${CARD_INTERACTIVE} overflow-hidden group`}
            >
              <div className="relative w-full lg:w-[42%] h-64 lg:h-auto shrink-0 overflow-hidden">
                {upcomingView.imageUrl ? (
                  <Image
                    src={upcomingView.imageUrl}
                    alt={upcomingView.roomName}
                    fill
                    unoptimized={upcomingView.isExternal}
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 100vw, 460px"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: PLACEHOLDER_GRADIENT }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/25 to-transparent lg:hidden" />
              </div>

              <div className="flex-1 p-8 md:p-10 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-serif text-[24px] md:text-[28px] font-bold text-navy-deep leading-snug">
                      {upcomingView.roomName}
                    </p>
                    <p className="text-[11px] font-mono font-bold text-stone/70 tracking-wider mt-1">
                      {upcomingView.token}
                    </p>
                  </div>
                  <StatusBadge status={upcomingView.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-stone mb-6">
                  <span>{fmt(upcomingView.checkIn)} → {fmt(upcomingView.checkOut)}</span>
                  <span className="text-driftwood/50">·</span>
                  <span>{upcomingView.adults} hóspede{upcomingView.adults > 1 ? 's' : ''}</span>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-serif text-[24px] font-bold text-navy-deep">{formatBRL(upcomingView.total)}</span>
                    {upcomingView.paymentStatus && <PaymentBadge status={upcomingView.paymentStatus} compact />}
                  </div>
                  <span className="text-[13px] font-semibold text-navy-deep/70 group-hover:text-navy-deep transition-colors flex items-center gap-1.5 shrink-0">
                    Ver reserva
                    <ArrowRightIcon />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className={`${CARD} p-12 text-center`}>
              <p className="text-[15px] text-stone mb-6">Você não tem reservas futuras no momento.</p>
              <Link href="/quartos" className={`px-8 py-3.5 text-[13px] ${BTN_PRIMARY}`}>
                Ver quartos disponíveis
              </Link>
            </div>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────── */}
        <Eyebrow className="mb-4 px-1">Acesso rápido</Eyebrow>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <QuickLink
            href="/minha-conta/reservas"
            icon={<CalendarIcon />}
            iconBg="bg-mist/35 group-hover:bg-mist/55"
            label="Ver reservas"
          />
          <QuickLink
            href="/quartos"
            icon={<BedIcon />}
            iconBg="bg-mist/35 group-hover:bg-mist/55"
            label="Ver quartos"
          />
          <QuickLink
            href={waHref}
            external
            icon={<WAIcon />}
            iconBg="bg-emerald-100 group-hover:bg-emerald-200"
            label="Falar no WhatsApp"
          />
          <form action={signOutAction} className="contents">
            <button
              type="submit"
              className={`${CARD_SOFT} ${CARD_INTERACTIVE} p-6 group flex flex-col items-start text-left`}
            >
              <div className="w-11 h-11 rounded-full bg-foam group-hover:bg-mist/45 flex items-center justify-center shrink-0 mb-4 transition-colors">
                <SignOutIcon />
              </div>
              <p className="text-[14px] font-bold text-navy-deep">Sair da conta</p>
            </button>
          </form>
        </div>

        <p className="text-center mt-12">
          <Link href="/" className="text-[12px] text-stone hover:text-navy-deep transition-colors">
            ← Voltar ao site
          </Link>
        </p>

      </Container>
    </section>
  )
}

function QuickLink({
  href,
  icon,
  iconBg,
  label,
  external,
}: {
  href: string
  icon: React.ReactNode
  iconBg: string
  label: string
  external?: boolean
}) {
  const className = `${CARD_SOFT} ${CARD_INTERACTIVE} p-6 group flex flex-col items-start`

  const inner = (
    <>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mb-4 transition-colors ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[14px] font-bold text-navy-deep">{label}</p>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-navy-deep" aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={3} y1={10} x2={21} y2={10} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={16} y1={2} x2={16} y2={6} />
    </svg>
  )
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-navy-deep" aria-hidden="true">
      <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" />
      <path d="M2 11h20v6H2z" />
      <path d="M2 17v3M22 17v3M6 9V7M11 9V7" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-stone" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
