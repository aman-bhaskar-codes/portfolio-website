
import { NextResponse } from 'next/server';
import { KnowledgeOrchestrator } from '@/lib/services/knowledge-orchestrator';

export async function POST() {
    try {
        const orchestrator = KnowledgeOrchestrator.getInstance();

        // This process is heavy, so we don't await the full completion in the response
        // In production, use a background job queue (BullMQ/Inngest)
        // Here, we await it for demo verification purposes to see logs.
        await orchestrator.performFullSync();

        return NextResponse.json({ success: true, message: "Knowledge Sync Completed" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
