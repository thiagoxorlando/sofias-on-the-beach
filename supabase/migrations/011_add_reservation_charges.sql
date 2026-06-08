-- Extra charges ledger for front-desk operations (beach towels, lost keys,
-- damages, late checkout, extra cleaning, mini-bar, laundry, transfer, etc).
-- Kept as its own ledger — separate from reservations.total_brl — so the
-- original booking total stays an immutable record of what the guest paid
-- to book, while extras are tracked, settled and reported independently.

CREATE TABLE reservation_charges (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id    uuid          NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  category          text          NOT NULL,
  description       text          NOT NULL,
  quantity          integer       NOT NULL DEFAULT 1,
  unit_amount_brl   integer       NOT NULL,
  total_amount_brl  integer       NOT NULL,
  status            text          NOT NULL DEFAULT 'pending',
  created_by        uuid          REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT reservation_charges_category_check CHECK (
    category IN (
      'beach_towel', 'lost_key', 'damage', 'late_checkout',
      'extra_cleaning', 'minibar', 'laundry', 'transfer', 'other'
    )
  ),
  CONSTRAINT reservation_charges_status_check CHECK (
    status IN ('pending', 'paid', 'waived')
  ),
  CONSTRAINT reservation_charges_quantity_positive    CHECK (quantity >= 1),
  CONSTRAINT reservation_charges_unit_amount_non_neg  CHECK (unit_amount_brl >= 0),
  CONSTRAINT reservation_charges_total_amount_non_neg CHECK (total_amount_brl >= 0)
);

COMMENT ON TABLE reservation_charges IS
  'Extra charges recorded by reception during a stay (towels, lost keys, damages, '
  'late checkout, cleaning, minibar, laundry, transfer, other). unit_amount_brl and '
  'total_amount_brl are whole-real integers (no cents) — front-desk extras are priced '
  'in round amounts. Independent from reservations.total_brl — never merged into the '
  'original booking total.';

CREATE INDEX idx_reservation_charges_reservation_id ON reservation_charges (reservation_id);
CREATE INDEX idx_reservation_charges_status         ON reservation_charges (status);
CREATE INDEX idx_reservation_charges_created_at     ON reservation_charges (created_at DESC);

CREATE TRIGGER trg_updated_at_reservation_charges
  BEFORE UPDATE ON reservation_charges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE reservation_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_reservation_charges" ON reservation_charges
  FOR ALL USING (public.is_admin_user());
