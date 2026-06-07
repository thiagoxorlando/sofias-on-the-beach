import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GuestSignUpForm } from './GuestSignUpForm'

export const metadata: Metadata = { title: "Criar conta — Sofia's on the Beach" }

const PAGE_BG = 'linear-gradient(155deg, #061A2A 0%, #0B2235 48%, #1B3B52 100%)'

type SP = Promise<{ next?: string | string[] }>

export default async function CriarContaPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const nextUrl = typeof sp.next === 'string' && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/minha-conta'

  // Already logged in — send them onward
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(nextUrl)

  return (
    <div className="min-h-[calc(100svh-64px)] md:min-h-[calc(100svh-92px)] flex items-center justify-center px-4 py-12" style={{ background: PAGE_BG }}>
      <div className="w-full max-w-[480px]">
        <div className="bg-ivory-soft rounded-[32px] shadow-[0_40px_110px_-20px_rgba(2,12,22,0.5)] px-9 py-12 md:px-12 md:py-14">

          <div className="flex items-center justify-center gap-3 mb-6">
            <SofiasMark className="w-11 h-11 text-navy-deep shrink-0" />
            <div>
              <p className="font-serif text-[25px] font-bold text-navy-deep leading-none tracking-tight">
                SOFIA&apos;S
              </p>
              <p className="text-[9px] font-semibold text-stone uppercase tracking-[0.22em] mt-1.5">
                on the beach
              </p>
            </div>
          </div>
          <div className="w-10 h-[2px] rounded-full bg-warm-sand mx-auto mb-7" />

          <div className="text-center mb-9">
            <h1 className="font-serif text-[28px] md:text-[30px] font-bold text-navy-deep leading-tight">
              Criar sua conta
            </h1>
            <p className="text-[14px] text-stone mt-3">
              Para reservar com segurança, sem comissões.
            </p>
          </div>

          <GuestSignUpForm nextUrl={nextUrl} />

        </div>

        <p className="text-center mt-8">
          <Link href="/" className="text-[12px] text-ivory/55 hover:text-ivory/85 transition-colors">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  )
}

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 38 Q12 34 20 38 T36 38"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
