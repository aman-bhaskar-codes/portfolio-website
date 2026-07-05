import type { Metadata } from 'next'
import './globals.css'
import { CursorGlow } from '@/components/effects/CursorGlow'
import Providers from "@/components/Providers"

export const metadata: Metadata = {
  title: 'Aman Bhaskar — Agentic Portfolio',
  description: 'A living intelligence. Not a portfolio. A Digital Twin OS.',
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
    <html lang="en" className="bg-background">
      <body className="bg-void text-primary antialiased">
        <Providers>
          <CursorGlow />
          {children}
        </Providers>
      </body>
    </html>
  )
}
