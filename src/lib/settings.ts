import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

// Public-facing pousada info, sourced from the `settings` key/value table
// (group_name = 'general', is_public = true). Falls back to these defaults
// when the table/row/key is missing or empty, so the site keeps working
// even before staff fill everything in via /dashboard/settings.
export type SiteSettings = {
  businessName: string
  publicEmail: string
  phone: string
  whatsapp: string
  whatsappMessageTemplate: string
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
  onlineBookingEnabled: boolean
}

const FALLBACK_SETTINGS: SiteSettings = {
  businessName:               "Sofia's on the Beach",
  publicEmail:                'contato@sofiasonthebeach.com.br',
  phone:                      '',
  whatsapp:                   process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999',
  whatsappMessageTemplate:    "Olá! Gostaria de saber mais sobre a pousada Sofia's on the Beach.",
  address:                    '',
  city:                       'Búzios',
  state:                      'RJ',
  instagramUrl:               '',
  facebookUrl:                '',
  mapsUrl:                    '',
  checkInTime:                '14:00',
  checkOutTime:               '12:00',
  cancellationPolicy:         '',
  bookingConfirmationMessage: '',
  onlineBookingEnabled:       false,
}

type StringSettingField = keyof Omit<SiteSettings, 'onlineBookingEnabled'>

const SETTING_KEY: Record<StringSettingField, string> = {
  businessName:               'pousada_name',
  publicEmail:                'pousada_email',
  phone:                      'phone',
  whatsapp:                   'whatsapp_number',
  whatsappMessageTemplate:    'whatsapp_message_template',
  address:                    'address',
  city:                       'city',
  state:                      'state',
  instagramUrl:               'instagram_url',
  facebookUrl:                'facebook_url',
  mapsUrl:                    'maps_url',
  checkInTime:                'check_in_time',
  checkOutTime:               'check_out_time',
  cancellationPolicy:         'cancellation_policy',
  bookingConfirmationMessage: 'booking_confirmation_message',
}

// Wrapped in React's cache() — many marketing components on the same page
// (header, footer, hero, WhatsApp button…) need this; cache() collapses them
// into a single `settings` query per request instead of one each.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value').eq('group_name', 'general')
  if (!data) return FALLBACK_SETTINGS

  const raw = new Map(data.map((row) => [row.key, row.value]))
  const settings = { ...FALLBACK_SETTINGS }

  for (const field of Object.keys(SETTING_KEY) as StringSettingField[]) {
    const value = raw.get(SETTING_KEY[field])
    if (typeof value === 'string' && value.trim() !== '') settings[field] = value
  }

  const enabledRaw = raw.get('online_booking_enabled')
  settings.onlineBookingEnabled = enabledRaw === true || enabledRaw === 'true'

  return settings
})

// Builds a wa.me link from the configured WhatsApp number + message.
export function buildWhatsAppHref(settings: Pick<SiteSettings, 'whatsapp'>, message: string): string {
  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`
}
