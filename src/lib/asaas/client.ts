const IS_SANDBOX = process.env.NEXT_PUBLIC_ASAAS_SANDBOX !== 'false'
const BASE_URL   = IS_SANDBOX
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error('ASAAS_API_KEY not configured')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Asaas ${method} ${endpoint} → HTTP ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string | null
}

export interface AsaasPayment {
  id: string
  status: string
  value: number
  billingType: string
  dueDate: string
  invoiceUrl?: string | null
}

export interface AsaasPixQrCode {
  encodedImage: string  // base64 PNG
  payload: string       // copy-paste code
  expirationDate: string
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone?: string
  mobilePhone?: string
}

// ── API calls ───────────────────────────────────────────────────────────────

export function createCustomer(data: {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
}): Promise<AsaasCustomer> {
  return request<AsaasCustomer>('POST', '/customers', data)
}

export function createPayment(data: {
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
}): Promise<AsaasPayment> {
  return request<AsaasPayment>('POST', '/payments', data)
}

export function createCardPayment(data: {
  customer: string
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  creditCard: AsaasCreditCard
  creditCardHolderInfo: AsaasCreditCardHolderInfo
}): Promise<AsaasPayment> {
  return request<AsaasPayment>('POST', '/payments', {
    ...data,
    billingType: 'CREDIT_CARD',
  })
}

export function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return request<AsaasPixQrCode>('GET', `/payments/${paymentId}/pixQrCode`)
}
