-- =============================================================================
-- Sofia's on the Beach — Seed Data
-- supabase/seed.sql
--
-- Safe starter data only. Run AFTER applying 001_initial_schema.sql.
--
-- What this seeds:
--   ✓ room_categories  — 4 types for the admin to build rooms against
--   ✓ settings         — essential config the app reads at runtime
--
-- What this does NOT seed:
--   ✗ admin_users      — must be created after admin signs up via Supabase Auth
--   ✗ rooms            — admin creates these via /dashboard/quartos
--   ✗ reservations     — real booking data only
--   ✗ guests           — real guest data only
--   ✗ payments         — real transaction data only
--   ✗ promotions       — admin creates these via /dashboard/promocoes
--   ✗ real API keys    — add secrets only in .env.local or Supabase Vault
-- =============================================================================


-- =============================================================================
-- ROOM CATEGORIES
-- ON CONFLICT DO NOTHING — safe to re-run without duplicating rows.
-- =============================================================================

INSERT INTO room_categories (name, slug, description, short_description, sort_order, is_active)
VALUES
  (
    'Standard',
    'standard',
    'Quartos confortáveis com todas as comodidades essenciais para uma estadia agradável em Búzios.',
    'Conforto essencial à beira-mar.',
    1,
    true
  ),
  (
    'Superior',
    'superior',
    'Quartos ampliados com acabamento premium, mais espaço e comodidades adicionais.',
    'Mais espaço, mais conforto.',
    2,
    true
  ),
  (
    'Ocean View',
    'ocean-view',
    'Quartos com vista privilegiada e direta para o oceano de Búzios. O diferencial da pousada.',
    'Vista direta para o oceano.',
    3,
    true
  ),
  (
    'Family',
    'family',
    'Quartos espaçosos com configuração pensada para famílias com crianças.',
    'Ideal para famílias.',
    4,
    true
  )
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- SETTINGS
-- value is jsonb. Strings must be valid JSON strings (wrapped in double quotes).
-- Numbers and booleans are bare JSON values.
-- ON CONFLICT DO NOTHING — safe to re-run.
--
-- IMPORTANT: Do not add real API keys here.
--   asaas_api_key  → set in .env.local as ASAAS_API_KEY
--   pix_key        → add via /dashboard/configuracoes after launch
-- =============================================================================

INSERT INTO settings (key, value, label, group_name, is_public)
VALUES

  -- ── General ────────────────────────────────────────────────────────────────

  (
    'pousada_name',
    $$"Sofia's on the Beach"$$::jsonb,
    'Nome da pousada',
    'general',
    true
  ),

  (
    'whatsapp_number',
    '"5522999999999"'::jsonb,
    'Número do WhatsApp (com código do país, sem +)',
    'general',
    true
    -- IMPORTANT: replace with real WhatsApp number via /dashboard/configuracoes
  ),

  (
    'whatsapp_message_template',
    '"Olá! Gostaria de saber mais sobre a pousada Sofia''s on the Beach."'::jsonb,
    'Mensagem padrão do botão WhatsApp',
    'general',
    true
  ),

  (
    'check_in_time',
    '"14:00"'::jsonb,
    'Horário de check-in',
    'general',
    true
  ),

  (
    'check_out_time',
    '"12:00"'::jsonb,
    'Horário de check-out',
    'general',
    true
  ),

  (
    'cancellation_policy',
    '"Cancelamentos realizados com 7 dias ou mais de antecedência recebem reembolso integral. Cancelamentos com menos de 7 dias estão sujeitos a multa de 50% do valor total da reserva."'::jsonb,
    'Política de cancelamento',
    'general',
    true
  ),

  (
    'min_nights_default',
    '2'::jsonb,
    'Número mínimo de noites padrão (sem regras especiais de temporada)',
    'general',
    true
  ),

  (
    'pousada_email',
    '"contato@sofias.com.br"'::jsonb,
    'E-mail de contato da pousada',
    'general',
    true
    -- Update with real email via /dashboard/configuracoes
  ),

  -- ── Payment ────────────────────────────────────────────────────────────────

  (
    'asaas_sandbox',
    'true'::jsonb,
    'Usar ambiente sandbox do Asaas (desativar apenas em produção)',
    'payment',
    false
    -- false = not readable by browser. Change to false only when going live.
  ),

  (
    'pix_key',
    '"a_definir"'::jsonb,
    'Chave PIX da pousada (CNPJ, CPF, e-mail ou chave aleatória)',
    'payment',
    false
    -- Set real value via /dashboard/configuracoes before launch
  )

ON CONFLICT (key) DO NOTHING;
