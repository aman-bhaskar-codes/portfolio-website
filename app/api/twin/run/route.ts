import { runDigitalTwin } from "@/lib/twin/orchestrator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // Strict Owner Check - DISABLED FOR TESTING
    // if (!session || (session.user as any)?.role !== "owner") {
    //     return new Response("Unauthorized", { status: 401 });
    // }

    try {
        const { goal } = await req.json();

        // Handle optional user
        const userId = session?.user ? (session.user as any).id : "test-user";

        // Run Twin Orchestrator
        const result = await runDigitalTwin(goal, userId);

        return Response.json(result);
    } catch (error: any) {
        console.error("Twin Error", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
