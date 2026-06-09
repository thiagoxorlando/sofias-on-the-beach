-- Seeds the `online_booking_enabled` setting key. Admins use this to launch
-- the site in "landing page mode" (booking blocked) and flip it on when ready
-- to accept online reservations. Default is false — booking is OFF until admin
-- explicitly enables it via /dashboard/settings.
INSERT INTO settings (key, value, label, group_name, is_public)
VALUES (
  'online_booking_enabled',
  'false'::jsonb,
  'Reservas online ativas',
  'general',
  false
)
ON CONFLICT (key) DO NOTHING;
