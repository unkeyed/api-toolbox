/*
 * This maps the necessary packages to a version.
 * This improves performance significantly over fetching it from the npm registry.
 */
export const dependencyVersionMap = {
  // Prisma
  prisma: "^6.4.1",
  "@prisma/client": "^6.4.1",
  "@prisma/adapter-libsql": "^6.4.1",
  // Drizzle
  "drizzle-orm": "^0.40.0",
  "drizzle-kit": "^0.30.5",
  "eslint-plugin-drizzle": "^0.2.3",
  // These are dependencies that are shared between Prisma and Drizzle
  "dotenv-cli": "^7.4.2",
  "@libsql/client": "^0.14.0",
  // PostgreSQL dependencies
  pg: "^8.11.3",
  "@types/pg": "^8.10.9",
} as const;
export type AvailableDependencies = keyof typeof dependencyVersionMap;
