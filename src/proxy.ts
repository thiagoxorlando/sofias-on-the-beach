import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session on every request — keeps the user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from the admin panel
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/entrar', request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect unauthenticated guests away from the reservation page
  if (!user && request.nextUrl.pathname === '/reservar') {
    const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    const loginUrl = new URL(`/entrar?next=${next}`, request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect unauthenticated users away from the guest account area
  if (!user && request.nextUrl.pathname.startsWith('/minha-conta')) {
    const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    const loginUrl = new URL(`/entrar?next=${next}`, request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
