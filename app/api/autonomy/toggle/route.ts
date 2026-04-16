/**
 * POST /api/autonomy/toggle
 * Owner-exclusive endpoint to manipulate System Autonomy state.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "owner") {
        return NextResponse.json({ error: "Unauthorized. Cognitive privilege escalation denied." }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { mode } = body; // e.g. 'passive', 'advisory', 'autonomous'

        // In a real system, you would update the tenant/system configuration DB row here.
        console.log(`[GOVERNANCE] Owner adjusted autonomy to: ${mode}`);

        return NextResponse.json({ success: true, mode, message: `System shifted to ${mode} autonomy.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
