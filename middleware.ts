import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isAuthRoute      = path === '/login' || path === '/signup'
  const isPatientRoute   = path.startsWith('/dashboard') || path.startsWith('/medications') || path.startsWith('/settings')
  const isCaretakerRoute = path.startsWith('/caretaker')
  const isProtected      = isPatientRoute || isCaretakerRoute

  // Not logged in → redirect to login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in → redirect away from auth pages based on role
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const dest = profile?.role === 'caretaker' ? '/caretaker' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Role guard — fetch role and enforce for protected routes
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Caretaker trying to access patient routes → send to caretaker dashboard
    if (role === 'caretaker' && isPatientRoute) {
      return NextResponse.redirect(new URL('/caretaker', request.url))
    }

    // Patient trying to access caretaker routes → send to patient dashboard
    if (role === 'patient' && isCaretakerRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/medications/:path*',
    '/settings/:path*',
    '/caretaker/:path*',
    '/login',
    '/signup',
  ],
}
