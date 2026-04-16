/**
 * Tenant Management API
 *
 * POST /api/tenants — Create new tenant (returns API key)
 * GET  /api/tenants — List tenants (admin only, no auth for demo)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateApiKey, getPlanLimits, getDefaultFeatures } from "@/lib/saas/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, plan } = body;

        if (!name || !email) {
            return NextResponse.json({ error: "Missing 'name' and 'email'" }, { status: 400 });
        }

        // Check duplicate
        const existing = await prisma.tenant.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const apiKey = generateApiKey();
        const selectedPlan = ["free", "pro", "enterprise"].includes(plan) ? plan : "free";
        const limits = getPlanLimits(selectedPlan);
        const features = getDefaultFeatures(selectedPlan);

        const tenant = await prisma.tenant.create({
            data: {
                name, email, apiKey, plan: selectedPlan,
                maxTokensPerDay: limits.maxTokensPerDay,
                maxToolCalls: limits.maxToolCalls,
                maxMemoryMb: limits.maxMemoryMb,
                features: features as any,
            },
        });

        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
                plan: tenant.plan,
                apiKey: tenant.apiKey, // Show once, never again
            },
            message: "Store your API key securely — it will not be shown again.",
        });
    } catch (e) {
        console.error("[Tenants API] Error:", e);
        return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true, name: true, email: true, plan: true,
                active: true, createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const totalTenants = await prisma.tenant.count();
        const planCounts = {
            free: await prisma.tenant.count({ where: { plan: "free" } }),
            pro: await prisma.tenant.count({ where: { plan: "pro" } }),
            enterprise: await prisma.tenant.count({ where: { plan: "enterprise" } }),
        };

        return NextResponse.json({ tenants, total: totalTenants, planCounts });
    } catch (e) {
        return NextResponse.json({ error: "Failed to list tenants" }, { status: 500 });
    }
}
