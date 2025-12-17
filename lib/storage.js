import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

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
 * Get content type based on file extension
 */
function getContentType(extension) {
  const contentTypes = {
    md: 'text/markdown',
    mdx: 'text/markdown',
    csv: 'text/csv',
    geojson: 'application/geo+json',
    json: 'application/json',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    base: 'application/yaml',
    css: 'text/css',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    webp: 'image/webp',
    avif: 'image/avif',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    aac: 'audio/aac',
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
  };

  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Upload a file to R2 storage
 * @param {string} siteId - The site ID
 * @param {string} filePath - Relative path within the site
 * @param {Buffer} content - File content as Buffer
 * @param {string} extension - File extension
 */
export async function uploadFile(siteId, filePath, content, extension) {
  const key = `${siteId}/main/raw/${filePath}`;
  const contentType = getContentType(extension);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
        CacheControl: 'no-cache',
      })
    );
    return true;
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Upload multiple files to R2 storage
 * @param {string} siteId - The site ID
 * @param {Array} files - Array of {path, content, extension}
 */
export async function uploadFiles(siteId, files) {
  const results = [];
  
  for (const file of files) {
    try {
      await uploadFile(siteId, file.path, file.content, file.extension);
      results.push({ path: file.path, success: true });
    } catch (error) {
      results.push({ path: file.path, success: false, error: error.message });
    }
  }
  
  return results;
}