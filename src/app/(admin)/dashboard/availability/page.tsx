import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader } from '@/components/admin/AdminUI'
import { getRoomCalendarData } from '@/lib/roomCalendar'
import { RoomSelector, type RoomOption } from './_components/RoomSelector'
import { RoomCalendarPanel } from './_components/RoomCalendarPanel'

export const metadata: Metadata = { title: "Disponibilidade e tarifas — Painel Sofia's" }

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden'

const MONTH_RE = /^\d{4}-\d{2}$/

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function currentMonthStr(): string {
  const today = new Date()
  return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
}

type CategoryJoin = { name: string }
type RoomJoin = {
  id: string
  name: string
  sort_order: number
  max_guests: number
  base_price_brl: number
  room_categories: CategoryJoin | CategoryJoin[] | null
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

type SP = Promise<{ room_id?: string | string[]; month?: string | string[] }>

export default async function AvailabilityPage({ searchParams }: { searchParams: SP }) {
  await requireModule('availability')

  const sp = await searchParams
  const db = createAdminClient()

  const { data: roomsData } = await db
    .from('rooms')
    .select('id, name, sort_order, max_guests, base_price_brl, room_categories ( name )')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .returns<RoomJoin[]>()

  const rooms: RoomOption[] = (roomsData ?? []).map((r) => ({
    id:           r.id,
    name:         r.name,
    categoryName: one(r.room_categories)?.name ?? null,
    maxGuests:    r.max_guests,
    basePriceBrl: r.base_price_brl,
  }))

  if (rooms.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-6xl space-y-6">
        <AdminPageHeader
          eyebrow="Gestão"
          title="Disponibilidade e tarifas"
          subtitle="Selecione um quarto, marque datas no calendário e ajuste disponibilidade ou valores."
        />
        <div className={`${CARD} py-14 text-center text-[13px] text-slate-400`}>
          Nenhum quarto ativo encontrado. Cadastre um quarto para gerenciar disponibilidade e tarifas.
        </div>
      </div>
    )
  }

  const roomIdParam = typeof sp.room_id === 'string' ? sp.room_id : null
  const selectedRoomId = (roomIdParam && rooms.some((r) => r.id === roomIdParam)) ? roomIdParam : rooms[0].id

  const monthParamRaw = typeof sp.month === 'string' ? sp.month : null
  const monthParam = (monthParamRaw && MONTH_RE.test(monthParamRaw)) ? monthParamRaw : currentMonthStr()

  const month = await getRoomCalendarData(selectedRoomId, ...parseMonth(monthParam))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-7xl space-y-5">
      <AdminPageHeader
        eyebrow="Gestão"
        title="Disponibilidade e tarifas"
        subtitle="Selecione um quarto, marque datas no calendário e ajuste disponibilidade ou valores."
      />

      <RoomSelector rooms={rooms} selectedRoomId={selectedRoomId} />

      {month === null ? (
        <div className={`${CARD} py-14 text-center text-[13px] text-slate-400`}>
          Não foi possível carregar o calendário deste quarto.
        </div>
      ) : (
        <RoomCalendarPanel
          roomId={selectedRoomId}
          month={month}
          monthParam={monthParam}
          todayISO={todayISO()}
        />
      )}
    </div>
  )
}

function parseMonth(monthStr: string): [number, number] {
  const [y, m] = monthStr.split('-').map(Number)
  return [y, m]
}
