import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Logged in + on login page — send to dashboard
  // ONLY for dev environment as requested
  if (path === '/login' && process.env.NODE_ENV === 'development') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  // Only try to create Supabase client if env vars are present
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/onboarding', '/profile/:path*'],
}