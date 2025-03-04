import { PrismaClient } from "@prisma/client";

export function connectDatabase(c: { env: { DATABASE_URL: string } }) {
  const prisma = new PrismaClient();
  return prisma;
}
