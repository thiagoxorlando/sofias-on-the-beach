-- Reception staff need a way to mark that a guest's special request has been
-- attended to, so that the alert clears from the reception command center.
-- Kept simple: open (default) → done. No need for intermediate states.
-- handled_by references the admin who marked it done, for the audit trail.

ALTER TABLE reservations
  ADD COLUMN special_request_status    text          NOT NULL DEFAULT 'open',
  ADD COLUMN special_request_handled_at timestamptz,
  ADD COLUMN special_request_handled_by uuid          REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE reservations ADD CONSTRAINT reservations_special_request_status_check CHECK (
  special_request_status IN ('open', 'done')
);

COMMENT ON COLUMN reservations.special_request_status IS
  'Whether the guest''s special request has been attended to by reception. open (default) or done.';
COMMENT ON COLUMN reservations.special_request_handled_at IS
  'Timestamp when reception marked the special request as attended.';
COMMENT ON COLUMN reservations.special_request_handled_by IS
  'Admin user who marked the special request as attended.';
