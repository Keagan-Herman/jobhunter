import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(_: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/profile/:path*'],
}
