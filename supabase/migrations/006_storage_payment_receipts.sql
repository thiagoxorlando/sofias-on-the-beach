-- Create the payment-receipts storage bucket — PRIVATE (unlike room-images),
-- because receipts may contain guests' personal/financial information. All
-- access goes through the admin (service role) client, which bypasses RLS
-- entirely, so no storage.objects policies for `authenticated`/`public` are
-- needed or added — staff view receipts via short-lived signed URLs minted
-- on demand by server actions.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
