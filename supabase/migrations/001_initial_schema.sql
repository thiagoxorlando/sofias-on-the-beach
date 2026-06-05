-- =============================================================================
-- Sofia's on the Beach — Initial Database Schema
-- Migration: 001_initial_schema.sql
--
-- Execution order (dependency-safe):
--   Extensions → helper functions → core tables → relational tables →
--   indexes → RLS helper function → RLS policies → triggers
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- pgcrypto provides gen_random_uuid() for broad Supabase version compatibility.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- HELPER FUNCTION: set_updated_at
-- Automatically stamps updated_at whenever a row is modified.
-- Applied via triggers at the bottom of this file.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- TABLE: room_categories
-- Groups rooms by type. Used for display, filtering, and minimum-stay rules.
-- =============================================================================

CREATE TABLE room_categories (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  description       text,
  short_description text,
  sort_order        int         NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE room_categories IS
  'Room type groupings: Standard, Superior, Ocean View, Family. '
  'Rooms belong to exactly one category.';


-- =============================================================================
-- TABLE: rooms
-- One row per physical bookable room at the pousada.
-- =============================================================================

CREATE TABLE rooms (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       uuid          NOT NULL REFERENCES room_categories(id) ON DELETE RESTRICT,
  slug              text          NOT NULL UNIQUE,
  name              text          NOT NULL,
  description       text,
  short_description text,
  max_guests        int           NOT NULL DEFAULT 2,
  beds              jsonb,
  -- beds format: [{"type": "queen", "count": 1}, {"type": "single", "count": 1}]
  -- valid types: queen, double, single, bunk
  size_sqm          numeric(6,2),
  floor             int,
  ocean_view        boolean       NOT NULL DEFAULT false,
  amenities         text[]        NOT NULL DEFAULT '{}',
  -- amenities examples: "ar-condicionado", "frigobar", "varanda", "banheira", "cofre"
  base_price_brl    numeric(10,2) NOT NULL,
  is_active         boolean       NOT NULL DEFAULT true,
  sort_order        int           NOT NULL DEFAULT 0,
  property_id       uuid,
  -- NULL = main property. Reserved for future multi-property support. Do not FK yet.
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT rooms_max_guests_positive  CHECK (max_guests > 0),
  CONSTRAINT rooms_base_price_positive  CHECK (base_price_brl > 0)
);

COMMENT ON TABLE rooms IS
  'Physical rooms. One row per bookable room. '
  'base_price_brl is the fallback when no room_rate applies to a given date.';
COMMENT ON COLUMN rooms.property_id IS
  'NULL = main Sofia''s property. Reserved for future multi-property expansion without migration.';


-- =============================================================================
-- TABLE: room_images
-- Room-specific photos. Separate from gallery_images (property-wide media).
-- =============================================================================

CREATE TABLE room_images (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,   -- Supabase Storage object path
  url           text        NOT NULL,   -- Public CDN URL
  alt_text      text,
  is_cover      boolean     NOT NULL DEFAULT false,
  sort_order    int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE room_images IS
  'Photos for individual rooms. '
  'Managed separately from gallery_images (which holds property-wide media).';


-- =============================================================================
-- TABLE: gallery_images
-- Property-wide media: hero, beach, breakfast, common areas, experiences.
-- Not room-specific. Managed from /dashboard/galeria.
-- =============================================================================

CREATE TABLE gallery_images (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text        NOT NULL DEFAULT 'other',
  storage_path  text        NOT NULL,
  url           text        NOT NULL,
  alt_text      text,
  caption       text,
  sort_order    int         NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT gallery_images_category_check CHECK (
    category IN ('hero', 'beach', 'breakfast', 'common_areas', 'experiences', 'promotional', 'other')
  )
);

COMMENT ON TABLE gallery_images IS
  'All property-wide photos. Not room-specific. '
  'Used across homepage, about sections, and marketing pages.';


-- =============================================================================
-- TABLE: room_rates
-- Seasonal pricing rules per room. Most specific matching date range wins
-- over the room's base_price_brl. Evaluated in the pricing engine.
-- =============================================================================

CREATE TABLE room_rates (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid          NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name            text          NOT NULL,   -- "Alta Temporada", "Carnaval 2026"
  start_date      date          NOT NULL,
  end_date        date          NOT NULL,
  price_per_night numeric(10,2) NOT NULL,
  min_nights      int           NOT NULL DEFAULT 1,
  is_active       boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT room_rates_date_order       CHECK (start_date <= end_date),
  CONSTRAINT room_rates_price_positive   CHECK (price_per_night > 0),
  CONSTRAINT room_rates_min_nights_check CHECK (min_nights >= 1)
);

COMMENT ON TABLE room_rates IS
  'Seasonal pricing overrides per room. '
  'When a booking spans multiple rate periods, the pricing engine must handle proration.';


-- =============================================================================
-- TABLE: minimum_stay_rules
-- Minimum-night requirements for special periods (Carnaval, Réveillon, etc.)
-- The booking engine MUST validate these before creating a reservation.
-- Admin UI: /dashboard/regras-estadia (Phase 4).
-- =============================================================================

CREATE TABLE minimum_stay_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,   -- "Carnaval 2026", "Réveillon 2025"
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  minimum_nights  int         NOT NULL,
  applies_to      text        NOT NULL DEFAULT 'all',
  applies_to_ids  uuid[],
  -- Room or category UUIDs when applies_to is not 'all'
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT minimum_stay_rules_date_order    CHECK (start_date <= end_date),
  CONSTRAINT minimum_stay_rules_nights_check  CHECK (minimum_nights >= 1),
  CONSTRAINT minimum_stay_rules_applies_check CHECK (
    applies_to IN ('all', 'specific_rooms', 'specific_categories')
  )
);

COMMENT ON TABLE minimum_stay_rules IS
  'Minimum-night enforcement for special periods. '
  'Booking engine validation: if check_in < rule.end_date AND check_out > rule.start_date '
  'and applies_to matches the room/category, reject if (check_out - check_in) < minimum_nights. '
  'Return a clear Portuguese error: "Carnaval exige mínimo de 4 noites."';


-- =============================================================================
-- TABLE: admin_users
-- One row per admin portal user. id MUST match a row in auth.users.
-- Create this row manually after the admin signs up via Supabase Auth.
-- =============================================================================

CREATE TABLE admin_users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  full_name     text        NOT NULL,
  role          text        NOT NULL DEFAULT 'staff',
  is_active     boolean     NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_users_role_check CHECK (
    role IN ('super_admin', 'admin', 'staff')
  )
);

COMMENT ON TABLE admin_users IS
  'Admin portal users. id must match auth.users.id (Supabase Auth). '
  'Do not seed this table — create rows after admins sign up via Supabase Auth.';


-- =============================================================================
-- TABLE: promotions
-- Promo codes and seasonal discounts.
-- Schema created in Phase 1 so reservations can FK it from day 1.
-- Admin UI ships in Phase 4.
-- =============================================================================

CREATE TABLE promotions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text          NOT NULL UNIQUE,
  name            text          NOT NULL,
  description     text,
  discount_type   text          NOT NULL,
  discount_value  numeric(10,2) NOT NULL,
  min_nights      int           NOT NULL DEFAULT 1,
  min_amount_brl  numeric(10,2),
  valid_from      date          NOT NULL,
  valid_until     date          NOT NULL,
  max_uses        int,                        -- NULL = unlimited
  uses_count      int           NOT NULL DEFAULT 0,   -- denormalized, updated by app code
  applies_to      text          NOT NULL DEFAULT 'all',
  applies_to_ids  uuid[],
  is_active       boolean       NOT NULL DEFAULT true,
  is_public       boolean       NOT NULL DEFAULT false,  -- display on website without requiring a code
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT promotions_date_order         CHECK (valid_from <= valid_until),
  CONSTRAINT promotions_discount_positive  CHECK (discount_value > 0),
  CONSTRAINT promotions_discount_type_check CHECK (
    discount_type IN ('percent', 'fixed_brl')
  ),
  CONSTRAINT promotions_applies_to_check CHECK (
    applies_to IN ('all', 'specific_rooms', 'specific_categories')
  )
);

COMMENT ON TABLE promotions IS
  'Promo codes: percent or fixed-BRL discounts. '
  'is_public = true → shown on guest website without a code (seasonal banners). '
  'uses_count is a denormalized counter — increment atomically in app code.';


-- =============================================================================
-- TABLE: guests
-- One row per unique guest, identified by email.
-- =============================================================================

CREATE TABLE guests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  full_name     text        NOT NULL,
  phone         text,                   -- with country code: +5522999999999
  cpf           text,                   -- Brazilian CPF, optional, never log in plain text
  nationality   text        NOT NULL DEFAULT 'BR',
  notes         text,                   -- internal admin notes, never shown to guest
  total_stays   int         NOT NULL DEFAULT 0,   -- denormalized, updated by app code
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE guests IS
  'Guest profiles. One row per unique email address. '
  'total_stays is a denormalized counter — increment when a reservation reaches checked_out status.';


-- =============================================================================
-- TABLE: reservations
-- Core booking record. One room per reservation (MVP).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- FUTURE MULTI-ROOM MIGRATION PATH (Phase 5+ — do NOT implement now):
--
--   Step 1 — Create the join table:
--     CREATE TABLE reservation_rooms (
--       id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
--       reservation_id  uuid          NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
--       room_id         uuid          NOT NULL REFERENCES rooms(id),
--       price_per_night numeric(10,2) NOT NULL,
--       total_brl       numeric(10,2) NOT NULL,
--       created_at      timestamptz   NOT NULL DEFAULT now(),
--       UNIQUE (reservation_id, room_id)
--     );
--
--   Step 2 — Migrate existing data:
--     INSERT INTO reservation_rooms (reservation_id, room_id, price_per_night, total_brl)
--     SELECT id, room_id,
--            ROUND(total_brl / (check_out - check_in), 2),
--            total_brl
--     FROM reservations
--     WHERE room_id IS NOT NULL;
--
--   Step 3 — Make room_id nullable (backward-compatible, do NOT drop):
--     ALTER TABLE reservations ALTER COLUMN room_id DROP NOT NULL;
--
-- This migration requires zero destructive operations.
-- ─────────────────────────────────────────────────────────────────────────────
-- =============================================================================

CREATE TABLE reservations (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  token               text          NOT NULL UNIQUE,
  -- Guest-facing reference: "SOF-2024-A3F7". Generated by app code, not DB.
  room_id             uuid          NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_id            uuid          NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  check_in            date          NOT NULL,
  check_out           date          NOT NULL,
  adults              int           NOT NULL DEFAULT 1,
  children            int           NOT NULL DEFAULT 0,
  total_brl           numeric(10,2) NOT NULL,
  base_amount_brl     numeric(10,2) NOT NULL,       -- total before any discount
  discount_brl        numeric(10,2) NOT NULL DEFAULT 0,
  status              text          NOT NULL DEFAULT 'pending_payment',
  source              text          NOT NULL DEFAULT 'direct',
  external_source     text,
  -- "booking" | "airbnb" — reserved for future channel sync (Phase 5)
  external_id         text,
  -- External reservation ID from Booking.com, Airbnb, etc. (Phase 5)
  special_requests    text,
  cancellation_reason text,
  cancelled_at        timestamptz,
  checked_in_at       timestamptz,
  checked_out_at      timestamptz,
  promotion_id        uuid          REFERENCES promotions(id) ON DELETE SET NULL,
  promotion_code      text,
  -- Snapshot of promo code at booking time — preserved if promotion is later deleted
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT reservations_date_order           CHECK (check_in < check_out),
  CONSTRAINT reservations_adults_positive      CHECK (adults >= 1),
  CONSTRAINT reservations_children_non_neg     CHECK (children >= 0),
  CONSTRAINT reservations_total_non_neg        CHECK (total_brl >= 0),
  CONSTRAINT reservations_discount_non_neg     CHECK (discount_brl >= 0),
  CONSTRAINT reservations_status_check         CHECK (
    status IN (
      'pending_payment', 'paid', 'confirmed',
      'checked_in', 'checked_out',
      'cancelled', 'refunded', 'no_show'
    )
  ),
  CONSTRAINT reservations_source_check CHECK (
    source IN ('direct', 'booking', 'airbnb', 'manual')
  )
);

COMMENT ON TABLE reservations IS
  'Core booking records. One room per reservation (MVP). '
  'See inline migration comment above for future multi-room path. '
  'token is the guest-facing reference (app-generated, e.g., SOF-2024-A3F7). '
  'external_source and external_id are reserved for Phase 5 channel manager sync.';


-- =============================================================================
-- TABLE: room_availability
-- Sparse model: rows exist ONLY for blocked dates.
-- Available = no row, or row with is_available = true.
-- NEVER insert rows for available dates — this keeps the table fast.
-- =============================================================================

CREATE TABLE room_availability (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date            date        NOT NULL,
  is_available    boolean     NOT NULL DEFAULT false,   -- false = blocked
  blocked_reason  text        NOT NULL DEFAULT 'reservation',
  reservation_id  uuid        REFERENCES reservations(id) ON DELETE SET NULL,
  -- Links back to the reservation that caused the block (nullable for manual blocks)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (room_id, date),

  CONSTRAINT room_availability_reason_check CHECK (
    blocked_reason IN ('reservation', 'maintenance', 'owner_use', 'channel')
  )
);

COMMENT ON TABLE room_availability IS
  'Blocked dates per room. Sparse model — available dates have NO row. '
  'Calendar queries: LEFT JOIN to get blocked dates; missing row = available. '
  'When a reservation is created, insert blocked rows for check_in to check_out - 1.';


-- =============================================================================
-- TABLE: reservation_notes
-- Internal admin notes on a reservation. Never visible to guests.
-- =============================================================================

CREATE TABLE reservation_notes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  admin_user_id   uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  note            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE reservation_notes IS
  'Internal admin notes per reservation. Never exposed to guests. '
  'Displayed as a list on /dashboard/reservas/[id].';


-- =============================================================================
-- TABLE: reservation_events
-- Immutable timeline per reservation.
-- Application code MUST insert an event whenever reservation status changes.
-- =============================================================================

CREATE TABLE reservation_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  event_type      text        NOT NULL,
  description     text        NOT NULL,   -- human-readable in Portuguese
  metadata        jsonb,
  -- Context snapshot: { "old_status": "pending_payment", "new_status": "paid", "amount_brl": 890 }
  created_by      text        NOT NULL DEFAULT 'system',
  -- "system" | UUID string of admin_user | "guest"
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reservation_events_type_check CHECK (
    event_type IN (
      'reservation_created',
      'payment_generated',
      'payment_received',
      'reservation_confirmed',
      'checked_in',
      'checked_out',
      'cancelled',
      'refund_issued',
      'note_added',
      'status_changed',
      'manual_update'
    )
  )
);

COMMENT ON TABLE reservation_events IS
  'Immutable audit timeline per reservation. '
  'Rules: (1) never update or delete rows, (2) app code inserts on every status change, '
  '(3) displayed as a vertical timeline on /dashboard/reservas/[id].';


-- =============================================================================
-- TABLE: payments
-- Asaas-centric payment records. One reservation can have multiple attempts.
-- =============================================================================

CREATE TABLE payments (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id        uuid          NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  amount_brl            numeric(10,2) NOT NULL,
  method                text          NOT NULL,
  provider              text          NOT NULL DEFAULT 'asaas',
  asaas_payment_id      text          UNIQUE,
  -- Asaas charge ID, e.g. "pay_abc123". UNIQUE ensures no duplicate webhook processing.
  asaas_invoice_url     text,
  asaas_pix_qr_code     text,         -- base64 QR image shown to guest
  asaas_pix_copy_paste  text,         -- PIX "copia e cola" string
  asaas_due_date        date,
  status                text          NOT NULL DEFAULT 'pending',
  paid_at               timestamptz,
  refunded_at           timestamptz,
  refund_reason         text,
  metadata              jsonb,
  -- Full Asaas webhook payload snapshot — useful for debugging
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT payments_amount_positive   CHECK (amount_brl > 0),
  CONSTRAINT payments_method_check      CHECK (
    method IN ('pix', 'credit_card', 'boleto', 'manual')
  ),
  CONSTRAINT payments_provider_check    CHECK (
    provider IN ('asaas', 'manual')
  ),
  CONSTRAINT payments_status_check      CHECK (
    status IN ('pending', 'paid', 'overdue', 'refunded', 'failed', 'cancelled')
  )
);

COMMENT ON TABLE payments IS
  'Payment records per reservation. One reservation may have multiple payment attempts. '
  'asaas_payment_id UNIQUE constraint prevents duplicate webhook side effects. '
  'Store full Asaas webhook payload in metadata for audit and debugging.';


-- =============================================================================
-- TABLE: promotion_usages
-- One row per promotion+reservation pair.
-- Enforces max_uses limits and provides a full discount audit trail.
-- =============================================================================

CREATE TABLE promotion_usages (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id          uuid          NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  reservation_id        uuid          NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  guest_id              uuid          NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  discount_applied_brl  numeric(10,2) NOT NULL,
  created_at            timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (promotion_id, reservation_id)
);

COMMENT ON TABLE promotion_usages IS
  'Audit trail for every promo code applied. '
  'When inserting, also increment promotions.uses_count atomically in app code. '
  'UNIQUE(promotion_id, reservation_id) prevents double-applying the same promo.';


-- =============================================================================
-- TABLE: leads
-- Pre-reservation guest intent. Source for WhatsApp follow-up by admin.
-- =============================================================================

CREATE TABLE leads (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text        NOT NULL,
  email                     text        NOT NULL,
  phone                     text,
  check_in_interest         date,
  check_out_interest        date,
  adults                    int,
  children                  int,
  room_id                   uuid        REFERENCES rooms(id) ON DELETE SET NULL,
  room_category_id          uuid        REFERENCES room_categories(id) ON DELETE SET NULL,
  message                   text,
  source                    text        NOT NULL DEFAULT 'website',
  status                    text        NOT NULL DEFAULT 'new',
  converted_reservation_id  uuid        REFERENCES reservations(id) ON DELETE SET NULL,
  admin_notes               text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leads_source_check CHECK (
    source IN ('website', 'whatsapp', 'instagram', 'phone', 'email', 'other')
  ),
  CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'contacted', 'converted', 'lost')
  )
);

COMMENT ON TABLE leads IS
  'Captured when a guest shows intent but does not complete a reservation. '
  'Admin sees these in /dashboard/leads and follows up via WhatsApp link. '
  'converted_reservation_id links to the reservation if the lead eventually books.';


-- =============================================================================
-- TABLE: settings
-- Key/value store for pousada configuration.
-- is_public = true  → readable by anon (website header/footer values)
-- is_public = false → server/admin only (Asaas keys, PIX key, etc.)
-- =============================================================================

CREATE TABLE settings (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  label       text        NOT NULL,
  group_name  text        NOT NULL DEFAULT 'general',
  is_public   boolean     NOT NULL DEFAULT false,
  updated_by  uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT settings_group_check CHECK (
    group_name IN ('general', 'payment', 'notifications', 'integrations')
  )
);

COMMENT ON TABLE settings IS
  'Pousada configuration as key/value pairs. '
  'is_public = true: whatsapp_number, check_in_time, check_out_time, pousada_name, cancellation_policy. '
  'is_public = false: asaas_api_key, pix_key, asaas_sandbox. '
  'Sensitive keys must NEVER be fetched by browser-side code.';


-- =============================================================================
-- TABLE: audit_logs
-- Immutable append-only record of changes to critical tables.
-- Written by SECURITY DEFINER triggers — do not write here from app code.
-- =============================================================================

CREATE TABLE audit_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name      text        NOT NULL,
  record_id       uuid        NOT NULL,
  action          text        NOT NULL,
  old_data        jsonb,
  new_data        jsonb,
  admin_user_id   uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  ip_address      text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_action_check CHECK (
    action IN ('INSERT', 'UPDATE', 'DELETE')
  )
);

COMMENT ON TABLE audit_logs IS
  'Immutable audit trail. Written only by SECURITY DEFINER triggers. '
  'Tracks: reservations, payments, rooms. '
  'Application code must NOT write here directly.';


-- =============================================================================
-- INDEXES
-- =============================================================================

-- room_categories
CREATE INDEX idx_room_categories_active_sort
  ON room_categories (is_active, sort_order);

-- rooms
CREATE INDEX idx_rooms_category
  ON rooms (category_id);
CREATE INDEX idx_rooms_active_sort
  ON rooms (is_active, sort_order);
-- slug has a UNIQUE constraint which already creates an index

-- room_images
CREATE INDEX idx_room_images_room_sort
  ON room_images (room_id, sort_order);

-- gallery_images
CREATE INDEX idx_gallery_images_category_active
  ON gallery_images (category, is_active, sort_order);

-- room_rates
CREATE INDEX idx_room_rates_room_dates
  ON room_rates (room_id, start_date, end_date);

-- minimum_stay_rules
CREATE INDEX idx_minimum_stay_rules_dates
  ON minimum_stay_rules (start_date, end_date, is_active);

-- room_availability
CREATE INDEX idx_room_availability_room_date
  ON room_availability (room_id, date);
  -- UNIQUE (room_id, date) already creates an index, this is for range scans
CREATE INDEX idx_room_availability_lookup
  ON room_availability (room_id, date, is_available);

-- guests
CREATE INDEX idx_guests_email  ON guests (email);
CREATE INDEX idx_guests_phone  ON guests (phone);

-- reservations
CREATE INDEX idx_reservations_guest
  ON reservations (guest_id);
CREATE INDEX idx_reservations_room_dates
  ON reservations (room_id, check_in, check_out);
CREATE INDEX idx_reservations_status
  ON reservations (status);
CREATE INDEX idx_reservations_check_in
  ON reservations (check_in);
CREATE INDEX idx_reservations_token
  ON reservations (token);
CREATE INDEX idx_reservations_external_id
  ON reservations (external_id) WHERE external_id IS NOT NULL;

-- reservation_notes
CREATE INDEX idx_reservation_notes_reservation
  ON reservation_notes (reservation_id);

-- reservation_events
CREATE INDEX idx_reservation_events_reservation_time
  ON reservation_events (reservation_id, created_at);

-- payments
CREATE INDEX idx_payments_reservation
  ON payments (reservation_id);
CREATE INDEX idx_payments_asaas_id
  ON payments (asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX idx_payments_status
  ON payments (status);

-- promotions
CREATE INDEX idx_promotions_code_active
  ON promotions (code, is_active);
CREATE INDEX idx_promotions_dates
  ON promotions (valid_from, valid_until);

-- promotion_usages
CREATE INDEX idx_promotion_usages_promotion
  ON promotion_usages (promotion_id);
CREATE INDEX idx_promotion_usages_reservation
  ON promotion_usages (reservation_id);

-- leads
CREATE INDEX idx_leads_status_created
  ON leads (status, created_at);
CREATE INDEX idx_leads_email
  ON leads (email);
CREATE INDEX idx_leads_check_in_interest
  ON leads (check_in_interest);

-- audit_logs
CREATE INDEX idx_audit_logs_table_record
  ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_created_at
  ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_admin_user
  ON audit_logs (admin_user_id);


-- =============================================================================
-- RLS HELPER FUNCTIONS
-- SECURITY DEFINER + SET search_path = public prevents search_path injection.
-- These bypass RLS when checking admin_users, preventing recursive policy loops.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;


-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- Service role always bypasses RLS automatically — no policies needed for it.
-- =============================================================================

ALTER TABLE room_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_rates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE minimum_stay_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- RLS POLICIES
-- Pattern:
--   public_read_*    → anon role can SELECT (for guest-facing data only)
--   admin_*          → authenticated admin can operate (uses is_admin_user())
--   super_admin_*    → super_admin role only (uses is_super_admin())
-- =============================================================================

-- ── room_categories ──────────────────────────────────────────────────────────

CREATE POLICY "public_read_active_categories" ON room_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_categories" ON room_categories
  FOR ALL USING (public.is_admin_user());

-- ── rooms ────────────────────────────────────────────────────────────────────

CREATE POLICY "public_read_active_rooms" ON rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_rooms" ON rooms
  FOR ALL USING (public.is_admin_user());

-- ── room_images ──────────────────────────────────────────────────────────────

CREATE POLICY "public_read_room_images" ON room_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_images.room_id
        AND rooms.is_active = true
    )
  );

CREATE POLICY "admin_manage_room_images" ON room_images
  FOR ALL USING (public.is_admin_user());

-- ── gallery_images ───────────────────────────────────────────────────────────

CREATE POLICY "public_read_active_gallery" ON gallery_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_gallery" ON gallery_images
  FOR ALL USING (public.is_admin_user());

-- ── room_rates ───────────────────────────────────────────────────────────────

CREATE POLICY "public_read_active_rates" ON room_rates
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_rates.room_id
        AND rooms.is_active = true
    )
  );

CREATE POLICY "admin_manage_rates" ON room_rates
  FOR ALL USING (public.is_admin_user());

-- ── minimum_stay_rules ───────────────────────────────────────────────────────

CREATE POLICY "public_read_active_stay_rules" ON minimum_stay_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_stay_rules" ON minimum_stay_rules
  FOR ALL USING (public.is_admin_user());

-- ── room_availability ────────────────────────────────────────────────────────

CREATE POLICY "public_read_availability" ON room_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_availability.room_id
        AND rooms.is_active = true
    )
  );

CREATE POLICY "admin_manage_availability" ON room_availability
  FOR ALL USING (public.is_admin_user());

-- ── promotions ───────────────────────────────────────────────────────────────

-- Anon can see active public promotions only (for display on site without a code)
CREATE POLICY "public_read_active_public_promotions" ON promotions
  FOR SELECT USING (is_active = true AND is_public = true);

CREATE POLICY "admin_manage_promotions" ON promotions
  FOR ALL USING (public.is_admin_user());

-- ── settings ─────────────────────────────────────────────────────────────────

-- Anon can read keys marked is_public = true (whatsapp_number, check_in_time, etc.)
CREATE POLICY "public_read_public_settings" ON settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "admin_manage_settings" ON settings
  FOR ALL USING (public.is_admin_user());

-- ── admin_users ──────────────────────────────────────────────────────────────

-- Any authenticated user can read their own admin record (used for session validation)
CREATE POLICY "read_own_admin_record" ON admin_users
  FOR SELECT USING (id = auth.uid());

-- Active admins can read all admin records (for attribution in notes, etc.)
CREATE POLICY "admins_read_all_admins" ON admin_users
  FOR SELECT USING (public.is_admin_user());

-- Only super_admin can create, update, or delete admin users
-- Uses is_super_admin() (SECURITY DEFINER) to avoid recursive policy evaluation
CREATE POLICY "super_admin_manage_admins" ON admin_users
  FOR ALL USING (public.is_super_admin());

-- ── guests ───────────────────────────────────────────────────────────────────
-- No public access. Guest self-service uses server-side token validation.

CREATE POLICY "admin_manage_guests" ON guests
  FOR ALL USING (public.is_admin_user());

-- ── reservations ─────────────────────────────────────────────────────────────
-- No anon access. Guest self-service (/minha-reserva) uses the service_role
-- client in a Server Action to validate token + email server-side.

CREATE POLICY "admin_manage_reservations" ON reservations
  FOR ALL USING (public.is_admin_user());

-- ── reservation_notes ────────────────────────────────────────────────────────

CREATE POLICY "admin_manage_reservation_notes" ON reservation_notes
  FOR ALL USING (public.is_admin_user());

-- ── reservation_events ───────────────────────────────────────────────────────
-- Read: admin. Write: service_role only (bypasses RLS).

CREATE POLICY "admin_read_reservation_events" ON reservation_events
  FOR SELECT USING (public.is_admin_user());

-- ── payments ─────────────────────────────────────────────────────────────────

CREATE POLICY "admin_manage_payments" ON payments
  FOR ALL USING (public.is_admin_user());

-- ── promotion_usages ─────────────────────────────────────────────────────────

CREATE POLICY "admin_manage_promotion_usages" ON promotion_usages
  FOR ALL USING (public.is_admin_user());

-- ── leads ────────────────────────────────────────────────────────────────────

CREATE POLICY "admin_manage_leads" ON leads
  FOR ALL USING (public.is_admin_user());

-- ── audit_logs ───────────────────────────────────────────────────────────────
-- Read: admin. Write: SECURITY DEFINER trigger only.

CREATE POLICY "admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (public.is_admin_user());


-- =============================================================================
-- TRIGGERS: updated_at
-- Applied to every table that has an updated_at column.
-- =============================================================================

CREATE TRIGGER trg_updated_at_room_categories
  BEFORE UPDATE ON room_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_rooms
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_gallery_images
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_room_rates
  BEFORE UPDATE ON room_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_minimum_stay_rules
  BEFORE UPDATE ON minimum_stay_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_admin_users
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_promotions
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_guests
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_reservations
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_room_availability
  BEFORE UPDATE ON room_availability
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_leads
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Note: settings uses updated_at but is managed manually (no trigger needed —
-- the admin server action should set updated_at explicitly when saving a setting).

-- Note: reservation_events and reservation_notes are append-only.
-- No updated_at trigger needed.


-- =============================================================================
-- AUDIT TRIGGER FUNCTION
-- SECURITY DEFINER so it can INSERT into audit_logs regardless of RLS.
-- SET search_path prevents search_path injection.
-- Applied to: reservations, payments, rooms (critical business tables).
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_audit_reservations
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER trg_audit_rooms
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
