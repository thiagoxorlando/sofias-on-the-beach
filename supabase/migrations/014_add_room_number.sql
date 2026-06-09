-- Add an internal room number field (e.g. "1", "101", "202A")
-- Distinct from the public room name used on the website.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number text;

-- Backfill: extract trailing number+optional-letter from existing names
-- ("Quarto 3" → "3", "Suíte 101A" → "101A").  Rooms with no number stay null.
UPDATE rooms
SET room_number = (regexp_match(name, '(\d+[A-Za-z]?)\s*$'))[1]
WHERE room_number IS NULL;

-- Partial unique index: prevents two rooms from sharing the same number,
-- but allows multiple rows with NULL (rooms not yet assigned a number).
CREATE UNIQUE INDEX IF NOT EXISTS rooms_room_number_unique
  ON rooms (room_number)
  WHERE room_number IS NOT NULL;
