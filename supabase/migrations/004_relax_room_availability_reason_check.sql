-- The original CHECK constraint only allowed a fixed set of English category
-- values ('reservation' | 'maintenance' | 'owner_use' | 'channel'), but the
-- admin "Bloquear período" UI lets staff pick human-readable Portuguese
-- presets (e.g. "Manutenção", "Limpeza") or type a free-form custom reason —
-- none of which satisfied the constraint, so every manual block insert/update
-- failed. Relax it to simply require non-empty text; reservation-driven
-- blocks continue to write the literal 'reservation' value untouched.
ALTER TABLE room_availability DROP CONSTRAINT room_availability_reason_check;

ALTER TABLE room_availability ADD CONSTRAINT room_availability_reason_check
  CHECK (length(trim(blocked_reason)) > 0);
