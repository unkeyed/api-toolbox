import * as p from "@clack/prompts";
import { Command } from "commander";

import { API_TOOLBOX, DEFAULT_APP_NAME } from "~/consts.js";
import {
  type AvailablePackages,
  type DatabaseProvider,
} from "~/installers/index.js";
import { getUserPkgManager } from "~/utils/getUserPkgManager.js";
import { validateAppName } from "~/utils/validateAppName.js";

interface CliFlags {
  noInstall: boolean;
  default: boolean;
  prisma: boolean;
  drizzle: boolean;
  dbProvider: DatabaseProvider;
}

interface CliResults {
  appName: string;
  packages: AvailablePackages[];
  flags: CliFlags;
  databaseProvider: DatabaseProvider;
}

const defaultOptions: CliResults = {
  appName: DEFAULT_APP_NAME,
  packages: ["prisma"],
  flags: {
    noInstall: false,
    default: false,
    prisma: false,
    drizzle: false,
    dbProvider: "sqlite",
  },
  databaseProvider: "sqlite",
};

export const runCli = async (): Promise<CliResults> => {
  const cliResults = defaultOptions;

  const program = new Command()
    .name(API_TOOLBOX)
    .description("A CLI for creating low latency, high performance APIs")
    .argument(
      "[dir]",
      "The name of the application, as well as the name of the directory to create"
    )
    .option(
      "--noInstall",
      "Explicitly tell the CLI to not run the package manager's install command",
      false
    )
    .parse(process.argv);
  const cliProvidedName = program.args[0];
  if (cliProvidedName) {
    cliResults.appName = cliProvidedName;
  }

  cliResults.flags = program.opts();
  if (cliResults.flags.default) {
    return cliResults;
  }

  try {
    const pkgManager = getUserPkgManager();

    const project = await p.group(
      {
        name: () =>
          p.text({
            message: "What will your API be called?",
            defaultValue: DEFAULT_APP_NAME,
            validate: validateAppName,
          }),
        database: () => {
          return p.select({
            message: "What database ORM would you like to use?",
            options: [
              { value: "prisma", label: "Prisma" },
              { value: "drizzle", label: "Drizzle" },
            ],
            initialValue: "prisma",
          });
        },
        databaseProvider: ({ results }) => {
          if (results.database === "none") return;
          return p.select({
            message: "What database provider would you like to use?",
            options: [
              { value: "sqlite", label: "SQLite" },
              { value: "turso", label: "Turso" },
              { value: "postgres", label: "PostgreSQL" },
            ],
            initialValue: "sqlite",
          });
        },
      },
      {
        onCancel() {
          process.exit(1);
        },
      }
    );

    const packages: AvailablePackages[] = [];
    if (project.database === "prisma") packages.push("prisma");
    if (project.database === "drizzle") packages.push("drizzle");

    return {
      appName: project.name ?? cliResults.appName,
      packages,
      databaseProvider:
        (project.databaseProvider as DatabaseProvider) || "sqlite",
      flags: {
        ...cliResults.flags,
        noInstall: cliResults.flags.noInstall,
      },
    };
  } catch (e) {
    console.log(e);
  }
  return cliResults;
};
