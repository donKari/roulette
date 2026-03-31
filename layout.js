// app/[lang]/layout.js
// Shared layout for all language routes.
// Handles: <html lang>, hreflang alternates, title, meta description, OG tags.

import { SEO_META, SUPPORTED_LANGS, BASE_URL } from '@/lib/translations'

// Tell Next.js which lang segments to pre-render at build time
export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }))
}

// Dynamic metadata per language
export async function generateMetadata({ params }) {
  const { lang } = await params
  const meta = SEO_META[lang] ?? SEO_META.en

  const alternates = {
    canonical: `${BASE_URL}/${lang}`,
    languages: Object.fromEntries(
      SUPPORTED_LANGS.map((l) => [l, `${BASE_URL}/${l}`])
    ),
  }

  return {
    title: meta.title,
    description: meta.description,
    alternates,
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      url: `${BASE_URL}/${lang}`,
      siteName: 'SpinLux',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle,
      description: meta.ogDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function LangLayout({ children, params }) {
  const { lang } = await params
  const validLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en'

  return (
    <html lang={validLang}>
      <head />
      <body>{children}</body>
    </html>
  )
}
