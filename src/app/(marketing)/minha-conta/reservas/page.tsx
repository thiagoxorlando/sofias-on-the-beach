import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { requireGuest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  PAGE_SURFACE, Container, CARD, CARD_INTERACTIVE, PageHeader, BTN_PRIMARY,
  StatusBadge, PaymentBadge, PLACEHOLDER_GRADIENT,
} from '@/components/booking/ui'

export const metadata: Metadata = {
  title: "Minhas reservas — Sofia's on the Beach",
  robots: { index: false },
}

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function fmt(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_PT[m - 1]}. ${y}`
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
type Res = {
  id: string; token: string; check_in: string; check_out: string
  adults: number; total_brl: number; status: string; created_at: string
  rooms: RoomJoin | RoomJoin[] | null
  payments: PaymentJoin | PaymentJoin[] | null
}

export default async function MinhasReservasPage() {
  const guest = await requireGuest('/minha-conta/reservas')
  const db = createAdminClient()

  const { data: reservations } = await db
    .from('reservations')
    .select(`
      id, token, check_in, check_out, adults, total_brl, status, created_at,
      rooms ( name, slug, room_images ( url, alt_text, is_cover, sort_order ) ),
      payments ( status, method, created_at )
    `)
    .eq('guest_id', guest.id)
    .order('created_at', { ascending: false })

  const rows = (reservations ?? []) as Res[]

  return (
    <section className={`${PAGE_SURFACE} py-12 md:py-20`}>
      <Container size="default">

        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/minha-conta"
            className="text-[12px] font-semibold text-stone hover:text-navy-deep transition-colors flex items-center gap-1"
          >
            <ArrowLeftIcon />
            Minha conta
          </Link>
        </div>

        <PageHeader
          eyebrow="Histórico"
          title="Minhas reservas"
          description="Acompanhe todas as suas estadias em Sofia's on the Beach — passadas, confirmadas e em andamento."
          className="mb-10 md:mb-12"
        />

        {rows.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <p className="text-[15px] text-stone mb-6">Você ainda não tem reservas.</p>
            <Link href="/quartos" className={`px-8 py-3.5 text-[13px] ${BTN_PRIMARY}`}>
              Ver quartos disponíveis
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {rows.map((r) => {
              const room = r.rooms && !Array.isArray(r.rooms) ? (r.rooms as RoomJoin) : null

              const imgs = (room?.room_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
              const cover = imgs.find((i) => i.is_cover) ?? imgs[0] ?? null
              const rawImageUrl = cover?.url ?? (room ? `/images/rooms/${room.slug}.jpg` : null)
              const isExternal = !!rawImageUrl?.startsWith('http')
              const showImage = !!rawImageUrl && (isExternal || localImgExists(rawImageUrl))

              const payments = (
                Array.isArray(r.payments) ? r.payments : r.payments ? [r.payments] : []
              ) as PaymentJoin[]
              const relevantPayment = payments.find((p) => p.status !== 'failed') ?? payments[0] ?? null

              return (
                <Link
                  key={r.id}
                  href={`/reserva/${r.token}`}
                  className={`flex flex-col sm:flex-row ${CARD} ${CARD_INTERACTIVE} overflow-hidden group`}
                >
                  <div className="relative w-full sm:w-64 h-48 sm:h-auto shrink-0 overflow-hidden">
                    {showImage && rawImageUrl ? (
                      <Image
                        src={rawImageUrl}
                        alt={room?.name ?? 'Acomodação'}
                        fill
                        unoptimized={isExternal}
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, 256px"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: PLACEHOLDER_GRADIENT }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/20 to-transparent sm:hidden" />
                  </div>

                  <div className="flex-1 p-7 md:p-8 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-serif text-[20px] md:text-[22px] font-bold text-navy-deep leading-snug">
                          {room?.name ?? 'Acomodação'}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-stone/70 tracking-wider mt-1">
                          {r.token}
                        </p>
                      </div>
                      <StatusBadge status={r.status} compact />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-stone mb-5">
                      <span>{fmt(r.check_in)} → {fmt(r.check_out)}</span>
                      <span className="text-driftwood/50">·</span>
                      <span>{r.adults} hóspede{r.adults > 1 ? 's' : ''}</span>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-serif text-[19px] font-bold text-navy-deep">{formatBRL(r.total_brl)}</span>
                        {relevantPayment && <PaymentBadge status={relevantPayment.status} compact />}
                      </div>
                      <span className="text-[12px] font-semibold text-navy-deep/70 group-hover:text-navy-deep transition-colors flex items-center gap-1.5 shrink-0">
                        Ver reserva
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </Container>
    </section>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
