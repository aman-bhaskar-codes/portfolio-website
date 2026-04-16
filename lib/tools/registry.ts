/**
 * Tool Registry — Controlled External Tool Definitions
 *
 * Each tool has: description, risk level, required approval,
 * file restrictions, and twin permission mapping.
 *
 * No tool can be invoked without going through this registry.
 */

// ────────────────────────────────────────────
// TOOL DEFINITIONS
// ────────────────────────────────────────────

export interface ToolDefinition {
    name: string;
    description: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    riskWeight: number;
    requiresApproval: boolean;
    allowedTwins: string[];
    maxLinesChanged: number;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
    edit_file: {
        name: "edit_file",
        description: "Modify existing file contents safely",
        riskLevel: "medium",
        riskWeight: 0.4,
        requiresApproval: true,
        allowedTwins: ["architecture", "research", "performance"],
        maxLinesChanged: 100,
    },
    create_file: {
        name: "create_file",
        description: "Create a new file",
        riskLevel: "low",
        riskWeight: 0.2,
        requiresApproval: false,
        allowedTwins: ["architecture", "research", "performance"],
        maxLinesChanged: 300,
    },
    run_tests: {
        name: "run_tests",
        description: "Execute test suite to validate changes",
        riskLevel: "low",
        riskWeight: 0.1,
        requiresApproval: false,
        allowedTwins: ["architecture", "research", "safety", "performance"],
        maxLinesChanged: 0,
    },
    run_shell: {
        name: "run_shell",
        description: "Execute a shell command in sandbox",
        riskLevel: "high",
        riskWeight: 0.7,
        requiresApproval: true,
        allowedTwins: ["architecture", "performance"],
        maxLinesChanged: 0,
    },
    git_commit: {
        name: "git_commit",
        description: "Create a git commit with staged changes",
        riskLevel: "medium",
        riskWeight: 0.5,
        requiresApproval: true,
        allowedTwins: ["architecture", "meta"],
        maxLinesChanged: 0,
    },
    update_config: {
        name: "update_config",
        description: "Update system configuration values",
        riskLevel: "medium",
        riskWeight: 0.4,
        requiresApproval: true,
        allowedTwins: ["architecture", "performance", "research"],
        maxLinesChanged: 30,
    },
    rollback_snapshot: {
        name: "rollback_snapshot",
        description: "Restore a previous system snapshot",
        riskLevel: "high",
        riskWeight: 0.6,
        requiresApproval: true,
        allowedTwins: ["safety", "meta"],
        maxLinesChanged: 0,
    },
};

// ────────────────────────────────────────────
// FORBIDDEN TARGETS
// ────────────────────────────────────────────

export const FORBIDDEN_PATHS = [
    "prisma/schema.prisma",      // identity core
    "lib/twin/identity",          // identity module
    "lib/twin/reward-model.ts",   // reward formula
    ".env",                       // secrets
    "package.json",               // dependencies
    "next.config",                // framework config
];

export const FORBIDDEN_COMMANDS = [
    "rm -rf",
    "DROP TABLE",
    "DELETE FROM",
    "sudo",
    "chmod 777",
    "eval(",
    "process.exit",
];

// ────────────────────────────────────────────
// FILE SENSITIVITY
// ────────────────────────────────────────────

export function getFileSensitivity(path: string): number {
    if (FORBIDDEN_PATHS.some((fp) => path.includes(fp))) return 1.0;
    if (path.includes("lib/twin/")) return 0.7;
    if (path.includes("lib/queue/")) return 0.6;
    if (path.includes("lib/services/")) return 0.5;
    if (path.includes("app/api/")) return 0.4;
    if (path.includes("components/")) return 0.2;
    return 0.3;
}
