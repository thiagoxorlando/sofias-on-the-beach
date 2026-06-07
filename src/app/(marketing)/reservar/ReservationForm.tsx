'use client'

import { useActionState } from 'react'
import { createReservationAction, type ReservationFormState } from './actions'
import { LABEL, INPUT, BTN_PRIMARY } from '@/components/booking/ui'

type Props = {
  roomId:     string
  checkIn:    string
  checkOut:   string
  guests:     number
  guestName:  string   // pre-filled from guests record
  guestPhone: string   // pre-filled from guests record
}

export function ReservationForm({ roomId, checkIn, checkOut, guests, guestName, guestPhone }: Props) {
  const [state, formAction, isPending] = useActionState<ReservationFormState, FormData>(
    createReservationAction,
    undefined,
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="room_id"   value={roomId} />
      <input type="hidden" name="check_in"  value={checkIn} />
      <input type="hidden" name="check_out" value={checkOut} />
      <input type="hidden" name="guests"    value={guests} />

      <div className="space-y-4">
        <div>
          <label className={LABEL}>Nome completo *</label>
          <input
            name="full_name"
            required
            type="text"
            autoComplete="name"
            defaultValue={guestName}
            className={INPUT}
            placeholder="Como consta no documento"
            disabled={isPending}
          />
        </div>

        <div>
          <label className={LABEL}>Nome de quem ficará hospedado *</label>
          <input
            name="guest_staying_name"
            required
            type="text"
            autoComplete="off"
            defaultValue={guestName}
            className={INPUT}
            placeholder="Nome completo de quem vai se hospedar"
            disabled={isPending}
          />
          <p className="text-[11px] text-stone mt-1.5 leading-relaxed">
            Pode ser diferente do titular da conta — informe quem realmente vai ficar na acomodação.
          </p>
        </div>

        <div>
          <label className={LABEL}>Telefone / WhatsApp</label>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={guestPhone}
            className={INPUT}
            placeholder="+55 22 99999-9999"
            disabled={isPending}
          />
        </div>

        <div>
          <label className={LABEL}>Pedidos especiais</label>
          <textarea
            name="special_requests"
            rows={3}
            className={`${INPUT} resize-none`}
            placeholder="Ex: cama extra, chegada tarde, aniversário…"
            disabled={isPending}
          />
        </div>
      </div>

      {state?.error && (
        <div className="px-5 py-3.5 bg-red-50 rounded-2xl">
          <p className="text-[13px] text-red-600 font-medium">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-4 text-[13px] ${BTN_PRIMARY}`}
      >
        {isPending ? 'Criando reserva…' : 'Confirmar pré-reserva'}
      </button>

      <p className="text-[11px] text-stone text-center">
        Sem cobrança agora · Confirmação por e-mail · Atendimento pelo WhatsApp
      </p>
    </form>
  )
}
