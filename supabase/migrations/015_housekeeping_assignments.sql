-- Adds housekeeping_assignments to support task distribution between supervisors
-- and housekeeping staff. Supervisors assign rooms to staff members; staff see
-- their tasks on the Governança workstation. This is purely additive and does
-- not touch booking, payment, or availability logic.

CREATE TABLE housekeeping_assignments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             uuid        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_to         uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  assigned_by         uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reservation_id      uuid        REFERENCES reservations(id) ON DELETE SET NULL,
  handoff_request_id  uuid        REFERENCES handoff_requests(id) ON DELETE SET NULL,
  status              text        NOT NULL DEFAULT 'pending'
    CONSTRAINT housekeeping_assignments_status_check
      CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority            text        NOT NULL DEFAULT 'normal'
    CONSTRAINT housekeeping_assignments_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

COMMENT ON TABLE housekeeping_assignments IS
  'Records room cleaning tasks assigned by supervisors to housekeeping staff. '
  'When a supervisor assigns a room, any existing active assignment for that room '
  'is cancelled first. Status lifecycle: pending → in_progress → completed/cancelled.';

CREATE INDEX idx_housekeeping_assignments_room
  ON housekeeping_assignments (room_id);

CREATE INDEX idx_housekeeping_assignments_staff
  ON housekeeping_assignments (assigned_to);

CREATE INDEX idx_housekeeping_assignments_status
  ON housekeeping_assignments (status);

CREATE INDEX idx_housekeeping_assignments_date
  ON housekeeping_assignments (created_at DESC);

ALTER TABLE housekeeping_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_housekeeping_assignments" ON housekeeping_assignments
  FOR ALL USING (public.is_admin_user());
