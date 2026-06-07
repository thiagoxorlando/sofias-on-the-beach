'use client'

import { useState, useTransition } from 'react'
import { createReservationAction } from './actions'

const INPUT =
  'w-full px-4 py-3 rounded-xl border border-ocean-100 bg-white text-[14px] text-foreground placeholder:text-foreground/30 outline-none focus:border-ocean-400 focus:ring-1 focus:ring-ocean-200 transition-colors resize-none'

type Props = {
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
}

export function ReservationForm({ roomId, checkIn, checkOut, guests }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createReservationAction(undefined, fd)
      if (result && 'error' in result) setError(result.error)
      // redirect() in the action handles navigation on success
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Booking params as hidden fields */}
      <input type="hidden" name="room_id"   value={roomId} />
      <input type="hidden" name="check_in"  value={checkIn} />
      <input type="hidden" name="check_out" value={checkOut} />
      <input type="hidden" name="guests"    value={guests} />

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-ocean-700 uppercase tracking-[0.12em] mb-1.5">
            Nome completo *
          </label>
          <input
            name="full_name"
            required
            type="text"
            autoComplete="name"
            className={INPUT}
            placeholder="Como consta no documento"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ocean-700 uppercase tracking-[0.12em] mb-1.5">
            E-mail *
          </label>
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            className={INPUT}
            placeholder="seu@email.com"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ocean-700 uppercase tracking-[0.12em] mb-1.5">
            Telefone / WhatsApp
          </label>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className={INPUT}
            placeholder="+55 22 99999-9999"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ocean-700 uppercase tracking-[0.12em] mb-1.5">
            Pedidos especiais
          </label>
          <textarea
            name="special_requests"
            rows={3}
            className={INPUT}
            placeholder="Ex: cama extra, chegada tarde, aniversário…"
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[13px] text-red-600 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-ocean-900 text-white py-4 rounded-xl font-bold text-[13px] hover:bg-ocean-800 transition-colors shadow-sm uppercase tracking-[0.10em] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Criando reserva…' : 'Confirmar pré-reserva'}
      </button>

      <p className="text-[11px] text-ocean-400 text-center">
        Sem cobrança agora · Confirmação por e-mail · Atendimento pelo WhatsApp
      </p>
    </form>
  )
}
