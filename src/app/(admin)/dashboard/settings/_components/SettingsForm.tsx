'use client'

import { useActionState } from 'react'
import { updateSiteSettingsAction, type ActionState } from '../actions'

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm p-5 md:p-6'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const TEXTAREA = `${INPUT} resize-none`

const LABEL = 'block text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em] mb-1.5'
const HINT  = 'text-slate-400 font-normal normal-case tracking-normal'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-5 py-2.5 ' +
  'text-[13px] font-semibold hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export type SiteSettingsFormValues = {
  businessName: string
  publicEmail: string
  phone: string
  whatsapp: string
  address: string
  city: string
  state: string
  instagramUrl: string
  facebookUrl: string
  mapsUrl: string
  checkInTime: string
  checkOutTime: string
  cancellationPolicy: string
  bookingConfirmationMessage: string
  manualPaymentHolderName: string
  manualPaymentBankName: string
  manualPaymentPixKey: string
  manualPaymentPixKeyType: string
  manualPaymentInstructions: string
  manualPaymentWhatsapp: string
}

function SelectField({ label, name, defaultValue, options, hint }: {
  label: string
  name: string
  defaultValue: string
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <div>
      <label className={LABEL}>
        {label} {hint && <span className={HINT}>{hint}</span>}
      </label>
      <select name={name} defaultValue={defaultValue} className={INPUT}>
        <option value="">— não informado —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Field({ label, name, defaultValue, type = 'text', placeholder, hint }: {
  label: string
  name: string
  defaultValue: string
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label className={LABEL}>
        {label} {hint && <span className={HINT}>{hint}</span>}
      </label>
      <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className={INPUT} />
    </div>
  )
}

export function SettingsForm({ initial }: { initial: SiteSettingsFormValues }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateSiteSettingsAction, undefined)

  return (
    <form action={formAction} className="space-y-5">

      {/* 1. Dados da pousada */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-4">Dados da pousada</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome da pousada" name="business_name" defaultValue={initial.businessName} />
          <Field label="E-mail público" name="public_email" type="email" defaultValue={initial.publicEmail} placeholder="contato@suapousada.com.br" />
          <Field label="Telefone" name="phone" defaultValue={initial.phone} placeholder="(22) 99999-9999" />
          <Field label="WhatsApp" name="whatsapp" defaultValue={initial.whatsapp} placeholder="5522999999999" hint="(código do país + DDD, somente números)" />
          <Field label="Endereço" name="address" defaultValue={initial.address} placeholder="Rua das Conchas, 123" />
          <Field label="Cidade" name="city" defaultValue={initial.city} />
          <Field label="Estado" name="state" defaultValue={initial.state} placeholder="RJ" />
          <Field label="Link do Google Maps" name="maps_url" type="url" defaultValue={initial.mapsUrl} placeholder="https://maps.app.goo.gl/…" />
        </div>
      </section>

      {/* 2. Redes sociais */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-4">Redes sociais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Instagram" name="instagram_url" type="url" defaultValue={initial.instagramUrl} placeholder="https://instagram.com/suapousada" />
          <Field label="Facebook" name="facebook_url" type="url" defaultValue={initial.facebookUrl} placeholder="https://facebook.com/suapousada" />
        </div>
      </section>

      {/* 3. Reservas */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-4">Reservas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Horário padrão de check-in" name="check_in_time" defaultValue={initial.checkInTime} placeholder="14:00" hint="(HH:MM)" />
          <Field label="Horário padrão de check-out" name="check_out_time" defaultValue={initial.checkOutTime} placeholder="12:00" hint="(HH:MM)" />
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div>
            <label className={LABEL}>Mensagem de confirmação</label>
            <textarea
              name="booking_confirmation_message"
              rows={3}
              defaultValue={initial.bookingConfirmationMessage}
              placeholder="Mensagem exibida ao hóspede quando a reserva é confirmada…"
              className={TEXTAREA}
            />
          </div>
          <div>
            <label className={LABEL}>Política de cancelamento</label>
            <textarea
              name="cancellation_policy"
              rows={4}
              defaultValue={initial.cancellationPolicy}
              placeholder="Descreva as condições de cancelamento e reembolso…"
              className={TEXTAREA}
            />
          </div>
        </div>
      </section>

      {/* 4. Pagamento manual interno */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Pagamento manual interno</h2>
        <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
          Usado apenas pela equipe para registrar pagamentos combinados diretamente com o hóspede.
          Essas informações não são exibidas no site enquanto o modo landing page estiver ativo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do titular" name="manual_payment_holder_name" defaultValue={initial.manualPaymentHolderName} placeholder="Sofia Rodrigues ou razão social" />
          <Field label="Banco" name="manual_payment_bank_name" defaultValue={initial.manualPaymentBankName} placeholder="Nubank, Itaú, Bradesco…" />
          <Field label="Chave PIX" name="manual_payment_pix_key" defaultValue={initial.manualPaymentPixKey} placeholder="chave@email.com, CPF, CNPJ ou chave aleatória" />
          <SelectField
            label="Tipo da chave PIX"
            name="manual_payment_pix_key_type"
            defaultValue={initial.manualPaymentPixKeyType}
            options={[
              { value: 'cpf_cnpj',  label: 'CPF / CNPJ' },
              { value: 'email',     label: 'E-mail' },
              { value: 'telefone',  label: 'Telefone' },
              { value: 'aleatoria', label: 'Chave aleatória' },
            ]}
          />
          <Field label="WhatsApp para pagamento" name="manual_payment_whatsapp" defaultValue={initial.manualPaymentWhatsapp} placeholder="5522999999999" hint="(código do país + DDD)" />
        </div>
        <div className="mt-4">
          <label className={LABEL}>Instruções de pagamento</label>
          <textarea
            name="manual_payment_instructions"
            rows={3}
            defaultValue={initial.manualPaymentInstructions}
            placeholder="Ex.: Faça um PIX para a chave abaixo e envie o comprovante pelo WhatsApp. O pagamento deve ser efetuado em até 24h para garantir a reserva."
            className={TEXTAREA}
          />
        </div>
      </section>

      {state && 'error' in state && (
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          Configurações salvas.
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
