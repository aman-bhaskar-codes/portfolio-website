
import { NextResponse } from "next/server";

type Handler = (req: Request, ...args: any[]) => Promise<Response>;

/**
 * Wraps an API route handler with global error handling and logging.
 */
export function withErrorHandler(handler: Handler): Handler {
    return async (req: Request, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (error: any) {
            console.error("[API_FATAL_ERROR]", error);

            // Return a clean JSON error response
            return new NextResponse(
                JSON.stringify({
                    error: "INTERNAL_SERVER_ERROR",
                    message: "An unexpected error occurred. Our systems have been notified.",
                    details: process.env.NODE_ENV === "development" ? error.message : undefined,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    };
}
