import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)  // ✅ only 2 args for request cookies
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)  // ✅ 3 args fine for response cookies
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuth = !!user
  const path = request.nextUrl.pathname

  // Not logged in — send to login
  if (!isAuth && (path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/profile'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in + on login page — send to dashboard
  if (isAuth && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/onboarding', '/profile/:path*'],
}