
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query, session_id } = body;

        // Forward to Python Microservice
        const pythonServiceUrl = process.env.AI_ENGINE_URL || "http://127.0.0.1:8008";

        console.log(`[Proxy] Forwarding to Python Engine: ${pythonServiceUrl}/chat`);

        const response = await fetch(`${pythonServiceUrl}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                session_id: session_id || "default",
                user_id: "user_from_nextjs"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Proxy] Python Engine Error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: "AI Engine Unavailable", details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("[Proxy] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Proxy Error", details: String(error) },
            { status: 500 }
        );
    }
}
