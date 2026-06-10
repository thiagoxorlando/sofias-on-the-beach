-- Add manual payment (PIX / bank transfer) settings keys
-- These are displayed to guests on the reservation confirmation page and used
-- by reception when the pix_manual payment method is selected in the walk-in form.

INSERT INTO settings (key, label, value, group_name, is_public) VALUES
  ('manual_payment_holder_name',  'Titular da conta',             '',  'general', false),
  ('manual_payment_bank_name',    'Banco',                        '',  'general', false),
  ('manual_payment_pix_key',      'Chave PIX',                    '',  'general', true),
  ('manual_payment_pix_key_type', 'Tipo da chave PIX',            '',  'general', true),
  ('manual_payment_instructions', 'Instruções de pagamento',      '',  'general', true),
  ('manual_payment_whatsapp',     'WhatsApp para pagamento',      '',  'general', true)
ON CONFLICT (key) DO NOTHING;
