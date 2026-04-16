"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ArticleContent({ content }: { content: string }) {
    return (
        <div className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6
            prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
            prose-p:text-neutral-400 prose-p:leading-relaxed prose-p:font-light
            prose-strong:text-white prose-strong:font-bold
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-li:text-neutral-400 prose-li:marker:text-accent/40
            prose-ol:text-neutral-400
            prose-code:text-accent prose-code:text-sm prose-code:font-mono
            prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:p-6
            prose-blockquote:border-accent/40 prose-blockquote:text-neutral-500 prose-blockquote:font-light
            prose-hr:border-white/10
        ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
