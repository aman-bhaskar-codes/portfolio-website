import { refinedVoiceTwin } from "@/lib/twin/inference-engine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // Public Access Allowed (with rate limiting ideally)
    const session = await getServerSession(authOptions);

    try {
        const body = await req.json();
        const { query: bodyQuery, message, visitorId } = body;
        const query = bodyQuery || message;

        if (!query) {
            return NextResponse.json({ error: "Missing query" }, { status: 400 });
        }

        let identifier: { userId?: string, visitorId?: string } = {};

        if (session && (session.user as any)?.role === "owner") {
            identifier.userId = (session.user as any).id;
        } else if (visitorId) {
            identifier.visitorId = visitorId;
        } else {
            identifier.visitorId = "anonymous";
        }

        // Use the new Inference Engine Twin
        // We pass the identifier object we just built
        const { stream, emotion, intent, router } = await refinedVoiceTwin(query, identifier);

        // Encode metadata header
        const metadata = JSON.stringify({
            emotion,
            intent,
            router // Pass router metadata
        });

        const encoder = new TextEncoder();
        const transformStream = new TransformStream({
            start(controller) {
                controller.enqueue(encoder.encode(metadata + "__END_HEADER__\n"));
            },
            transform(chunk, controller) {
                controller.enqueue(chunk);
            }
        });

        return new Response(stream.pipeThrough(transformStream), {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error) {
        console.error("Voice API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
