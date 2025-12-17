import pkg from '@prisma/client';

const { PrismaClient } = pkg;

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from CLI directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

/**
 * Get or create the anonymous user for CLI uploads
 */
export async function getAnonymousUser() {
  const anonymousUserId = process.env.ANONYMOUS_USER_ID;

  if (!anonymousUserId) {
    throw new Error('ANONYMOUS_USER_ID not set in .env file');
  }

  let user = await prisma.user.findUnique({
    where: { id: anonymousUserId },
  });

  if (!user) {
    // Create the anonymous user if it doesn't exist
    user = await prisma.user.create({
      data: {
        id: anonymousUserId,
        name: 'Anonymous CLI User',
        username: 'anonymous',
        ghUsername: 'anonymous',
        email: 'cli@flowershow.app',
        role: 'USER',
      },
    });
  }

  return user;
}

/**
 * Check if a site with the given project name exists for the anonymous user
 */
export async function siteExists(userId, projectName) {
  const site = await prisma.site.findFirst({
    where: {
      userId,
      projectName,
    },
  });
  return site !== null;
}

/**
 * Create a new site for CLI upload
 */
export async function createSite(userId, projectName) {
  return await prisma.site.create({
    data: {
      projectName,
      ghRepository: 'cli-upload',
      ghBranch: 'main',
      rootDir: null,
      autoSync: false,
      webhookId: null,
      userId,
    },
  });
}

/**
 * Create a blob record for an uploaded file
 */
export async function createBlob(
  siteId,
  filePath,
  fileSize,
  fileSha,
  extension,
  appPath,
) {
  const syncStatus = ['md', 'mdx'].includes(extension) ? 'PENDING' : 'SUCCESS';

  return await prisma.blob.create({
    data: {
      siteId,
      path: filePath,
      appPath,
      size: fileSize,
      sha: fileSha,
      metadata: null,
      extension,
      syncStatus,
      syncError: null,
    },
  });
}

/**
 * Get all sites for the anonymous user
 */
export async function listSites(userId) {
  return await prisma.site.findMany({
    where: { userId },
    select: {
      id: true,
      projectName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a site and all its blobs
 */
export async function deleteSite(userId, projectName) {
  const site = await prisma.site.findFirst({
    where: {
      userId,
      projectName,
    },
  });

  if (!site) {
    return null;
  }

  // Delete all blobs first (cascade should handle this, but being explicit)
  await prisma.blob.deleteMany({
    where: { siteId: site.id },
  });

  // Delete the site
  await prisma.site.delete({
    where: { id: site.id },
  });

  return site;
}

/**
 * Get sync status for all markdown blobs in a site
 */
export async function getSyncStatus(siteId) {
  const blobs = await prisma.blob.findMany({
    where: {
      siteId,
      extension: { in: ['md', 'mdx'] },
    },
    select: {
      id: true,
      path: true,
      syncStatus: true,
      syncError: true,
    },
  });

  return blobs;
}

/**
 * Close the Prisma connection
 */
export async function disconnect() {
  await prisma.$disconnect();
}

export default prisma;
