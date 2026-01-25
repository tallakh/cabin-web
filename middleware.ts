import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // First, let i18n middleware handle locale routing
  const intlResponse = intlMiddleware(request)
  
  // Extract locale from the pathname
  const pathname = request.nextUrl.pathname
  const locale = pathname.split('/')[1] || routing.defaultLocale
  const isValidLocale = routing.locales.includes(locale as any)
  const actualLocale = isValidLocale ? locale : routing.defaultLocale
  
  // Handle auth session - but preserve locale in redirects
  const authResponse = await updateSession(request)
  
  // If auth redirected, ensure locale is preserved
  if (authResponse.status === 307 || authResponse.status === 308) {
    const location = authResponse.headers.get('location')
    if (location) {
      const redirectUrl = new URL(location, request.url)
      // If redirect doesn't have locale and isn't an API route, add it
      if (!redirectUrl.pathname.startsWith(`/${actualLocale}`) && 
          !redirectUrl.pathname.startsWith('/api') &&
          !redirectUrl.pathname.startsWith('/_next')) {
        redirectUrl.pathname = `/${actualLocale}${redirectUrl.pathname === '/' ? '' : redirectUrl.pathname}`
        return NextResponse.redirect(redirectUrl)
      }
    }
    return authResponse
  }
  
  // Return i18n response (which may have already set locale)
  return intlResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
