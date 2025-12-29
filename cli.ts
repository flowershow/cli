#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { publishCommand } from "./lib/commands/publish.js";
import { syncCommand } from "./lib/commands/sync.js";
import { listCommand } from "./lib/commands/list.js";
import { deleteCommand } from "./lib/commands/delete.js";
import { authLoginCommand } from "./lib/commands/auth-login.js";
import { authLogoutCommand } from "./lib/commands/auth-logout.js";
import { authStatusCommand } from "./lib/commands/auth-status.js";

const program = new Command();

program
  .name("flowershow")
  .description("CLI tool for publishing to FlowerShow")
  .version("0.1.0");

// Auth commands
const auth = program
  .command("auth")
  .description("Manage authentication")
  .action(() => {
    auth.help();
  });

auth
  .command("login")
  .description("Authenticate with FlowerShow via browser")
  .action(async () => {
    console.log(chalk.bold("\n💐 FlowerShow CLI - Authentication\n"));
    await authLoginCommand();
  });

auth
  .command("logout")
  .description("Remove stored authentication token")
  .action(async () => {
    console.log(chalk.bold("\n💐 FlowerShow CLI - Logout\n"));
    await authLogoutCommand();
  });

auth
  .command("status")
  .description("Check authentication status")
  .action(async () => {
    console.log(chalk.bold("\n💐 FlowerShow CLI - Auth Status\n"));
    await authStatusCommand();
  });

// Site management commands
program
  .command("publish <path> [morePaths...]")
  .description("Publish file(s) or folder to FlowerShow")
  .option("--overwrite", "Overwrite existing site if it already exists")
  .option("--name <siteName>", "Custom name for the site")
  .action(
    async (
      path: string,
      morePaths: string[],
      options: { overwrite?: boolean; name?: string }
    ) => {
      console.log(chalk.bold("\n💐 FlowerShow CLI - Publish\n"));
      const paths = [path, ...morePaths];
      await publishCommand(paths, options.overwrite || false, options.name);
    }
  );

program
  .command("sync <path>")
  .description("Sync changes to an existing published site")
  .option(
    "--name <siteName>",
    "Specify site name if different from folder name"
  )
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--verbose", "Show detailed list of all files in each category")
  .action(
    async (
      path: string,
      options: {
        name?: string;
        dryRun?: boolean;
        force?: boolean;
        verbose?: boolean;
      }
    ) => {
      console.log(chalk.bold("\n💐 FlowerShow CLI - Sync\n"));
      await syncCommand(path, options);
    }
  );

program
  .command("list")
  .description("List all published sites")
  .action(async () => {
    console.log(chalk.bold("\n💐 FlowerShow CLI - List Sites\n"));
    await listCommand();
  });

program
  .command("delete <project-name>")
  .description("Delete a published site")
  .action(async (projectName: string) => {
    console.log(chalk.bold("\n💐 FlowerShow CLI - Delete Site\n"));
    await deleteCommand(projectName);
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
