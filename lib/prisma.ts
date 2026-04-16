import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        datasourceUrl: process.env.DATABASE_URL
            ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=30`
            : undefined,
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

