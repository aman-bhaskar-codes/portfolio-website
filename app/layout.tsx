import type { Metadata } from 'next'
import { Unbounded, DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { SmoothScroll } from '@/providers/SmoothScroll'
import Providers from "@/components/Providers"

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  weight: ['400', '700', '800', '900'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aman Bhaskar — Agentic Portfolio OS',
  description:
    "A living intelligence. Not a portfolio. Aman Bhaskar's Digital Twin — a self-optimizing AI that knows every line of code, advocates 24/7, and speaks in Aman's voice.",
  keywords: ['Aman Bhaskar', 'Agentic AI', 'Digital Twin', 'Full Stack Developer', 'LangGraph', 'RAG Pipeline'],
  authors: [
    { name: "Aman Bhaskar", url: "https://github.com/aman-bhaskar-codes" },
  ],
  creator: "Aman Bhaskar",
  openGraph: {
    title: 'Aman Bhaskar — Agentic Portfolio OS',
    description: 'A living intelligence. Not a portfolio.',
    url: 'https://amanbhaskar.dev',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@_aman_bhaskar',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-bg text-text1 antialiased">
        <Providers>
          <CustomCursor />
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  )
}
