import Navbar from "@/components/layout/Navbar";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import ArticleContent from "@/components/research/ArticleContent";

export default async function ResearchArticle({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const article = await prisma.research.findUnique({
        where: { slug },
    });

    if (!article) return notFound();

    // Estimate read time (~200 WPM)
    const wordCount = article.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <main className="min-h-screen bg-bg-base selection:bg-accent/30 selection:text-white">
            <Navbar />

            <article className="pt-36 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Back link */}
                    <Link
                        href="/research"
                        className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-accent transition-colors mb-12 uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} /> Back to Research
                    </Link>

                    {/* Header */}
                    <header className="space-y-6 mb-16">
                        <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-mono uppercase tracking-wider"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                            {article.title}
                        </h1>

                        <p className="text-lg text-neutral-400 font-light leading-relaxed">
                            {article.summary}
                        </p>

                        <div className="flex items-center gap-6 text-neutral-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span className="text-xs font-mono">
                                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span className="text-xs font-mono">{readTime} min read</span>
                            </div>
                        </div>
                    </header>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16" />

                    {/* Content */}
                    <ArticleContent content={article.content} />
                </div>
            </article>
        </main>
    );
}
