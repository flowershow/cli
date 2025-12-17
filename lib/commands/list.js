import chalk from 'chalk';
import { getAnonymousUser, listSites, disconnect } from '../db.js';
import { displayError, formatDate, getSiteUrl } from '../utils.js';

/**
 * List command - show all sites for the anonymous user
 */
export async function listCommand() {
  try {
    const user = await getAnonymousUser();
    const sites = await listSites(user.id);

    if (sites.length === 0) {
      console.log(chalk.gray('\nNo sites found.\n'));
      await disconnect();
      return;
    }

    console.log(chalk.bold(`\nFound ${sites.length} site(s):\n`));

    for (const site of sites) {
      const url = getSiteUrl(site.projectName);
      console.log(chalk.cyan(`  ${site.projectName}`));
      console.log(chalk.gray(`    URL: ${url}`));
      console.log(chalk.gray(`    Created: ${formatDate(site.createdAt)}`));
      console.log(chalk.gray(`    Updated: ${formatDate(site.updatedAt)}`));
      console.log();
    }

    await disconnect();
  } catch (error) {
    displayError(error.message);
    console.error(chalk.gray(error.stack));
    await disconnect();
    process.exit(1);
  }
}