import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Bebas_Neue, Syne } from "next/font/google";
import "./styles/globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ["latin"], variable: "--font-display-alt" });
const syne = Syne({ subsets: ["latin"], variable: "--font-display" });

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
      className={`${inter.variable} ${mono.variable} ${bebasNeue.variable} ${syne.variable} scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-black text-white overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
