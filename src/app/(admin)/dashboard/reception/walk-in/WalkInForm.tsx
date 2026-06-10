'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  checkWalkInAvailability,
  createWalkInReservationAction,
  type AvailableRoom,
} from './actions'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(value)
}

function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Styles ────────────────────────────────────────────────────────────────────

const LABEL = 'block text-[12px] font-semibold text-slate-600 mb-1.5'
const INPUT = 'w-full rounded-xl border border-admin-border bg-white px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40 transition-colors'
const SELECT_CLS = `${INPUT} appearance-none`
const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 rounded-xl bg-admin-sidebar-act hover:bg-admin-sidebar text-white font-semibold text-[13px] px-5 py-2.5 transition-colors disabled:opacity-50'
const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 rounded-xl border border-admin-border bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] px-5 py-2.5 transition-colors'

// ── Payment methods ───────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Dinheiro (caixa)' },
  { value: 'card_machine',  label: 'Cartão (maquininha)' },
  { value: 'pix_manual',    label: 'PIX (manual)' },
  { value: 'bank_transfer', label: 'Transferência bancária' },
  { value: 'pay_later',     label: 'Pagar depois' },
]

// ── Steps ─────────────────────────────────────────────────────────────────────

type Step = 'dates' | 'room' | 'guest'

type SuccessData = {
  token: string
  reservationId: string
  roomName: string
  total: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const PIX_KEY_TYPE_LABELS: Record<string, string> = {
  cpf_cnpj:  'CPF/CNPJ',
  email:     'E-mail',
  telefone:  'Telefone',
  aleatoria: 'Chave aleatória',
}

export function WalkInForm({ pixKey, pixKeyType }: { pixKey?: string; pixKeyType?: string }) {
  const [step, setStep] = useState<Step>('dates')
  const [isPending, startTransition] = useTransition()
  const [paymentMethod, setPaymentMethod] = useState('')

  // Step 1: dates
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [availError, setAvailError] = useState<string | null>(null)
  const [availRooms, setAvailRooms] = useState<AvailableRoom[] | null>(null)

  // Step 2: room selection
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null)

  // Step 3: guest info + result
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessData | null>(null)

  // ── Step 1 handler ────────────────────────────────────────────────────────
  function handleCheckAvailability() {
    setAvailError(null)
    setAvailRooms(null)
    setSelectedRoom(null)

    startTransition(async () => {
      const result = await checkWalkInAvailability(checkIn, checkOut)
      if ('error' in result) {
        setAvailError(result.error)
      } else {
        setAvailRooms(result.rooms)
        if (result.rooms.length > 0) {
          setStep('room')
        } else {
          setAvailError('Nenhum quarto disponível para o período selecionado.')
        }
      }
    })
  }

  // ── Step 3 handler ────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('room_id',   selectedRoom!.id)
    formData.set('check_in',  checkIn)
    formData.set('check_out', checkOut)

    startTransition(async () => {
      const result = await createWalkInReservationAction(formData)
      if ('error' in result) {
        setSubmitError(result.error)
      } else {
        setSuccess({
          token: result.token,
          reservationId: result.reservationId,
          roomName: selectedRoom!.name,
          total: selectedRoom!.total,
        })
      }
    })
  }

  // ── Step indicator ────────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: 'dates', label: 'Datas' },
    { key: 'room',  label: 'Quarto' },
    { key: 'guest', label: 'Hóspede' },
  ]
  const stepIdx = steps.findIndex((s) => s.key === step)

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-[700px]">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          {/* Green banner */}
          <div className="bg-emerald-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircleIcon />
              </div>
              <div>
                <p className="font-bold text-[17px]">Reserva criada com sucesso!</p>
                <p className="text-[13px] text-white/80 mt-0.5">Código: {success.token}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Quarto</p>
                <p className="text-[14px] font-bold text-slate-800 mt-1">{success.roomName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Total</p>
                <p className="text-[14px] font-bold text-slate-800 mt-1">{formatBRL(success.total)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Reserva</p>
                <p className="text-[14px] font-bold text-slate-800 mt-1 font-mono">{success.token}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 py-5 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/reservations/${success.reservationId}`}
              className={BTN_PRIMARY}
            >
              Abrir reserva
            </Link>
            <Link
              href={`/dashboard/reservations/${success.reservationId}`}
              className={BTN_SECONDARY}
            >
              Registrar pagamento
            </Link>
            <Link
              href={`/dashboard/reservations/${success.reservationId}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN_SECONDARY}
            >
              Imprimir ficha
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccess(null)
                setStep('dates')
                setCheckIn('')
                setCheckOut('')
                setAvailRooms(null)
                setSelectedRoom(null)
              }}
              className="inline-flex items-center text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors ml-auto"
            >
              Nova reserva
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[700px] space-y-6">

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                i < stepIdx
                  ? 'bg-emerald-500 text-white'
                  : i === stepIdx
                  ? 'bg-admin-sidebar-act text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className={`text-[11px] font-semibold mt-1 ${i === stepIdx ? 'text-admin-sidebar-act' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 mb-3 rounded-full transition-colors ${i < stepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Dates ── */}
      {step === 'dates' && (
        <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800">Selecione o período</h2>
            <p className="text-[13px] text-slate-400 mt-1">Informe as datas de check-in e check-out para verificar disponibilidade.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Check-in</label>
              <input
                type="date"
                value={checkIn}
                min={todayISO()}
                onChange={(e) => setCheckIn(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || todayISO()}
                onChange={(e) => setCheckOut(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {availError && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {availError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={!checkIn || !checkOut || isPending}
              className={BTN_PRIMARY}
            >
              {isPending ? <Spinner /> : null}
              Verificar disponibilidade
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Room selection ── */}
      {step === 'room' && availRooms && (
        <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800">Escolha o quarto</h2>
            <p className="text-[13px] text-slate-400 mt-1">
              {checkIn} → {checkOut} · {availRooms.length} quarto{availRooms.length !== 1 ? 's' : ''} disponível{availRooms.length !== 1 ? 'is' : ''}
            </p>
          </div>

          <div className="space-y-3">
            {availRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => { setSelectedRoom(room); setStep('guest') }}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                  selectedRoom?.id === room.id
                    ? 'border-admin-sidebar-act bg-admin-sidebar-act/5 ring-1 ring-admin-sidebar-act/30'
                    : 'border-admin-border hover:border-admin-sidebar-act/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-slate-800">{room.name}</p>
                    {room.description && (
                      <p className="text-[12px] text-slate-400 mt-0.5 line-clamp-2">{room.description}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Máx. {room.max_guests} hóspede{room.max_guests !== 1 ? 's' : ''} · {room.nights} noite{room.nights !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[17px] text-slate-800">{formatBRL(room.total)}</p>
                    <p className="text-[11px] text-slate-400">{formatBRL(room.basePrice)}/noite</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('dates')} className={BTN_SECONDARY}>
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Guest info ── */}
      {step === 'guest' && selectedRoom && (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Reservation summary */}
          <div className="bg-admin-sidebar/5 border border-admin-sidebar/10 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[12px] text-slate-500">Quarto selecionado</p>
              <p className="font-bold text-[15px] text-slate-800 mt-0.5">{selectedRoom.name}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {checkIn} → {checkOut} · {selectedRoom.nights} noite{selectedRoom.nights !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-slate-500">Total</p>
              <p className="font-bold text-[20px] text-slate-800">{formatBRL(selectedRoom.total)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Dados do hóspede</h2>
              <p className="text-[13px] text-slate-400 mt-1">Se já existe uma conta com este e-mail, os dados serão atualizados.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="guest_name">Nome completo *</label>
                <input
                  id="guest_name"
                  name="guest_name"
                  type="text"
                  required
                  placeholder="Nome completo do hóspede"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="guest_email">E-mail *</label>
                <input
                  id="guest_email"
                  name="guest_email"
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="guest_phone">Telefone / WhatsApp</label>
                <input
                  id="guest_phone"
                  name="guest_phone"
                  type="tel"
                  placeholder="+55 (21) 99999-9999"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="guest_cpf">CPF</label>
                <input
                  id="guest_cpf"
                  name="guest_cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  className={INPUT}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL} htmlFor="adults">Adultos *</label>
                  <input
                    id="adults"
                    name="adults"
                    type="number"
                    required
                    min={1}
                    max={selectedRoom.max_guests}
                    defaultValue={1}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="children">Crianças</label>
                  <input
                    id="children"
                    name="children"
                    type="number"
                    min={0}
                    max={selectedRoom.max_guests}
                    defaultValue={0}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="special_requests">Pedidos especiais</label>
                <textarea
                  id="special_requests"
                  name="special_requests"
                  rows={3}
                  placeholder="Pedidos de horário, necessidades especiais, acessibilidade…"
                  className={`${INPUT} resize-none`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="payment_method">Forma de pagamento *</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  required
                  defaultValue=""
                  className={SELECT_CLS}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="" disabled>Selecione…</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {paymentMethod === 'pix_manual' && pixKey && (
                  <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <p className="text-[11px] font-bold text-sky-700 uppercase tracking-[0.08em] mb-1">Chave PIX configurada</p>
                    <p className="text-[13px] font-mono font-semibold text-sky-900">{pixKey}</p>
                    {pixKeyType && (
                      <p className="text-[11px] text-sky-600 mt-0.5">{PIX_KEY_TYPE_LABELS[pixKeyType] ?? pixKeyType}</p>
                    )}
                  </div>
                )}
                {paymentMethod === 'pix_manual' && !pixKey && (
                  <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Chave PIX não configurada. Acesse Configurações para cadastrá-la.
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep('room')} className={BTN_SECONDARY}>
                ← Voltar
              </button>
              <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
                {isPending ? <Spinner /> : null}
                Confirmar reserva
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
