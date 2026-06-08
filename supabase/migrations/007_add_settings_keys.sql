-- The `settings` table (001_initial_schema.sql) was already seeded with the
-- general/payment keys the platform needed at the time, but /dashboard/settings
-- needs a few more public-facing fields (contact details, location, social
-- links, booking confirmation message) that have no row yet. Same key/value
-- design, same ON CONFLICT guard — these are pure data additions, no DDL.
INSERT INTO settings (key, value, label, group_name, is_public)
VALUES

  (
    'phone',
    '""'::jsonb,
    'Telefone de contato',
    'general',
    true
  ),

  (
    'address',
    '""'::jsonb,
    'Endereço',
    'general',
    true
  ),

  (
    'city',
    '"Búzios"'::jsonb,
    'Cidade',
    'general',
    true
  ),

  (
    'state',
    '"RJ"'::jsonb,
    'Estado (UF)',
    'general',
    true
  ),

  (
    'instagram_url',
    '""'::jsonb,
    'Link do Instagram',
    'general',
    true
  ),

  (
    'facebook_url',
    '""'::jsonb,
    'Link do Facebook',
    'general',
    true
  ),

  (
    'maps_url',
    '""'::jsonb,
    'Link do Google Maps',
    'general',
    true
  ),

  (
    'booking_confirmation_message',
    '"Sua reserva foi registrada com sucesso! Nossa equipe vai confirmar os detalhes em breve."'::jsonb,
    'Mensagem de confirmação de reserva',
    'general',
    true
  )

ON CONFLICT (key) DO NOTHING;
