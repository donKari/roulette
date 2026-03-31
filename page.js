// app/[lang]/page.js
// Server Component: resolves lang from URL, passes it down to the client wheel.

import { SUPPORTED_LANGS } from '@/lib/translations'
import { notFound } from 'next/navigation'
import SpinWheel from '@/components/SpinWheel'

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }))
}

export default async function WheelPage({ params }) {
  const { lang } = await params

  // Return 404 for unsupported languages
  if (!SUPPORTED_LANGS.includes(lang)) notFound()

  return <SpinWheel lang={lang} />
}
