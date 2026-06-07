'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { guestSignUpAction, type GuestSignUpState } from './actions'
import { LABEL, INPUT, BTN_PRIMARY } from '@/components/booking/ui'

export function GuestSignUpForm({ nextUrl }: { nextUrl: string }) {
  const [state, formAction, isPending] = useActionState<GuestSignUpState, FormData>(
    guestSignUpAction,
    undefined,
  )

  if (state && 'emailSent' in state) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
          <MailIcon />
        </div>
        <h2 className="font-serif text-[18px] font-bold text-navy-deep">Verifique seu e-mail</h2>
        <p className="text-[14px] text-stone leading-relaxed">
          Enviamos um link de confirmação para o seu e-mail.
          Clique no link para ativar sua conta e continuar.
        </p>
        <Link href="/entrar" className="inline-block text-[13px] font-semibold text-navy-deep hover:text-navy underline underline-offset-2">
          Já confirmei — Fazer login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="next" value={nextUrl} />

      <div>
        <label htmlFor="full_name" className={LABEL}>Nome completo *</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          placeholder="Como consta no documento"
          className={INPUT}
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="email" className={LABEL}>E-mail *</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className={INPUT}
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>Senha *</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          className={INPUT}
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="phone" className={LABEL}>Telefone / WhatsApp</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+55 22 99999-9999"
          className={INPUT}
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-600 bg-red-50 rounded-2xl px-4 py-3.5">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-3.5 text-[13px] ${BTN_PRIMARY}`}
      >
        {isPending ? 'Criando conta…' : 'Criar conta'}
      </button>

      <p className="text-center text-[13px] text-stone">
        Já tem conta?{' '}
        <Link
          href={`/entrar${nextUrl !== '/' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
          className="font-semibold text-navy-deep hover:text-navy underline underline-offset-2"
        >
          Fazer login
        </Link>
      </p>
    </form>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-600" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}
