import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './LoginForm'

export const metadata = { title: "Painel — Sofia's on the Beach" }

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          'linear-gradient(150deg, #001e36 0%, #002B4A 45%, #004d80 80%, #0077b6 100%)',
      }}
    >
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,18,50,0.30)] px-8 py-10">

          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image src="/images/experience/sofias_icon_transparent.png" alt="Sofia's on the Beach" width={40} height={40} className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="text-[26px] font-bold text-slate-800 leading-none tracking-tight">
                SOFIA&apos;S
              </p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.20em] mt-1">
                on the beach
              </p>
            </div>
          </div>

          <div className="w-8 h-[2px] rounded-full bg-slate-200 mx-auto mb-6" />

          <p className="text-center text-[12px] font-semibold text-slate-700 uppercase tracking-[0.18em] mb-8">
            Painel administrativo
          </p>

          <LoginForm />

        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-[12px] text-white/60 hover:text-white/90 transition-colors"
          >
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </main>
  )
}

