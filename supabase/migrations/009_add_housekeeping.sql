-- Foundation for the housekeeping workflow (hotel operations sprint, step 2).
-- Adds a cleaning-status column to rooms and an immutable log of status
-- changes. Module-level enforcement of who can update these lives in
-- src/lib/permissions.ts ('housekeeping' module) — this migration is purely
-- additive and does not touch booking/payment/availability tables or logic.

ALTER TABLE rooms ADD COLUMN housekeeping_status text NOT NULL DEFAULT 'clean';

ALTER TABLE rooms ADD CONSTRAINT rooms_housekeeping_status_check CHECK (
  housekeeping_status IN ('dirty', 'cleaning', 'clean', 'inspected', 'ready')
);

COMMENT ON COLUMN rooms.housekeeping_status IS
  'Current cleaning status of the room: dirty, cleaning, clean, inspected, ready. '
  'Set to dirty automatically on guest check-out (see markCheckedOutAction in '
  'src/app/(admin)/dashboard/reservations/actions.ts). Advanced manually by '
  'housekeeping staff via /dashboard/housekeeping (updateHousekeepingStatusAction).';

CREATE INDEX idx_rooms_housekeeping_status
  ON rooms (housekeeping_status);


-- =============================================================================
-- TABLE: housekeeping_logs
-- Immutable timeline of room cleaning status changes — the housekeeping
-- equivalent of reservation_events. Application code MUST insert a row
-- whenever rooms.housekeeping_status changes (automatic or manual).
-- =============================================================================

CREATE TABLE housekeeping_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reservation_id  uuid        REFERENCES reservations(id) ON DELETE SET NULL,
  from_status     text,
  to_status       text        NOT NULL,
  note            text,
  admin_user_id   uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT housekeeping_logs_from_status_check CHECK (
    from_status IS NULL OR from_status IN ('dirty', 'cleaning', 'clean', 'inspected', 'ready')
  ),
  CONSTRAINT housekeeping_logs_to_status_check CHECK (
    to_status IN ('dirty', 'cleaning', 'clean', 'inspected', 'ready')
  )
);

COMMENT ON TABLE housekeeping_logs IS
  'Immutable audit trail of room cleaning status changes. '
  'Rules: (1) never update or delete rows, (2) app code inserts on every status change '
  '(both the automatic post-check-out transition and manual staff updates), '
  '(3) displayed per-room on /dashboard/housekeeping.';

CREATE INDEX idx_housekeeping_logs_room_time
  ON housekeeping_logs (room_id, created_at DESC);

CREATE INDEX idx_housekeeping_logs_reservation
  ON housekeeping_logs (reservation_id);

ALTER TABLE housekeeping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_housekeeping_logs" ON housekeeping_logs
  FOR ALL USING (public.is_admin_user());
