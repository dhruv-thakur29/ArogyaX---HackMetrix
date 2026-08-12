// lib/db/prisma.ts
//
// Reusable Prisma Client instance for the ArogyaX Next.js app.
//
// Next.js hot-reloads server modules in development, which would
// normally create a new PrismaClient (and a new DB connection pool)
// on every file edit. We avoid that by caching the client on the
// Node.js `global` object in development, while always creating a
// fresh instance in production.

import { PrismaClient } from "./generated/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
