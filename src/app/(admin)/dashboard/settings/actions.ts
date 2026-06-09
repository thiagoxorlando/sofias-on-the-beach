'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

const TIME_RE  = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// ── Site settings (general) ───────────────────────────────────────────────────
// The `settings` table is a key/value store seeded with one row per field
// (001_initial_schema.sql + 007_add_settings_keys.sql) — there is no singleton
// row to insert/replace, only existing rows to update. This action treats the
// whole "Dados da pousada / Redes sociais / Reservas" form as one save: every
// field maps to a known, pre-seeded key, validated together, written together.
// Payment credentials (asaas_sandbox, pix_key, ASAAS_API_KEY) are intentionally
// absent from this form — they're either env-only or surfaced read-only.

const FIELD_KEYS = {
  business_name:                'pousada_name',
  public_email:                 'pousada_email',
  phone:                        'phone',
  whatsapp:                     'whatsapp_number',
  address:                      'address',
  city:                         'city',
  state:                        'state',
  instagram_url:                'instagram_url',
  facebook_url:                 'facebook_url',
  maps_url:                     'maps_url',
  check_in_time:                'check_in_time',
  check_out_time:               'check_out_time',
  cancellation_policy:          'cancellation_policy',
  booking_confirmation_message: 'booking_confirmation_message',
} as const

export async function updateSiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireModule('settings')

  const fields: Record<string, string> = {}
  for (const formKey of Object.keys(FIELD_KEYS)) fields[formKey] = str(formData, formKey)

  if (!fields.business_name) return { error: 'Informe o nome da pousada.' }
  if (fields.public_email && !EMAIL_RE.test(fields.public_email)) {
    return { error: 'Informe um e-mail público válido.' }
  }

  const whatsappDigits = fields.whatsapp.replace(/\D/g, '')
  if (fields.whatsapp && (whatsappDigits.length < 10 || whatsappDigits.length > 15)) {
    return { error: 'Informe o WhatsApp com código do país e DDD, somente números (ex.: 5522999999999).' }
  }
  fields.whatsapp = whatsappDigits

  if (fields.check_in_time && !TIME_RE.test(fields.check_in_time)) {
    return { error: 'Informe um horário de check-in válido (HH:MM).' }
  }
  if (fields.check_out_time && !TIME_RE.test(fields.check_out_time)) {
    return { error: 'Informe um horário de check-out válido (HH:MM).' }
  }
  if (fields.instagram_url && !isHttpUrl(fields.instagram_url)) {
    return { error: 'Informe um link válido para o Instagram (começando com http:// ou https://).' }
  }
  if (fields.facebook_url && !isHttpUrl(fields.facebook_url)) {
    return { error: 'Informe um link válido para o Facebook (começando com http:// ou https://).' }
  }
  if (fields.maps_url && !isHttpUrl(fields.maps_url)) {
    return { error: 'Informe um link válido para o Google Maps (começando com http:// ou https://).' }
  }

  const db = createAdminClient()
  const updatedAt = new Date().toISOString()

  for (const [formKey, settingKey] of Object.entries(FIELD_KEYS)) {
    const { error } = await db
      .from('settings')
      .update({ value: fields[formKey], updated_by: admin.id, updated_at: updatedAt })
      .eq('key', settingKey)

    if (error) {
      console.error(`[settings] failed to update ${settingKey}:`, error)
      return { error: 'Erro ao salvar as configurações. Tente novamente.' }
    }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}

// ── Online booking toggle ─────────────────────────────────────────────────────
// Enables or disables the public online booking flow. When disabled, /reservar
// shows a WhatsApp fallback and createReservationAction is blocked. Walk-in
// and admin reservations are never affected.

export async function setOnlineBookingAction(enabled: boolean): Promise<ActionState> {
  const admin = await requireModule('settings')

  const db = createAdminClient()
  const { error } = await db
    .from('settings')
    .upsert(
      {
        key:        'online_booking_enabled',
        value:      enabled,
        label:      'Reservas online ativas',
        group_name: 'general',
        is_public:  false,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )

  if (error) return { error: 'Erro ao salvar configuração. Tente novamente.' }

  revalidatePath('/dashboard/settings')
  revalidatePath('/', 'layout')
  return { success: true }
}
