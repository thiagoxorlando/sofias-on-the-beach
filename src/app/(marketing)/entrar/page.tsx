import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import { GuestLoginForm } from './GuestLoginForm'
import { BTN_PRIMARY } from '@/components/booking/ui'

export const metadata: Metadata = { title: "Entrar — Sofia's on the Beach" }

const PAGE_BG = 'linear-gradient(155deg, #061A2A 0%, #0B2235 48%, #1B3B52 100%)'

type SP = Promise<{ next?: string | string[]; msg?: string | string[] }>

export default async function EntrarPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const nextUrl = typeof sp.next === 'string' && sp.next.startsWith('/') && !sp.next.startsWith('//')
    ? sp.next
    : '/minha-conta'
  const msgParam = typeof sp.msg === 'string' ? sp.msg : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const isAdmin = await isAdminUser(user.id)
    if (!isAdmin) {
      // Guest already logged in — redirect them
      redirect(nextUrl)
    }
    // Admin is on the guest login page — show staff warning
    return (
      <div className="min-h-[calc(100svh-64px)] md:min-h-[calc(100svh-92px)] flex items-center justify-center px-4 py-12" style={{ background: PAGE_BG }}>
        <div className="w-full max-w-[480px]">
          <div className="bg-ivory-soft rounded-[32px] shadow-[0_40px_110px_-20px_rgba(2,12,22,0.5)] px-9 py-12 md:px-12 md:py-14 text-center space-y-6">
            <Brand />
            <Divider />
            <h1 className="font-serif text-[24px] font-bold text-navy-deep">
              Conta de funcionário
            </h1>
            <p className="text-[14px] text-stone leading-relaxed">
              Você está logado como membro da equipe. Esta área é exclusiva para hóspedes.
              Para fazer uma reserva como hóspede, crie uma conta separada com outro e-mail.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/dashboard" className={`w-full py-3.5 text-[13px] ${BTN_PRIMARY}`}>
                Ir para o painel
              </Link>
              <Link href="/" className="text-[12px] text-stone hover:text-navy-deep transition-colors">
                ← Voltar ao site
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const warning = msgParam === 'admin_account'
    ? 'Esta conta é de funcionário da pousada. Para fazer reservas, crie uma conta de hóspede com outro e-mail.'
    : null

  return (
    <div className="min-h-[calc(100svh-64px)] md:min-h-[calc(100svh-92px)] flex items-center justify-center px-4 py-12" style={{ background: PAGE_BG }}>
      <div className="w-full max-w-[480px]">
        <div className="bg-ivory-soft rounded-[32px] shadow-[0_40px_110px_-20px_rgba(2,12,22,0.5)] px-9 py-12 md:px-12 md:py-14">

          <Brand />
          <Divider />

          <div className="text-center mb-9">
            <h1 className="font-serif text-[28px] md:text-[30px] font-bold text-navy-deep leading-tight">
              Entrar na sua conta
            </h1>
            <p className="text-[14px] text-stone mt-3">
              Acesse para acompanhar suas reservas e seus dados.
            </p>
          </div>

          {warning && (
            <div className="mb-6 px-5 py-4 bg-warm-sand/22 rounded-2xl">
              <p className="text-[13px] text-navy leading-snug">{warning}</p>
            </div>
          )}

          <GuestLoginForm nextUrl={nextUrl} />

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

function Brand() {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <Image src="/images/experience/sofias_icon_transparent.png" alt="Sofia's on the Beach" width={44} height={44} className="w-11 h-11 object-contain shrink-0" />
      <div>
        <p className="font-serif text-[25px] font-bold text-navy-deep leading-none tracking-tight">
          SOFIA&apos;S
        </p>
        <p className="text-[9px] font-semibold text-stone uppercase tracking-[0.22em] mt-1.5">
          on the beach
        </p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="w-10 h-[2px] rounded-full bg-warm-sand mx-auto mb-7" />
}

