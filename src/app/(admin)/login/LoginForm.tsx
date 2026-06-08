'use client'

import { useActionState } from 'react'
import { signInAction, type LoginState } from './actions'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    signInAction,
    null,
  )

  return (
    <form action={formAction} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[12px] font-semibold text-slate-800 uppercase tracking-[0.10em]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full border border-admin-border rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 bg-white transition-shadow"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[12px] font-semibold text-slate-800 uppercase tracking-[0.10em]"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full border border-admin-border rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 bg-white transition-shadow"
        />
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-admin-sidebar text-white py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-[0.10em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {isPending ? 'Entrando…' : 'Entrar no painel'}
      </button>
    </form>
  )
}
