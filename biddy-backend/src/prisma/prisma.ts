import { PrismaClient } from "@prisma/client";

// Reuse a single client across tsx watch-mode reloads in dev so we don't
// exhaust Postgres connections; a fresh client is created once in prod.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
