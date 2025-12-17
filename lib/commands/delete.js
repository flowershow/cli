import chalk from 'chalk';
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAnonymousUser, deleteSite, disconnect } from '../db.js';
import { displayError, displayInfo } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Delete all files in R2 for a site
 */
async function deleteR2Files(siteId) {
  const prefix = `${siteId}/`;
  
  try {
    // List all objects with the site prefix
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return;
    }

    // Delete all objects
    const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }));
    
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: objectsToDelete,
          Quiet: false,
        },
      })
    );

    console.log(chalk.gray(`  Deleted ${objectsToDelete.length} file(s) from storage`));
  } catch (error) {
    console.error(chalk.yellow(`  Warning: Failed to delete some files from storage: ${error.message}`));
  }
}

/**
 * Delete command - remove a site and all its files
 */
export async function deleteCommand(projectName) {
  try {
    if (!projectName) {
      displayError('Project name is required.\nUsage: node cli.js delete <project-name>');
      process.exit(1);
    }

    const user = await getAnonymousUser();

    console.log(chalk.gray(`Deleting site '${projectName}'...`));

    // Delete from database (this will cascade to blobs)
    const deletedSite = await deleteSite(user.id, projectName);

    if (!deletedSite) {
      displayError(`Site '${projectName}' not found.\nUse 'node cli.js list' to see all sites.`);
      await disconnect();
      process.exit(1);
    }

    // Delete files from R2
    await deleteR2Files(deletedSite.id);

    console.log(chalk.green(`\n✓ Successfully deleted site '${projectName}'\n`));

    await disconnect();
  } catch (error) {
    displayError(error.message);
    console.error(chalk.gray(error.stack));
    await disconnect();
    process.exit(1);
  }
}