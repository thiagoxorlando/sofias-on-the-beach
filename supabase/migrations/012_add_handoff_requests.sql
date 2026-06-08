-- Lightweight cross-department handoff channel.
-- Reception creates requests for Governança (housekeeping) or Manutenção.
-- Neither department gains full access to each other's dashboards.
-- Kept separate from maintenance_tickets — handoff_requests are guest-driven
-- tasks during a stay; maintenance_tickets are property/infrastructure work.

CREATE TABLE handoff_requests (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id      uuid          REFERENCES reservations(id) ON DELETE SET NULL,
  room_id             uuid          REFERENCES rooms(id) ON DELETE SET NULL,
  target_department   text          NOT NULL,
  title               text          NOT NULL,
  description         text,
  priority            text          NOT NULL DEFAULT 'normal',
  status              text          NOT NULL DEFAULT 'open',
  requested_by        uuid          REFERENCES admin_users(id) ON DELETE SET NULL,
  assigned_to         uuid          REFERENCES admin_users(id) ON DELETE SET NULL,
  completed_by        uuid          REFERENCES admin_users(id) ON DELETE SET NULL,
  completed_at        timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT handoff_target_department_check CHECK (
    target_department IN ('housekeeping', 'maintenance')
  ),
  CONSTRAINT handoff_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  CONSTRAINT handoff_status_check CHECK (
    status IN ('open', 'in_progress', 'done', 'cancelled')
  )
);

CREATE INDEX idx_handoff_requests_target_department ON handoff_requests (target_department);
CREATE INDEX idx_handoff_requests_status            ON handoff_requests (status);
CREATE INDEX idx_handoff_requests_room_id           ON handoff_requests (room_id);
CREATE INDEX idx_handoff_requests_reservation_id    ON handoff_requests (reservation_id);
CREATE INDEX idx_handoff_requests_created_at        ON handoff_requests (created_at DESC);

CREATE TRIGGER trg_updated_at_handoff_requests
  BEFORE UPDATE ON handoff_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE handoff_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_handoff_requests" ON handoff_requests
  FOR ALL USING (public.is_admin_user());
