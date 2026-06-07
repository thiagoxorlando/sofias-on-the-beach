'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BTN_PRIMARY } from '@/components/booking/ui'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

type Props = {
  initialCheckIn:  string | null
  initialCheckOut: string | null
  initialGuests:   number | null
}

export function RoomSearchBar({ initialCheckIn, initialCheckOut, initialGuests }: Props) {
  const router = useRouter()
  const [checkIn, setCheckIn]   = useState(initialCheckIn ?? '')
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? '')
  const [guests, setGuests]     = useState(initialGuests ?? 2)
  const [error, setError]       = useState<string | null>(null)

  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (checkOut && val && checkOut <= val) setCheckOut('')
  }

  function handleSubmit() {
    if (!checkIn || !checkOut) {
      setError('Selecione as datas de check-in e check-out.')
      return
    }
    if (checkOut <= checkIn) {
      setError('A data de check-out deve ser após o check-in.')
      return
    }
    setError(null)
    router.push(`/quartos?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`)
  }

  const today = todayStr()

  return (
    <div id="busca" className="scroll-mt-28">
      <div className="bg-white rounded-[26px] shadow-[0_24px_70px_-22px_rgba(0,40,80,0.18)] border border-foam overflow-hidden">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-foam">

          {/* Check-in */}
          <label className="flex-1 flex items-center gap-3.5 px-6 py-5 hover:bg-foam/35 transition-colors cursor-pointer">
            <div className="text-navy/45 shrink-0"><CalendarIcon /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-navy/55 uppercase tracking-widest mb-1">
                CHECK-IN
              </p>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="text-sm font-medium text-navy-deep/75 bg-transparent border-0 outline-none w-full cursor-pointer"
              />
            </div>
          </label>

          {/* Check-out */}
          <label className="flex-1 flex items-center gap-3.5 px-6 py-5 hover:bg-foam/35 transition-colors cursor-pointer">
            <div className="text-navy/45 shrink-0"><CalendarIcon /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-navy/55 uppercase tracking-widest mb-1">
                CHECK-OUT
              </p>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="text-sm font-medium text-navy-deep/75 bg-transparent border-0 outline-none w-full cursor-pointer"
              />
            </div>
          </label>

          {/* Guests */}
          <div className="flex-1 flex items-center gap-3.5 px-6 py-5">
            <div className="text-navy/45 shrink-0"><GuestIcon /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-navy/55 uppercase tracking-widest mb-1.5">
                HÓSPEDES
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="w-7 h-7 rounded-full bg-foam/70 flex items-center justify-center text-navy-deep hover:bg-mist/45 transition-colors font-bold text-base leading-none"
                  aria-label="Diminuir hóspedes"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-navy-deep/75 w-5 text-center tabular-nums">
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(10, g + 1))}
                  className="w-7 h-7 rounded-full bg-foam/70 flex items-center justify-center text-navy-deep hover:bg-mist/45 transition-colors font-bold text-base leading-none"
                  aria-label="Aumentar hóspedes"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center px-6 py-5">
            <button
              type="button"
              onClick={handleSubmit}
              className={`w-full md:w-auto px-8 py-3.5 text-[12px] uppercase tracking-widest ${BTN_PRIMARY}`}
            >
              Buscar disponibilidade
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3.5 bg-red-50">
            <p className="text-[12px] text-red-600 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

function GuestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
