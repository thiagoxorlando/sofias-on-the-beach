-- Manual payment confirmation requires staff to record proof/details (how the
-- money actually arrived, the date, an optional note, and an optional receipt
-- file) — none of which fit the existing Asaas-specific or generic columns.
-- Dedicated nullable columns keep webhook logic and manual confirmations from
-- ever colliding or overwriting each other.
-- manual_receipt_path (not a cached URL) is intentional: the payment-receipts
-- bucket is private, so any URL must be a short-lived signed URL — storing one
-- would just go stale. The path lets server code mint a fresh signed URL
-- on-demand whenever staff need to view the receipt.
ALTER TABLE payments
  ADD COLUMN manual_payment_method text,
  ADD COLUMN manual_payment_note   text,
  ADD COLUMN manual_paid_by        uuid REFERENCES admin_users(id),
  ADD COLUMN manual_receipt_path   text;

ALTER TABLE payments ADD CONSTRAINT payments_manual_payment_method_check CHECK (
  manual_payment_method IS NULL OR manual_payment_method IN (
    'pix_manual', 'cash', 'bank_transfer', 'card_machine', 'other'
  )
);

COMMENT ON COLUMN payments.manual_payment_method IS
  'How staff actually received a manually-confirmed payment (pix_manual | cash | bank_transfer | card_machine | other). NULL for Asaas-confirmed payments. Distinct from payments.method, which is set to ''manual'' as the generic marker.';
COMMENT ON COLUMN payments.manual_payment_note IS
  'Optional internal note staff attaches when manually confirming a payment.';
COMMENT ON COLUMN payments.manual_paid_by IS
  'Admin who confirmed this payment manually.';
COMMENT ON COLUMN payments.manual_receipt_path IS
  'Storage path of the uploaded proof/receipt in the private payment-receipts bucket. Generate a signed URL on demand to view it — never store one, it would expire.';
