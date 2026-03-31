import { NextResponse } from 'next/server'

const SUPPORTED_LANGS = ['fr', 'en', 'es']
const DEFAULT_LANG = 'en'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Already on a language route → skip
  if (SUPPORTED_LANGS.some(lang => pathname.startsWith(`/${lang}`))) {
    return NextResponse.next()
  }

  // Only redirect root "/"
  if (pathname !== '/') return NextResponse.next()

  // Detect browser language from Accept-Language header
  const acceptLang = request.headers.get('accept-language') || ''
  const preferred = acceptLang
    .split(',')
    .map(l => l.split(';')[0].trim().slice(0, 2).toLowerCase())
    .find(l => SUPPORTED_LANGS.includes(l))

  const target = preferred || DEFAULT_LANG
  return NextResponse.redirect(new URL(`/${target}`, request.url))
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
