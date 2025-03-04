import path from "path";
import fs from "fs-extra";
import { type PackageJson } from "type-fest";

import { PKG_ROOT } from "~/consts.js";
import { type Installer } from "~/installers/index.js";
import { addPackageDependency } from "~/utils/addPackageDependency.js";
import { getUserPkgManager } from "~/utils/getUserPkgManager.js";

export const prismaInstaller: Installer = ({
  projectDir,
  databaseProvider,
}) => {
  addPackageDependency({
    projectDir,
    dependencies: ["prisma"],
    devMode: true,
  });
  addPackageDependency({
    projectDir,
    dependencies: ["@prisma/client"],
    devMode: false,
  });
  addPackageDependency({
    projectDir,
    devMode: true,
    dependencies: ["dotenv-cli"],
  });
  addPackageDependency({
    projectDir,
    devMode: false,
    dependencies: ["@libsql/client"],
  });
  addPackageDependency({
    projectDir,
    devMode: false,
    dependencies: ["@prisma/adapter-libsql"],
  });

  const pkgManager = getUserPkgManager();
  let turboManager = "";

  if (pkgManager == "npm") {
    turboManager = "npm@10.7.0";
  } else if (pkgManager == "yarn") {
    turboManager = "yarn@3.0.2";
  } else if (pkgManager == "pnpm") {
    turboManager = "pnpm@6.14.0";
  }

  const data = fs.readFileSync(path.join(projectDir, "package.json"));
  const modifiedData = data.toString().slice(0, -2);

  fs.writeFileSync(path.join(projectDir, "package.json"), modifiedData);
  fs.appendFileSync(
    path.join(projectDir, "package.json"),
    `,\n "packageManager":  "${turboManager}" \n }`
  );

  const extrasDir = path.join(PKG_ROOT, "templates/extras");

  const schemaSrc = path.join(
    extrasDir,
    "prisma/schema",
    `${"base"}${
      databaseProvider === "turso"
        ? "-turso"
        : databaseProvider === "postgres"
          ? "-postgres"
          : ""
    }.prisma`
  );

  let schemaText = fs.readFileSync(schemaSrc, "utf-8");
  if (databaseProvider !== "sqlite") {
    schemaText = schemaText.replace(
      'provider = "sqlite"',
      `provider = "${
        {
          turso: "sqlite",
          postgres: "postgresql",
        }[databaseProvider] ?? "sqlite"
      }"`
    );
  }
  const schemaDest = path.join(projectDir, "apps/api/prisma/schema.prisma");
  fs.mkdirSync(path.dirname(schemaDest), { recursive: true });
  fs.writeFileSync(schemaDest, schemaText);

  const clientSrc =
    databaseProvider === "postgres"
      ? path.join(extrasDir, "prisma/hono/posts-postgres.ts")
      : path.join(extrasDir, "prisma/hono/posts.ts");
  const destination = path.join(projectDir, "apps/api/src/routes/posts.ts");
  fs.copyFileSync(clientSrc, destination);
  // add postinstall and push script to package.json
  const packageJsonPath = path.join(projectDir, "apps/api/package.json");

  const databaseSrc =
    databaseProvider === "postgres"
      ? path.join(extrasDir, "prisma/database-postgres.ts")
      : path.join(extrasDir, "prisma/database.ts");
  const databaseDest = path.join(projectDir, "apps/api/src/database.ts");
  fs.copyFileSync(databaseSrc, databaseDest);
  const packageJsonContent = fs.readJSONSync(packageJsonPath) as PackageJson;
  packageJsonContent.scripts = {
    ...packageJsonContent.scripts,
    postinstall: "prisma generate",
    env: "dotenv -e .dev.vars",
    "db:push": "npm run env -- prisma db push",
    "db:studio": "npm run env -- prisma studio",
    "db:generate": "npm run env -- prisma migrate dev",
    "db:migrate": "npm run env -- prisma migrate deploy",
  };

  fs.writeJSONSync(packageJsonPath, packageJsonContent, {
    spaces: 2,
  });

  if (databaseProvider !== "postgres") {
    const migrations = path.join(projectDir, "apps/api/prisma/migrations");
    fs.mkdirSync(migrations, { recursive: true });
    const migrationSrc = path.join(extrasDir, "prisma/migrations");
    fs.copySync(migrationSrc, migrations);
  }
  const envPath = path.join(projectDir, "apps/api/.dev.vars");
  switch (databaseProvider) {
    case "turso":
      fs.appendFileSync(
        envPath,
        `TURSO_DATABASE_URL="YOUR_DATABASE_URL_HERE"\n`
      );
      fs.appendFileSync(envPath, `TURSO_AUTH_TOKEN="YOUR_AUTH_TOKEN"\n`);
      break;
    case "postgres":
      fs.appendFileSync(
        envPath,
        `DATABASE_URL="postgresql://user:password@localhost:5432/dbname"\n`
      );
      break;
    default:
      fs.appendFileSync(envPath, `DATABASE_URL="file:./dev.db"`);
  }
};
