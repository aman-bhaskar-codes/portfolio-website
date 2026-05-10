import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Aman Bhaskar — Agentic AI Developer",
  description:
    "Building autonomous AI systems, RAG pipelines, and production-grade LLM infrastructure. Ask my AI twin anything about my work.",
  keywords: [
    "AI developer",
    "RAG",
    "LLM",
    "FastAPI",
    "Next.js",
    "machine learning",
    "Aman Bhaskar",
  ],
  authors: [
    { name: "Aman Bhaskar", url: "https://github.com/aman-bhaskar-codes" },
  ],
  creator: "Aman Bhaskar",
  openGraph: {
    title: "Aman Bhaskar — Agentic AI Developer",
    description:
      "Building autonomous AI systems, RAG pipelines, and production-grade LLM infrastructure.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aman Bhaskar — Agentic AI Developer",
    creator: "@_aman_bhaskar",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-bg-primary text-text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
