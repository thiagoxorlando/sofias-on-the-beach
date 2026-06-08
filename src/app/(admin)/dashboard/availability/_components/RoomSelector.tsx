'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SELECT =
  'border border-admin-border rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-800 bg-white w-full sm:w-auto sm:min-w-[260px] ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

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
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5 md:p-7">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em] mb-2.5">
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
          ? 'inline-flex items-center gap-1.5 rounded-full bg-admin-sidebar/5 border border-admin-sidebar/15 px-3.5 py-2 text-[12.5px]'
          : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-admin-border px-3.5 py-2 text-[12.5px]'
      }
    >
      <span className="text-slate-400">{label}:</span>
      <span className={accent ? 'font-bold text-admin-sidebar' : 'font-bold text-slate-700'}>{value}</span>
    </span>
  )
}
