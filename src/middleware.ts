import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isHomePage = request.nextUrl.pathname === '/'

  const response = isDashboard && !token
    ? NextResponse.redirect(new URL('/', request.url))
    : isHomePage && token
    ? NextResponse.redirect(new URL('/dashboard', request.url))
    : NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$).*)']
}
