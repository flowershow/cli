#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { publishCommand } from './lib/commands/publish.js';
import { listCommand } from './lib/commands/list.js';
import { deleteCommand } from './lib/commands/delete.js';

const program = new Command();

program
  .name('flowershow-cli')
  .description('CLI tool for publishing to FlowerShow')
  .version('0.1.0');

program
  .command('publish <path>')
  .description('Publish a file or folder to FlowerShow')
  .action(async (path) => {
    console.log(chalk.bold('\n🌸 FlowerShow CLI - Publish\n'));
    await publishCommand(path);
  });

program
  .command('list')
  .description('List all published sites')
  .action(async () => {
    console.log(chalk.bold('\n🌸 FlowerShow CLI - List Sites\n'));
    await listCommand();
  });

program
  .command('delete <project-name>')
  .description('Delete a published site')
  .action(async (projectName) => {
    console.log(chalk.bold('\n🌸 FlowerShow CLI - Delete Site\n'));
    await deleteCommand(projectName);
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();