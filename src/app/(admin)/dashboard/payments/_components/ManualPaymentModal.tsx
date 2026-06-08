'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { confirmManualPaymentAction, type ActionState } from '../actions'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const TEXTAREA = `${INPUT} resize-none`

const LABEL = 'block text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em] mb-1.5'
const HINT  = 'text-slate-400 font-normal normal-case tracking-normal'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-5 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-5 py-2.5 ' +
  'text-[12px] font-semibold hover:bg-slate-50 transition-colors'

export const MANUAL_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: 'pix_manual',    label: 'PIX manual' },
  { value: 'cash',          label: 'Dinheiro' },
  { value: 'bank_transfer', label: 'Transferência bancária' },
  { value: 'card_machine',  label: 'Máquina de cartão' },
  { value: 'other',         label: 'Outro' },
]

const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  paymentId?: string | null
  reservationId?: string | null
  amount: number
  onClose: () => void
  onSuccess: () => void
}

export function ManualPaymentModal({ paymentId, reservationId, amount, onClose, onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(confirmManualPaymentAction, undefined)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state && 'success' in state) onSuccess()
  }, [state, onSuccess])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    setFileName(null)
    if (!file) return

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setFileError('Formato inválido. Envie uma imagem (JPG, PNG, WebP) ou PDF.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setFileError('Arquivo muito grande. O limite é 5MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setFileName(file.name)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[22px] shadow-[0_24px_64px_rgba(0,18,50,0.20)] w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-7">
        <h2 className="text-[20px] font-bold text-slate-800 mb-1.5">Confirmar pagamento manual</h2>
        <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
          Use isto quando o pagamento foi recebido fora do Asaas (PIX direto, dinheiro, transferência, máquina de cartão).
          Os detalhes ficam registrados na reserva e no financeiro.
        </p>

        <form action={formAction} className="space-y-4">
          {paymentId ? (
            <input type="hidden" name="payment_id" value={paymentId} />
          ) : (
            <input type="hidden" name="reservation_id" value={reservationId ?? ''} />
          )}

          <div>
            <label className={LABEL}>Forma de pagamento</label>
            <select name="manual_payment_method" required defaultValue="" className={INPUT}>
              <option value="" disabled>Selecione…</option>
              {MANUAL_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Valor pago (R$)</label>
              <input
                type="number"
                name="amount_brl"
                required
                min="0.01"
                step="0.01"
                defaultValue={amount.toFixed(2)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Data do pagamento</label>
              <input type="date" name="paid_at" required defaultValue={todayISO()} className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Observação interna <span className={HINT}>(opcional)</span></label>
            <textarea
              name="note"
              rows={3}
              placeholder="Ex.: pago na recepção, conferido com o hóspede…"
              className={TEXTAREA}
            />
          </div>

          <div>
            <label className={LABEL}>
              Comprovante / recibo <span className={HINT}>(recomendado — imagem ou PDF, até 5MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              name="receipt"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-[13px] text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.08em] file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer cursor-pointer"
            />
            {fileName && !fileError && <p className="text-[12px] text-emerald-600 mt-1.5">Selecionado: {fileName}</p>}
            {fileError && <p className="text-[12px] text-red-600 mt-1.5">{fileError}</p>}
          </div>

          {state && 'error' in state && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancelar</button>
            <button type="submit" disabled={isPending || !!fileError} className={BTN_PRIMARY}>
              {isPending ? 'Confirmando…' : 'Confirmar pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
