# Payments — Sofia's on the Beach

## Payment Gateway: Asaas

Asaas is a Brazilian payment gateway supporting PIX and credit cards.

- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Production**: `https://api.asaas.com/v3`
- **Auth header**: `access_token: <ASAAS_API_KEY>`

## Environment Variables

```
ASAAS_API_KEY=           # Asaas API key (sandbox or production)
NEXT_PUBLIC_ASAAS_SANDBOX=true   # Set to "false" for production
ASAAS_WEBHOOK_TOKEN=     # Optional: validates incoming webhook requests
```

## Payment Flow

### 1. Reservation Created
- Status: `pending_payment`
- No payment record exists yet
- Guest is on `/reserva/[token]`

### 2. Guest Chooses Payment Method
- PIX: immediate QR code generation
- Credit Card: card form with secure server-side processing

### 3. Payment Initiation

#### PIX (`generatePixPaymentAction`)
1. Load reservation by token
2. Return existing payment if already created (idempotent)
3. Create Asaas customer (`POST /customers`)
4. Create PIX charge (`POST /payments`, `billingType: PIX`, due in 3 days)
5. Fetch PIX QR code (`GET /payments/{id}/pixQrCode`)
6. Insert `payments` row with PIX data
7. Log `payment_initiated` event
8. Return QR code + copy-paste code to frontend

#### Credit Card (`generateCardPaymentAction`)
1. Load reservation by token
2. Return existing payment if already created (idempotent)
3. Create Asaas customer (`POST /customers`)
4. Create card charge (`POST /payments`, `billingType: CREDIT_CARD`)
   - Includes `creditCard` object: holderName, number, expiryMonth, expiryYear, ccv
   - Includes `creditCardHolderInfo`: name, email, cpfCnpj, postalCode, addressNumber
5. Insert `payments` row (card data is NEVER stored)
6. Log `payment_initiated` event
7. Return invoice URL to frontend

**Important**: Raw card data flows from the browser → Server Action → Asaas API. It is never stored in Supabase.

### 4. Webhook Confirmation (`POST /api/webhooks/asaas`)

Asaas sends a webhook on payment events:
- `PAYMENT_RECEIVED` or `PAYMENT_CONFIRMED` → mark payment as paid, reservation as confirmed

Webhook validation: if `ASAAS_WEBHOOK_TOKEN` is set, verify the `asaas-access-token` header.

## Database Schema

### `payments` table
| Column | Description |
|--------|-------------|
| `reservation_id` | FK to reservations |
| `amount_brl` | Payment amount |
| `method` | `pix` or `card` |
| `provider` | `asaas` |
| `asaas_payment_id` | Asaas payment ID (for webhook matching) |
| `asaas_invoice_url` | Asaas invoice link |
| `asaas_pix_qr_code` | Base64 PNG QR code (PIX only) |
| `asaas_pix_copy_paste` | PIX payload string (PIX only) |
| `asaas_due_date` | Payment due date |
| `status` | `pending`, `paid`, `failed`, `refunded` |
| `paid_at` | Timestamp when payment was confirmed |

## Asaas Client (`src/lib/asaas/client.ts`)

| Function | Description |
|----------|-------------|
| `createCustomer(data)` | Creates or finds Asaas customer |
| `createPayment(data)` | Creates PIX/BOLETO payment |
| `createCardPayment(data)` | Creates credit card payment (includes card fields) |
| `getPixQrCode(paymentId)` | Fetches PIX QR code image and payload |

## Idempotency

Both PIX and card payment actions check for existing non-failed payments before creating a new one. This prevents duplicate charges on page refresh.

## Error Handling

- Asaas errors → user-friendly Portuguese error messages
- QR code fetch failure (PIX) → non-fatal; user can use invoice URL fallback
- Card declined → shows "Cartão recusado ou dados inválidos"
