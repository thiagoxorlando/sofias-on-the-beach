import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader } from '@/components/admin/AdminUI'
import { SettingsForm, type SiteSettingsFormValues } from './_components/SettingsForm'
import { BookingModeToggle } from './_components/BookingModeToggle'

export const metadata: Metadata = { title: "Configurações — Painel Sofia's" }

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm p-5 md:p-6'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export default async function SettingsPage() {
  await requireModule('settings')

  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value')
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))
  const onlineBookingEnabled = byKey.get('online_booking_enabled') === true || byKey.get('online_booking_enabled') === 'true'

  const initial: SiteSettingsFormValues = {
    businessName:               asString(byKey.get('pousada_name')),
    publicEmail:                asString(byKey.get('pousada_email')),
    phone:                      asString(byKey.get('phone')),
    whatsapp:                   asString(byKey.get('whatsapp_number')),
    address:                    asString(byKey.get('address')),
    city:                       asString(byKey.get('city')),
    state:                      asString(byKey.get('state')),
    instagramUrl:               asString(byKey.get('instagram_url')),
    facebookUrl:                asString(byKey.get('facebook_url')),
    mapsUrl:                    asString(byKey.get('maps_url')),
    checkInTime:                asString(byKey.get('check_in_time')),
    checkOutTime:               asString(byKey.get('check_out_time')),
    cancellationPolicy:         asString(byKey.get('cancellation_policy')),
    bookingConfirmationMessage: asString(byKey.get('booking_confirmation_message')),
    manualPaymentHolderName:    asString(byKey.get('manual_payment_holder_name')),
    manualPaymentBankName:      asString(byKey.get('manual_payment_bank_name')),
    manualPaymentPixKey:        asString(byKey.get('manual_payment_pix_key')),
    manualPaymentPixKeyType:    asString(byKey.get('manual_payment_pix_key_type')),
    manualPaymentInstructions:  asString(byKey.get('manual_payment_instructions')),
    manualPaymentWhatsapp:      asString(byKey.get('manual_payment_whatsapp')),
  }

  // Payment status — read-only. PIX and credit card are both billing types of
  // the same Asaas integration (see src/lib/asaas/client.ts), gated by the
  // same server-only ASAAS_API_KEY — there is no separate per-method toggle to
  // surface. Never read or display the key itself, only whether it's set.
  const asaasConfigured = !!process.env.ASAAS_API_KEY?.trim()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-4xl space-y-6">

      <AdminPageHeader
        eyebrow="Sistema"
        title="Configurações"
        subtitle="Dados públicos da pousada, redes sociais e parâmetros de reserva — exibidos no site e usados pela equipe."
      />

      {/* Reservas online — admin toggle */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Reservas online</h2>
        <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
          Controla se o formulário de reserva está disponível no site. Desative para lançar o site
          como landing page primeiro — hóspedes serão direcionados ao WhatsApp. Recepção e reservas
          internas continuam funcionando normalmente.
        </p>
        <BookingModeToggle enabled={onlineBookingEnabled} />
      </section>

      <SettingsForm initial={initial} />

      {/* Pagamentos — read-only status */}
      <section className={CARD}>
        <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Pagamentos</h2>
        <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
          Status da integração de pagamentos. Credenciais ficam apenas no servidor (variáveis de ambiente)
          e não podem ser visualizadas ou editadas por aqui.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PaymentStatusPill label="Asaas" ok={asaasConfigured} okText="Configurado" notText="Não configurado" />
          <PaymentStatusPill label="PIX" ok={asaasConfigured} okText="Disponível" notText="Não disponível" />
          <PaymentStatusPill label="Cartão de crédito" ok={asaasConfigured} okText="Disponível" notText="Não disponível" />
        </div>
        {!asaasConfigured && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
            <p className="text-[12px] font-semibold text-slate-700">
              Modo manual — configuração pendente
            </p>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Pagamentos online via PIX e cartão ainda não estão configurados. No momento, pagamentos são
              combinados diretamente pelo WhatsApp entre a equipe e o hóspede.
              Para ativar o gateway, defina <code className="font-mono text-[11px]">ASAAS_API_KEY</code> nas variáveis de ambiente do servidor.
            </p>
          </div>
        )}
      </section>

    </div>
  )
}

function PaymentStatusPill({ label, ok, okText, notText }: {
  label: string
  ok: boolean
  okText: string
  notText: string
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-admin-border bg-slate-50'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-slate-500 mb-1">{label}</p>
      <p className={`text-[13px] font-semibold ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
        {ok ? okText : notText}
      </p>
    </div>
  )
}
