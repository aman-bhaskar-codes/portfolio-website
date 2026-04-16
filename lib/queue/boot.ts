/**
 * App Bootstrap — Queue Handler Registration
 *
 * This module is imported by the app to register all background
 * job handlers on startup. Import it from any server-side entry point.
 */

import { registerAllHandlers } from "@/lib/queue/handlers";
import { recoverStaleJobs } from "@/lib/queue";

let initialized = false;

export function initializeQueue() {
    if (initialized) return;
    initialized = true;

    registerAllHandlers();
    recoverStaleJobs().catch((err) =>
        console.warn("[QUEUE] Stale recovery failed:", err.message)
    );

    console.log("[BOOT] Background job system initialized");
}
