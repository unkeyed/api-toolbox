import { DEFAULT_APP_NAME } from "~/consts.js";
import { type InstallerOptions } from "~/installers/index.js";
import { getUserPkgManager } from "~/utils/getUserPkgManager.js";

export const nextSteps = async ({
  projectName = DEFAULT_APP_NAME,
  packages,
  databaseProvider,
}: Pick<
  InstallerOptions,
  "projectName" | "packages" | "projectDir" | "databaseProvider"
>) => {
  const pkgManager = getUserPkgManager();

  console.info("Next steps:\n");
  projectName !== "." && console.info(`  cd ${projectName}/apps/api \n`);
  console.info(`  Update .dev.vars with \n`);

  // Show different environment variables based on database provider
  switch (databaseProvider) {
    case "postgres":
      console.info(`    DATABASE_URL="POSTGRES_URL/dbname"`);
      break;
    case "turso":
      console.info(`    TURSO_DATABASE_URL="YOUR_DATABASE_URL"`);
      console.info(`    TURSO_AUTH_TOKEN="YOUR_AUTH_TOKEN"`);
      break;
    case "sqlite":
      console.info(`    DATABASE_URL="file:./dev.db"`);
      break;
  }

  console.info(`    UNKEY_ROOT_KEY="YOUR_UNKEY_ROOT_KEY"`);
  console.info(`    UNKEY_API_ID="YOUR_UNKEY_API_ID" \n`);

  if (pkgManager === "yarn") {
    console.info(`  ${pkgManager}`);
  }

  if (packages?.prisma.inUse) {
    if (databaseProvider === "turso") {
      console.info(
        `  npx turso db shell YOUR_DATABASE_NAME < ./prisma/migrations/20240626173453_init/migration.sql`
      );
    } else if (databaseProvider === "postgres") {
      console.info(`  npm run db:push`);
    }
  }

  if (packages?.drizzle.inUse) {
    if (["npm", "bun"].includes(pkgManager)) {
      console.info(`  ${pkgManager} run db:push`);
    } else {
      console.info(`  ${pkgManager} db:push`);
    }
  }

  if (["npm", "bun"].includes(pkgManager)) {
    console.info(`  ${pkgManager} run dev`);
  } else {
    console.info(`  ${pkgManager} dev`);
  }
  console.info(`  cd ..`);
  console.info(`  git init`);
  console.info(`  git commit -m "initial commit"`);
};
