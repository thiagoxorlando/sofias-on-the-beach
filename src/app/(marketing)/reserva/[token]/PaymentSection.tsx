'use client'

import { useState, useTransition } from 'react'
import { generatePixPaymentAction, generateCardPaymentAction } from './paymentActions'
import { PAYMENT_UNAVAILABLE_MESSAGE } from './paymentMessages'
import { LABEL, INPUT, BTN_PRIMARY, BTN_SECONDARY } from '@/components/booking/ui'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'

export type InitialPayment = {
  method:       'pix' | 'card'
  invoiceUrl:   string | null
  pixQrCode:    string | null
  pixCopyPaste: string | null
} | null

type PaymentData = {
  method:       'pix' | 'card'
  invoiceUrl:   string | null
  pixQrCode:    string | null
  pixCopyPaste: string | null
}

type View = 'choice' | 'card-form'

export function PaymentSection({
  reservationToken,
  initialPayment,
}: {
  reservationToken: string
  initialPayment:   InitialPayment
}) {
  const [payment, setPayment] = useState<PaymentData | null>(initialPayment)
  const [view, setView]       = useState<View>('choice')
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const [pixPending, startPixTransition] = useTransition()

  // ── PIX handler ──────────────────────────────────────────────────────────
  function handlePixGenerate() {
    setError(null)
    const fd = new FormData()
    fd.append('token', reservationToken)
    startPixTransition(async () => {
      const result = await generatePixPaymentAction(undefined, fd)
      if (!result) return
      if ('error' in result) {
        setError(result.error)
      } else {
        setPayment({ method: 'pix', invoiceUrl: result.invoiceUrl, pixQrCode: result.pixQrCode, pixCopyPaste: result.pixCopyPaste })
      }
    })
  }

  async function handleCopy() {
    if (!payment?.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* fallback */ }
  }

  // ── Payment already done — show result ───────────────────────────────────
  if (payment) {
    if (payment.method === 'card') {
      return (
        <div className="space-y-5">
          <div className="bg-emerald-50 rounded-2xl p-5">
            <p className="text-[14px] text-emerald-700 font-medium leading-relaxed">
              Pagamento enviado! Seu cartão está sendo processado. Você receberá a confirmação por e-mail em breve.
            </p>
          </div>
          {payment.invoiceUrl && (
            <a
              href={payment.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`gap-2 w-full py-3.5 text-[12px] ${BTN_SECONDARY}`}
            >
              <ExternalLinkIcon />
              Abrir link de pagamento
            </a>
          )}
          <p className="text-[11px] text-stone text-center">
            Pagamento processado com segurança pela Asaas
          </p>
        </div>
      )
    }

    // PIX payment result
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-mist/35 flex items-center justify-center text-navy-deep shrink-0">
            <PixIcon />
          </span>
          <p className="text-[15px] font-bold text-navy-deep">Pague via PIX</p>
        </div>

        {payment.pixQrCode && (
          <div className="flex justify-center">
            <div className="bg-white border border-foam rounded-[22px] p-4 shadow-[0_18px_50px_-18px_rgba(0,40,80,0.18)] inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${payment.pixQrCode}`}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="block"
              />
            </div>
          </div>
        )}

        {payment.pixCopyPaste && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-stone/80 uppercase tracking-widest">
              PIX copia e cola
            </p>
            <div className="flex gap-2.5 items-stretch">
              <textarea
                readOnly
                value={payment.pixCopyPaste}
                rows={3}
                className="flex-1 text-[11px] text-navy font-mono bg-foam/40 rounded-2xl px-3.5 py-3 resize-none outline-none select-all shadow-[inset_0_1px_2px_rgba(0,40,80,0.05)]"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-mist/35 text-navy hover:bg-mist/55'
                }`}
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {payment.invoiceUrl && (
          <a
            href={payment.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`gap-2 w-full py-3.5 text-[12px] ${BTN_SECONDARY}`}
          >
            <ExternalLinkIcon />
            Abrir link de pagamento
          </a>
        )}

        <p className="text-[11px] text-stone text-center">
          O pagamento é processado com segurança pela Asaas · PIX disponível 24 horas
        </p>
      </div>
    )
  }

  // ── Card form ─────────────────────────────────────────────────────────────
  if (view === 'card-form') {
    return (
      <CardForm
        reservationToken={reservationToken}
        onBack={() => { setView('choice'); setError(null) }}
        onResult={(data) => setPayment(data)}
      />
    )
  }

  // ── Method choice ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <p className="text-[11px] font-bold text-stone/80 uppercase tracking-widest">
        Escolha o método de pagamento
      </p>

      {error && <PaymentErrorNotice message={error} reservationToken={reservationToken} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handlePixGenerate}
          disabled={pixPending}
          className="group flex flex-col gap-5 bg-navy-deep text-ivory px-6 py-7 rounded-[24px] shadow-[0_22px_60px_-16px_rgba(0,40,80,0.40)] hover:shadow-[0_30px_80px_-16px_rgba(0,40,80,0.50)] hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <PixIcon />
            </div>
            {!pixPending && <ChevronRightIcon />}
            {pixPending && <SpinnerIcon />}
          </div>
          <div>
            <p className="text-[16px] font-bold leading-tight font-serif">PIX</p>
            <p className="text-[12px] text-ivory/60 mt-1.5 leading-relaxed">
              {pixPending ? 'Gerando cobrança…' : 'QR Code ou copia-e-cola — aprovação imediata'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setError(null); setView('card-form') }}
          className="group flex flex-col gap-5 bg-white border border-foam text-navy px-6 py-7 rounded-[24px] shadow-[0_18px_54px_-20px_rgba(0,40,80,0.14)] hover:shadow-[0_30px_80px_-18px_rgba(0,40,80,0.20)] hover:-translate-y-1 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-mist/35 flex items-center justify-center">
              <CardIcon />
            </div>
            <ChevronRightDarkIcon />
          </div>
          <div>
            <p className="text-[16px] font-bold leading-tight text-navy-deep font-serif">Cartão de crédito</p>
            <p className="text-[12px] text-stone mt-1.5 leading-relaxed">Visa, Mastercard, Elo e outros</p>
          </div>
        </button>
      </div>

      <p className="text-[11px] text-stone text-center">
        Pagamento seguro via Asaas · Dados criptografados
      </p>
    </div>
  )
}

// ── Error notice ───────────────────────────────────────────────────────────
// When the gateway is unavailable, guests get a calm WhatsApp hand-off instead
// of a technical failure message they can't act on.

function PaymentErrorNotice({ message, reservationToken }: { message: string; reservationToken: string }) {
  if (message === PAYMENT_UNAVAILABLE_MESSAGE) {
    const waMsg = encodeURIComponent(
      `Olá! Estou tentando pagar a reserva ${reservationToken}, mas o pagamento online não está disponível no momento. Podem me ajudar?`,
    )
    const waHref = `https://wa.me/${WA_NUMBER}?text=${waMsg}`
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-white border border-foam rounded-[24px] px-6 py-6 shadow-[0_18px_54px_-20px_rgba(0,40,80,0.14)]">
        <div className="shrink-0 w-12 h-12 rounded-full bg-mist/40 flex items-center justify-center text-navy-deep">
          <ConciergeIcon />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-[13px] font-bold text-navy-deep">Nossa equipe pode ajudar com isso</p>
          <p className="text-[13px] text-stone leading-relaxed">{message}</p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`gap-2 px-5 py-2.5 text-[12px] ${BTN_PRIMARY}`}
          >
            <WAIcon />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-3.5 bg-red-50 rounded-2xl">
      <p className="text-[13px] text-red-600 font-medium">{message}</p>
    </div>
  )
}

// ── Card form component ────────────────────────────────────────────────────

function CardForm({
  reservationToken,
  onBack,
  onResult,
}: {
  reservationToken: string
  onBack: () => void
  onResult: (data: { method: 'card'; invoiceUrl: string | null; pixQrCode: null; pixCopyPaste: null }) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cardNum, setCardNum] = useState('')

  function handleCardNumChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCardNum(digits.replace(/(.{4})/g, '$1 ').trim())
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('token', reservationToken)
    startTransition(async () => {
      const result = await generateCardPaymentAction(undefined, fd)
      if (!result) return
      if ('error' in result) {
        setError(result.error)
      } else {
        onResult({ method: 'card', invoiceUrl: result.invoiceUrl, pixQrCode: null, pixCopyPaste: null })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[12px] text-stone hover:text-navy-deep transition-colors flex items-center gap-1"
        >
          <ArrowLeftIcon />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <CardIcon />
          <p className="text-[13px] font-bold text-navy-deep">Cartão de crédito</p>
        </div>
      </div>

      <div>
        <label className={LABEL}>Nome no cartão</label>
        <input
          name="holder_name"
          type="text"
          required
          autoComplete="cc-name"
          placeholder="Como impresso no cartão"
          className={INPUT}
          disabled={isPending}
        />
      </div>

      <div>
        <label className={LABEL}>Número do cartão</label>
        <input
          name="card_number"
          type="text"
          inputMode="numeric"
          required
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={cardNum}
          onChange={handleCardNumChange}
          className={INPUT}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Mês</label>
          <input
            name="expiry_month"
            type="text"
            inputMode="numeric"
            required
            maxLength={2}
            autoComplete="cc-exp-month"
            placeholder="MM"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div>
          <label className={LABEL}>Ano</label>
          <input
            name="expiry_year"
            type="text"
            inputMode="numeric"
            required
            maxLength={4}
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            className={INPUT}
            disabled={isPending}
          />
        </div>
        <div>
          <label className={LABEL}>CVV</label>
          <input
            name="ccv"
            type="password"
            inputMode="numeric"
            required
            maxLength={4}
            autoComplete="cc-csc"
            placeholder="•••"
            className={INPUT}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-foam/35 px-5 py-5">
        <p className="text-[10px] font-bold text-stone/80 uppercase tracking-widest mb-4">
          Dados de cobrança
        </p>

        <div className="space-y-3">
          <div>
            <label className={LABEL}>CPF ou CNPJ do titular</label>
            <input
              name="cpf_cnpj"
              type="text"
              inputMode="numeric"
              required
              maxLength={18}
              placeholder="000.000.000-00"
              className={INPUT}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>CEP</label>
              <input
                name="postal_code"
                type="text"
                inputMode="numeric"
                required
                maxLength={9}
                placeholder="00000-000"
                className={INPUT}
                disabled={isPending}
              />
            </div>
            <div>
              <label className={LABEL}>Número</label>
              <input
                name="address_number"
                type="text"
                required
                maxLength={10}
                placeholder="Ex: 123"
                className={INPUT}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {error && <PaymentErrorNotice message={error} reservationToken={reservationToken} />}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full gap-2 py-4 text-[13px] uppercase tracking-wide ${BTN_PRIMARY}`}
      >
        {isPending ? (
          <>
            <SpinnerIcon />
            Processando…
          </>
        ) : (
          'Pagar com cartão'
        )}
      </button>

      <p className="text-[11px] text-stone text-center">
        Dados transmitidos com segurança · Não armazenamos dados do cartão
      </p>
    </form>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ConciergeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true">
      <circle cx={12} cy={8} r={4} />
      <path d="M5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
      <path d="M9 8h.01M15 8h.01" />
    </svg>
  )
}

function PixIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path d="M14.667 4.293a2.667 2.667 0 0 1 3.773 0l1.267 1.267a2.667 2.667 0 0 1 0 3.773l-1.62 1.62a.75.75 0 0 1-1.06-1.06l1.62-1.62a1.167 1.167 0 0 0 0-1.651l-1.267-1.267a1.167 1.167 0 0 0-1.651 0l-1.62 1.62a.75.75 0 0 1-1.06-1.06l1.618-1.622ZM7.374 13.227a.75.75 0 0 1 0 1.06l-1.62 1.62a1.167 1.167 0 0 0 0 1.652l1.267 1.267a1.167 1.167 0 0 0 1.652 0l1.62-1.62a.75.75 0 1 1 1.06 1.06l-1.62 1.62a2.667 2.667 0 0 1-3.773 0L4.693 17.62a2.667 2.667 0 0 1 0-3.773l1.62-1.62a.75.75 0 0 1 1.061 0ZM15.22 8.78a.75.75 0 0 1 0 1.06l-5.44 5.44a.75.75 0 0 1-1.06-1.06l5.44-5.44a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
      <rect x={1} y={4} width={22} height={16} rx={2} ry={2} />
      <line x1={1} y1={10} x2={23} y2={10} />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-ivory/50" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChevronRightDarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-driftwood" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1={10} y1={14} x2={21} y2={3} />
    </svg>
  )
}
