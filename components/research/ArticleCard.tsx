import Link from "next/link";
import { ArrowUpRight, Calendar } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    tags: string[];
    createdAt: Date;
}

export default function ArticleCard({ article }: { article: Article }) {
    return (
        <Link
            href={`/research/${article.slug}`}
            className="group block p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent/20 hover:bg-white/[0.04] transition-all duration-500"
        >
            <div className="space-y-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-mono uppercase tracking-wider"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white group-hover:text-accent transition-colors leading-tight">
                    {article.title}
                </h2>

                {/* Summary */}
                <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                    {article.summary}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar size={12} />
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                            {new Date(article.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono">
                        Read <ArrowUpRight size={14} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
