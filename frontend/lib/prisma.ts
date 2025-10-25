// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Use a single Prisma client instance in development to avoid
 * creating too many connections on hot reload.
 */
export const prisma =
  global.prisma ??
  new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // enable if you want verbose logs
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
