'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { guestSignInAction, type GuestLoginState } from './actions'
import { LABEL, INPUT, BTN_PRIMARY } from '@/components/booking/ui'

export function GuestLoginForm({ nextUrl }: { nextUrl: string }) {
  const [state, formAction, isPending] = useActionState<GuestLoginState, FormData>(
    guestSignInAction,
    undefined,
  )

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextUrl} />

      <div>
        <label htmlFor="email" className={LABEL}>E-mail</label>
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
        <label htmlFor="password" className={LABEL}>Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
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
        {isPending ? 'Acessando…' : 'Acessar'}
      </button>

      <p className="text-center text-[13px] text-stone">
        Não tem conta?{' '}
        <Link
          href={`/criar-conta${nextUrl !== '/' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
          className="font-semibold text-navy-deep hover:text-navy underline underline-offset-2"
        >
          Criar conta gratuita
        </Link>
      </p>
    </form>
  )
}
