'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function BookingWidget() {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [error, setError] = useState<string | null>(null)

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
    <div>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,40,80,0.14)] border border-ocean-100 overflow-hidden">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-ocean-100">

          {/* Check-in */}
          <label className="flex-1 flex items-center gap-3.5 px-6 py-4 hover:bg-ocean-50/60 transition-colors cursor-pointer">
            <div className="text-ocean-400 shrink-0"><CalendarIcon /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-0.5">
                CHECK-IN
              </p>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="text-sm font-medium text-foreground/70 bg-transparent border-0 outline-none w-full cursor-pointer"
              />
            </div>
          </label>

          {/* Check-out */}
          <label className="flex-1 flex items-center gap-3.5 px-6 py-4 hover:bg-ocean-50/60 transition-colors cursor-pointer">
            <div className="text-ocean-400 shrink-0"><CalendarIcon /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-0.5">
                CHECK-OUT
              </p>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="text-sm font-medium text-foreground/70 bg-transparent border-0 outline-none w-full cursor-pointer"
              />
            </div>
          </label>

          {/* Guests */}
          <div className="flex-1 flex items-center gap-3.5 px-6 py-4">
            <div className="text-ocean-400 shrink-0"><GuestIcon /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-ocean-500 uppercase tracking-widest mb-1">
                HÓSPEDES
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="w-6 h-6 rounded-full border border-ocean-200 flex items-center justify-center text-ocean-600 hover:bg-ocean-50 transition-colors font-bold text-base leading-none"
                  aria-label="Diminuir hóspedes"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-foreground/70 w-5 text-center tabular-nums">
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(10, g + 1))}
                  className="w-6 h-6 rounded-full border border-ocean-200 flex items-center justify-center text-ocean-600 hover:bg-ocean-50 transition-colors font-bold text-base leading-none"
                  aria-label="Aumentar hóspedes"
                >
                  +
                </button>
                <span className="text-[12px] text-foreground/40">
                  {guests === 1 ? 'adulto' : 'adultos'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center px-5 py-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full md:w-auto bg-ocean-900 text-white px-7 py-3.5 rounded-xl font-bold text-[13px] hover:bg-ocean-800 transition-colors whitespace-nowrap uppercase tracking-widest shadow-sm"
            >
              Ver disponibilidade
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 border-t border-red-100 bg-red-50">
            <p className="text-[12px] text-red-600 font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center mt-3">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
          <LockIcon />
          <p className="text-[10px] font-semibold text-ocean-800 uppercase tracking-[0.22em] opacity-90">
            Reserva direta · Melhor tarifa garantida · Atendimento pelo WhatsApp
          </p>
        </div>
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-muted-foreground/50 shrink-0" aria-hidden="true">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
