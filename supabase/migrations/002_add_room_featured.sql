-- Add featured flag to rooms table for landing page visibility control.
-- featured = true means the room appears in the homepage RoomsPreview section.
-- featured = false (default) means the room is active but not highlighted on the landing page.
ALTER TABLE rooms ADD COLUMN featured boolean NOT NULL DEFAULT false;
