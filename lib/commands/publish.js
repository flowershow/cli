import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import {
  getAnonymousUser,
  siteExists,
  createSite,
  createBlob,
  disconnect,
} from '../db.js';
import { uploadFiles } from '../storage.js';
import { discoverFiles, getProjectName, validateFiles } from '../files.js';
import {
  displaySuccess,
  displayError,
  displayWarning,
  waitForSync,
} from '../utils.js';

/**
 * Publish command - upload files to FlowerShow
 */
export async function publishCommand(inputPath) {
  try {
    // Validate input path
    const absolutePath = resolve(inputPath);
    if (!existsSync(absolutePath)) {
      displayError(`Path not found: ${inputPath}`);
      process.exit(1);
    }

    console.log(chalk.gray('Discovering files...'));
    
    // Discover files
    const files = discoverFiles(absolutePath);
    validateFiles(files);
    
    const projectName = getProjectName(files);
    console.log(chalk.gray(`Project name: ${projectName}`));
    console.log(chalk.gray(`Found ${files.length} file(s)`));

    // Get anonymous user
    const user = await getAnonymousUser();

    // Check if site already exists
    if (await siteExists(user.id, projectName)) {
      displayError(
        `A site named '${projectName}' already exists.\n` +
        `Please choose a different name or delete the existing site first.\n` +
        `Use 'node cli.js list' to see all sites.`
      );
      await disconnect();
      process.exit(1);
    }

    console.log(chalk.gray('Creating site...'));
    
    // Create site
    const site = await createSite(user.id, projectName);
    console.log(chalk.gray(`Site ID: ${site.id}`));

    console.log(chalk.gray('Uploading files to storage...'));
    
    // Upload files to R2
    const uploadResults = await uploadFiles(site.id, files);
    
    const failedUploads = uploadResults.filter(r => !r.success);
    if (failedUploads.length > 0) {
      displayWarning(`${failedUploads.length} file(s) failed to upload:`);
      for (const result of failedUploads) {
        console.log(chalk.yellow(`  - ${result.path}: ${result.error}`));
      }
    }

    console.log(chalk.gray('Creating database records...'));
    
    // Create blob records
    const blobPromises = files.map(file =>
      createBlob(
        site.id,
        file.path,
        file.size,
        file.sha,
        file.extension,
        file.appPath
      )
    );
    
    await Promise.all(blobPromises);

    // Wait for markdown files to be processed
    const syncResult = await waitForSync(site.id, 30);

    if (syncResult.timeout) {
      displayWarning(
        'Some files are still processing after 30 seconds.\n' +
        'Your site is available but some pages may not be ready yet.\n' +
        'Check back in a moment.'
      );
    } else if (!syncResult.success && syncResult.errors) {
      displayWarning('Some files had processing errors (see above).');
    }

    // Display success
    displaySuccess(projectName, files.length);

    await disconnect();
  } catch (error) {
    displayError(error.message);
    console.error(chalk.gray(error.stack));
    await disconnect();
    process.exit(1);
  }
}