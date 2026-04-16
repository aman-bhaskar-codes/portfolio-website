import pino from "pino";

// Define an aesthetic, high-performance logger for the Elite Backend
export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                    messageFormat: "\x1B[35m[COGNITIVE-SYSTEM]\x1B[0m {msg}",
                },
            }
            : undefined,
});
