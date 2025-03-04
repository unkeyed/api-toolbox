import chalk from "chalk";
import ora from "ora";

import {
  type InstallerOptions,
  type PkgInstallerMap,
} from "~/installers/index.js";

type InstallPackagesOptions = InstallerOptions & {
  packages: PkgInstallerMap;
};

export const installPackages = (options: InstallPackagesOptions) => {
  const { packages } = options;
  console.info("Adding API...");

  for (const [name, pkgOpts] of Object.entries(packages)) {
    if (pkgOpts.inUse) {
      const spinner = ora(`API for ${name}...`).start();
      pkgOpts.installer(options);
      if (name === "docs") {
        spinner.succeed(
          chalk.green("Successfully created documentation for your API")
        );
      } else {
        spinner.succeed(
          chalk.green(
            `Successfully setup API code for ${chalk.green.bold(name)}`
          )
        );
      }
    }
  }

  console.info("");
};
