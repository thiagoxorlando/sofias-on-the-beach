import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsForm, type SiteSettingsFormValues } from './_components/SettingsForm'

export const metadata: Metadata = { title: "Configurações — Painel Sofia's" }

const CARD = 'bg-white rounded-[18px] border border-ocean-100 p-5 md:p-6'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export default async function SettingsPage() {
  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value')
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]))

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
  }

  // Payment status — read-only. PIX and credit card are both billing types of
  // the same Asaas integration (see src/lib/asaas/client.ts), gated by the
  // same server-only ASAAS_API_KEY — there is no separate per-method toggle to
  // surface. Never read or display the key itself, only whether it's set.
  const asaasConfigured = !!process.env.ASAAS_API_KEY?.trim()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">Sistema</p>
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">Configurações</h1>
        <p className="text-[13px] text-ocean-500 mt-1.5 leading-relaxed">
          Dados públicos da pousada, redes sociais e parâmetros de reserva — exibidos no site e usados pela equipe.
        </p>
      </div>

      <SettingsForm initial={initial} />

      {/* 4. Pagamentos — read-only status */}
      <section className={CARD}>
        <h2 className="font-serif text-[17px] font-bold text-ocean-900 mb-1">Pagamentos</h2>
        <p className="text-[12px] text-ocean-500 mb-4 leading-relaxed">
          Status da integração de pagamentos. Credenciais ficam apenas no servidor (variáveis de ambiente)
          e não podem ser visualizadas ou editadas por aqui.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PaymentStatusPill label="Asaas" ok={asaasConfigured} okText="Configurado" notText="Não configurado" />
          <PaymentStatusPill label="PIX" ok={asaasConfigured} okText="Disponível" notText="Não disponível" />
          <PaymentStatusPill label="Cartão de crédito" ok={asaasConfigured} okText="Disponível" notText="Não disponível" />
        </div>
        {!asaasConfigured && (
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
            Defina <code className="font-mono text-[11px]">ASAAS_API_KEY</code> no ambiente do servidor para ativar PIX e cartão de crédito.
            Até lá, hóspedes recebem a opção de combinar o pagamento diretamente pelo WhatsApp.
          </p>
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
    <div className={`rounded-xl border px-4 py-3 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-ocean-200 bg-ocean-50/50'}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-ocean-500 mb-1">{label}</p>
      <p className={`text-[13px] font-semibold ${ok ? 'text-emerald-700' : 'text-ocean-500'}`}>
        {ok ? okText : notText}
      </p>
    </div>
  )
}
