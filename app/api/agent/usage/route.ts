/**
 * Tenant Usage API
 *
 * GET /api/agent/usage — Get current tenant's usage metrics
 * Requires: Authorization: Bearer <api_key>
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/saas/auth";
import { getTenantUsage, estimateCost } from "@/lib/saas/metering";

export async function GET(req: NextRequest) {
    try {
        const { auth, error } = await authenticateRequest(req);
        if (error || !auth) return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const usage = await getTenantUsage(auth.tenantId);
        const cost = estimateCost(usage.current as any);

        return NextResponse.json({
            plan: auth.plan,
            limits: auth.limits,
            currentPeriod: usage.current,
            estimatedCost: `$${cost.toFixed(4)}`,
            history: usage.history,
        });
    } catch (e) {
        return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
    }
}
