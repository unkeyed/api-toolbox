import { prismaInstaller } from "~/installers/prisma.js";
import { type PackageManager } from "~/utils/getUserPkgManager.js";
import { drizzleInstaller } from "./drizzle.js";
import { fumaInstaller } from "./fumadocs.js";

export const availablePackages = ["prisma", "drizzle", "docs"] as const;
export type AvailablePackages = (typeof availablePackages)[number];

export const databaseProviders = ["sqlite", "turso", "postgres"] as const;
export type DatabaseProvider = (typeof databaseProviders)[number];

export interface InstallerOptions {
  projectDir: string;
  pkgManager: PackageManager;
  packages?: PkgInstallerMap;
  projectName: string;
  scopedAppName: string;
  databaseProvider: DatabaseProvider;
}

export type Installer = (opts: InstallerOptions) => void;

export type PkgInstallerMap = {
  [pkg in AvailablePackages]: {
    inUse: boolean;
    installer: Installer;
  };
};

export const buildPkgInstallerMap = (
  packages: AvailablePackages[]
): PkgInstallerMap => ({
  prisma: {
    inUse: packages.includes("prisma"),
    installer: prismaInstaller,
  },
  drizzle: {
    inUse: packages.includes("drizzle"),
    installer: drizzleInstaller,
  },
  docs: {
    inUse: true,
    installer: fumaInstaller,
  },
});
