'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SELECT =
  'border border-ocean-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-ocean-900 bg-white min-w-[260px] ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent'

export type RoomOption = {
  id: string
  name: string
  categoryName: string | null
  maxGuests: number
  basePriceBrl: number
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function RoomSelector({ rooms, selectedRoomId }: { rooms: RoomOption[]; selectedRoomId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = rooms.find((r) => r.id === selectedRoomId) ?? null

  function handleChange(roomId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('room_id', roomId)
    params.delete('month')
    router.push(`/dashboard/availability?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-[18px] border border-ocean-100 p-5 md:p-7">
      <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-[0.14em] mb-2.5">
        Quarto selecionado
      </p>

      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <select
          value={selectedRoomId}
          onChange={(e) => handleChange(e.target.value)}
          className={SELECT}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}{room.categoryName ? ` — ${room.categoryName}` : ''}
            </option>
          ))}
        </select>

        {selected && (
          <div className="flex flex-wrap items-center gap-2.5">
            <InfoPill label="Categoria" value={selected.categoryName ?? '—'} />
            <InfoPill label="Capacidade" value={`${selected.maxGuests} hóspede${selected.maxGuests !== 1 ? 's' : ''}`} />
            <InfoPill label="Diária base" value={`${formatBRL(selected.basePriceBrl)} / noite`} accent />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? 'inline-flex items-center gap-1.5 rounded-full bg-navy/5 border border-navy/15 px-3.5 py-2 text-[12.5px]'
          : 'inline-flex items-center gap-1.5 rounded-full bg-ocean-50 border border-ocean-100 px-3.5 py-2 text-[12.5px]'
      }
    >
      <span className="text-ocean-400">{label}:</span>
      <span className={accent ? 'font-bold text-navy' : 'font-bold text-ocean-800'}>{value}</span>
    </span>
  )
}
