-- Maintenance ticket workflow (hotel operations sprint).
-- Lets staff report, track and resolve maintenance issues for rooms/property,
-- and optionally block the room's calendar for the repair period — with clean
-- traceability back to the ticket so a "fixed" resolution can safely lift only
-- the blocks it created (never reservation blocks or unrelated manual blocks).

CREATE TABLE maintenance_tickets (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             uuid        REFERENCES rooms(id) ON DELETE SET NULL,
  title               text        NOT NULL,
  description         text,
  priority            text        NOT NULL DEFAULT 'medium',
  status              text        NOT NULL DEFAULT 'open',
  photo_paths         text[]      NOT NULL DEFAULT '{}',
  blocks_room         boolean     NOT NULL DEFAULT false,
  blocked_start_date  date,
  blocked_end_date    date,
  reported_by         uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  assigned_to         uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT maintenance_tickets_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  CONSTRAINT maintenance_tickets_status_check CHECK (
    status IN ('open', 'in_progress', 'fixed')
  )
);

COMMENT ON TABLE maintenance_tickets IS
  'Maintenance issues reported for rooms/property. Optionally blocks the room''s '
  'calendar (room_availability rows tagged with maintenance_ticket_id) for the '
  'repair period — cleared automatically when the ticket is marked fixed.';

-- Traceability: lets us safely clear only the manual blocks a specific ticket
-- created when it's resolved, without touching reservation blocks or unrelated
-- manual blocks (owner_use, channel, other tickets).
ALTER TABLE room_availability
  ADD COLUMN maintenance_ticket_id uuid REFERENCES maintenance_tickets(id) ON DELETE SET NULL;

COMMENT ON COLUMN room_availability.maintenance_ticket_id IS
  'Set when this block was created by a maintenance ticket (blocks_room = true). '
  'Lets the ticket''s "fixed" resolution safely remove only its own blocks.';

CREATE INDEX idx_maintenance_tickets_room_id    ON maintenance_tickets (room_id);
CREATE INDEX idx_maintenance_tickets_status     ON maintenance_tickets (status);
CREATE INDEX idx_maintenance_tickets_priority   ON maintenance_tickets (priority);
CREATE INDEX idx_maintenance_tickets_created_at ON maintenance_tickets (created_at DESC);
CREATE INDEX idx_room_availability_maintenance_ticket_id ON room_availability (maintenance_ticket_id);

ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_maintenance_tickets" ON maintenance_tickets
  FOR ALL USING (public.is_admin_user());

-- Private bucket — ticket photos may show guest belongings/rooms, viewed via
-- short-lived signed URLs minted on demand (same shape as payment-receipts).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-photos',
  'maintenance-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
