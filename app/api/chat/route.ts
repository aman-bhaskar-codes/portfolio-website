import { NextRequest } from "next/server";
import { handleRag } from "@/lib/services/ragService";
import { logger } from "@/lib/logger";
import { RateLimiterMemory } from "rate-limiter-flexible";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { evaluateResponse } from "@/lib/agent/evaluator";
import { planRoute } from "@/lib/agent/planner";
import { analyzeAndRoute, runSelfEvaluation } from "@/lib/agent/orchestrator";
import { createEmbedding } from "@/lib/embeddings";
import { getMergedMemoryContext, promoteToLongTerm } from "@/lib/memory";
import { enforceGovernance, getGovernanceState } from "@/lib/core/governance";
import { buildEliteSystemPrompt } from "@/lib/core/prompts";
import { warmupModel } from "@/lib/core/warmup";

export const runtime = "nodejs";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";

// Dedicated in-memory rate limiter strictly for Chat
const rateLimiter = new RateLimiterMemory({
    points: 15,    // 15 requests
    duration: 60,  // Per minute per IP
});

const chatSchema = z.object({
    model: z.string().optional(),
    query: z.string().min(1).max(2000).optional(),
    messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(2000),
    })).optional(),
}).refine(data => data.query || (data.messages && data.messages.length > 0), {
    message: "Either query or messages must be provided",
});

export async function POST(req: NextRequest) {
    try {
        // 0. Rate limit check mapped to IP
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        try {
            await rateLimiter.consume(ip);
        } catch {
            logger.warn(`[RATE-LIMIT] Blocked chat request from ${ip}`);
            return new Response("Too Many Requests", { status: 429 });
        }

        const requestStart = Date.now();
        const rawBody = await req.json();

        // 0.5. Zod validation
        const parseResult = chatSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return new Response(JSON.stringify({
                error: "Invalid input",
                details: parseResult.error.flatten(),
            }), { status: 400 });
        }

        const body = parseResult.data;

        // Support both { messages } (chat panel) and { query } (demo/simple)
        const query = body.query || body.messages?.[body.messages.length - 1]?.content || "";
        const isDemo = req.headers.get("x-demo-mode") === "true";
        const sessionId = req.headers.get("x-session-id") || "default";

        logger.info(`[CHAT-REQUEST] Processing query: "${query.substring(0, 40)}..." (Demo: ${isDemo})`);

        // 0.75. Agent Planner + Orchestrator (synchronous, zero-latency)
        const plan = planRoute(query);
        const modelSelection = analyzeAndRoute(query);

        // ── PARALLEL EXECUTION: RAG + Memory + Governance ──
        // These three are independent — run them concurrently for ~60% pre-LLM latency reduction
        const sessionPromise = getOrCreateSession(sessionId);
        const [ragResult, memoryResult, govResult] = await Promise.allSettled([
            handleRag(query),
            (async () => {
                const [embedding, session] = await Promise.all([
                    createEmbedding(query),
                    sessionPromise,
                ]);
                return getMergedMemoryContext(session.id, embedding);
            })(),
            getGovernanceState(),
        ]);

        // Extract RAG (graceful fallback)
        const rag = ragResult.status === "fulfilled"
            ? ragResult.value
            : { context: "", confidence: 0, sourceCount: 0, cacheHit: false, intent: "general" };
        if (ragResult.status === "rejected") {
            logger.warn(`[RAG] Failed (non-blocking): ${ragResult.reason?.message}`);
        }

        // Extract Memory (graceful fallback)
        let memoryContext = "";
        if (memoryResult.status === "fulfilled") {
            memoryContext = memoryResult.value.context;
            logger.info(`[MEMORY] Layers: short-term=${memoryResult.value.layers.shortTerm}, long-term=${memoryResult.value.layers.longTerm}`);
        } else {
            logger.warn(`[MEMORY] Failed (non-blocking): ${memoryResult.reason?.message}`);
        }

        // Extract Governance (graceful fallback)
        let governancePrompt = "";
        let temperatureOverride: number | undefined;
        if (govResult.status === "fulfilled") {
            const decision = enforceGovernance(govResult.value);
            if (decision.blocked) {
                return new Response(JSON.stringify({
                    error: "GOVERNANCE_BLOCK",
                    message: decision.reason || "System requires recalibration.",
                }), { status: 503 });
            }
            governancePrompt = decision.additionalPrompt;
            temperatureOverride = decision.temperatureOverride;
        }

        // 4. Build Open System Prompt with minimal context injection
        const ragContext = 'context' in rag && rag.confidence > 0.4 ? rag.context : "";
        const systemPrompt = buildEliteSystemPrompt(ragContext, isDemo);

        // 4.5. Ensure model is warm (fire-and-forget on first request)
        warmupModel().catch(() => { });

        // 5. Build LLM messages
        const llmMessages = [
            { role: "system", content: systemPrompt },
            ...(body.messages || [{ role: "user", content: query }])
        ];

        // 6. Fire-and-forget: Save user message + promote to long-term memory
        saveAndPromote(query, sessionId).catch((e: any) => console.warn("[SAVE]", e.message));

        // 7. Call Ollama with selected model
        const modelStart = Date.now();
        const selectedModel = body.model || modelSelection.model;
        const modelConfig = modelSelection.config;

        // Apply governance temperature override
        const effectiveTemperature = temperatureOverride ?? modelConfig.temperature;

        if (isDemo) {
            // Non-streaming for demo agent — clean full response
            const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: llmMessages,
                    stream: false,
                    keep_alive: "5m",
                    options: {
                        num_ctx: modelConfig.contextWindow,
                        num_predict: modelConfig.maxTokens,
                        temperature: effectiveTemperature,
                        top_p: modelConfig.topP,
                        repeat_penalty: modelConfig.repeatPenalty,
                    }
                }),
                signal: AbortSignal.timeout(modelConfig.timeout),
            });

            const data = await ollamaRes.json();
            const content = data.message?.content || "";
            const modelLatency = Date.now() - modelStart;

            console.log(`[CHAT] Demo response: ${modelLatency}ms | ${content.length} chars | Model: ${selectedModel}`);

            const analyticsId = await logAnalytics(
                query, Date.now() - requestStart, modelLatency, rag, modelSelection
            );

            // Fire-and-forget: self-evaluation + save assistant message + update cognitive state
            runSelfEvaluation(query, content, analyticsId);
            saveAssistantMessage(content, sessionId).catch((e: any) => console.warn("[SAVE]", e.message));

            return new Response(JSON.stringify({ content }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Streaming for chat panel — direct passthrough
        const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: selectedModel,
                messages: llmMessages,
                stream: true,
                keep_alive: "5m",
                options: {
                    num_ctx: modelConfig.contextWindow,
                    num_predict: modelConfig.maxTokens,
                    temperature: effectiveTemperature,
                    top_p: modelConfig.topP,
                    repeat_penalty: modelConfig.repeatPenalty,
                }
            }),
            signal: AbortSignal.timeout(modelConfig.timeout),
        });

        if (!ollamaRes.ok || !ollamaRes.body) {
            throw new Error(`Ollama returned ${ollamaRes.status}: ${ollamaRes.statusText}`);
        }

        const modelLatency = Date.now() - modelStart;
        const totalLatency = Date.now() - requestStart;

        logAnalytics(query, totalLatency, modelLatency, rag, modelSelection);

        const ragLatency = 'latencyMs' in rag ? rag.latencyMs : 0;
        console.log(`[CHAT] Streaming started: RAG ${ragLatency}ms | Model TTFB ${modelLatency}ms | Total ${totalLatency}ms | Model: ${selectedModel} (${modelSelection.tier})`);

        // Direct passthrough of Ollama stream — production headers
        return new Response(ollamaRes.body, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "X-Content-Type-Options": "nosniff",
                "X-Accel-Buffering": "no", // Nginx: disable proxy buffering
            },
        });

    } catch (error: any) {
        logger.error(`[CHAT-ERROR] Pipeline Exception: ${error.message}`);
        // Do not leak stack traces to the public UI in Production
        return new Response(JSON.stringify({
            error: "INTERNAL_SERVER_ERROR",
            message: "The cognitive engine encountered a processing fault.",
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

/** Gets or creates a Session for the visitor ID */
async function getOrCreateSession(visitorId: string) {
    try {
        let session = await prisma.session.findUnique({ where: { visitorId } });
        if (!session) {
            session = await prisma.session.create({ data: { visitorId } });
        }
        return session;
    } catch {
        // Return a fallback object if DB is unreachable
        return { id: visitorId };
    }
}

/** Fire-and-forget: Save user message and attempt long-term promotion */
async function saveAndPromote(query: string, visitorId: string) {
    const session = await getOrCreateSession(visitorId);
    await prisma.message.create({
        data: {
            role: "user",
            content: query,
            sessionId: session.id,
        }
    });
    await promoteToLongTerm(query, session.id);
}

/** Fire-and-forget: Save assistant response */
async function saveAssistantMessage(content: string, visitorId: string) {
    const session = await getOrCreateSession(visitorId);
    await prisma.message.create({
        data: {
            role: "assistant",
            content: content.substring(0, 5000),
            sessionId: session.id,
        }
    });
}

/** Non-blocking analytics — now includes model orchestration metadata */
async function logAnalytics(
    query: string,
    totalLatency: number,
    modelLatency: number,
    rag: any,
    modelSelection: any
): Promise<string | undefined> {
    try {
        const record = await prisma.analyticsLog.create({
            data: {
                query: query.substring(0, 500),
                totalLatency,
                modelLatency,
                ragUsed: rag.sourceCount > 0,
                cacheHit: rag.cacheHit,
                ragConfidence: rag.confidence,
                model: modelSelection.model,
                modelTier: modelSelection.tier,
                intent: rag.intent,
                selfHealed: rag.selfHealed || false,
            }
        });
        return record.id;
    } catch (err: any) {
        console.warn("[ANALYTICS] Log failed:", err.message);
        return undefined;
    }
}

// buildSystemPrompt moved to lib/core/prompts.ts as buildEliteSystemPrompt
