import chalk from "chalk";
import { getSyncStatus } from "./db.js";

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a date for display
 */
export function formatDate(date) {
  return new Date(date).toLocaleString();
}

/**
 * Get site URL
 */
export function getSiteUrl(projectName) {
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "flowershow.app";
  return `https://${domain}/@anonymous/${projectName}`;
}

/**
 * Wait for all markdown files to be processed
 * Polls the database every second for up to maxWaitSeconds
 */
export async function waitForSync(siteId, maxWaitSeconds = 30) {
  const startTime = Date.now();
  const maxWaitMs = maxWaitSeconds * 1000;

  console.log(chalk.gray("Waiting for files to be processed..."));

  let lastStatus = null;

  while (Date.now() - startTime < maxWaitMs) {
    const blobs = await getSyncStatus(siteId);

    if (blobs.length === 0) {
      // No markdown files, consider it done
      return { success: true, blobs: [] };
    }

    const pending = blobs.filter((b) => b.syncStatus === "PENDING");
    const errors = blobs.filter((b) => b.syncStatus === "ERROR");
    const success = blobs.filter((b) => b.syncStatus === "SUCCESS");

    // Show progress if status changed
    const currentStatus = `${success.length}/${blobs.length}`;
    if (currentStatus !== lastStatus) {
      process.stdout.write(
        `\r${chalk.gray(`Processing: ${currentStatus} files complete`)}`
      );
      lastStatus = currentStatus;
    }

    // All done
    if (pending.length === 0) {
      process.stdout.write("\n");

      if (errors.length > 0) {
        console.log(chalk.yellow(`\n⚠️  ${errors.length} file(s) had errors:`));
        for (const blob of errors) {
          console.log(
            chalk.yellow(
              `  - ${blob.path}: ${blob.syncError || "Unknown error"}`
            )
          );
        }
        return { success: false, blobs, errors };
      }

      return { success: true, blobs };
    }

    await sleep(1000);
  }

  process.stdout.write("\n");

  // Timeout
  const blobs = await getSyncStatus(siteId);
  const pending = blobs.filter((b) => b.syncStatus === "PENDING");

  console.log(
    chalk.yellow(`\n⚠️  Timeout: ${pending.length} file(s) still processing`)
  );
  for (const blob of pending) {
    console.log(chalk.yellow(`  - ${blob.path}`));
  }

  return { success: false, blobs, timeout: true };
}

/**
 * Display success message with URL
 */
export function displaySuccess(projectName, fileCount) {
  const url = getSiteUrl(projectName);

  console.log(chalk.green("\n✓ Successfully published!"));
  console.log(chalk.gray(`  ${fileCount} file(s) uploaded`));
  console.log(chalk.cyan(`\n  Visit your site at: ${url}\n`));
}

/**
 * Display error message
 */
export function displayError(message) {
  console.error(chalk.red(`\n✗ Error: ${message}\n`));
}

/**
 * Display warning message
 */
export function displayWarning(message) {
  console.warn(chalk.yellow(`\n⚠️  Warning: ${message}\n`));
}

/**
 * Display info message
 */
export function displayInfo(message) {
  console.log(chalk.blue(`ℹ ${message}`));
}
