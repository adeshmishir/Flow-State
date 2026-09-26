import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppShell } from '@/components/layout/app-shell'
import { AppProviders } from '@/app/providers'
import '@/styles/globals.css'

/**
 * `next/font` self-hosts both families at build time: no third-party request,
 * no layout shift, and `display: swap` already applied. The CSS variables are
 * wired into the Tailwind theme in `src/styles/theme.css`.
 */
const sans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://flowstate.app'),
  title: {
    default: 'Flowstate — deep work workspace',
    template: '%s · Flowstate',
  },
  description:
    'Flowstate is a calm, distraction-free workspace for deep work. Choose one task, hold the state, review the session.',
  applicationName: 'Flowstate',
  openGraph: {
    type: 'website',
    siteName: 'Flowstate',
    title: 'Flowstate — deep work workspace',
    description:
      'Choose one task, hold the state, review the session. A workspace built for deep work.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#26221f' },
    { media: '(prefers-color-scheme: light)', color: '#f8f6f2' },
  ],
}

/**
 * Applied before first paint so the canvas never flashes the wrong theme.
 * Inlined and synchronous on purpose — a deferred script would still produce
 * a visible flash on slow connections.
 */
const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem('flowstate.theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  )
}
