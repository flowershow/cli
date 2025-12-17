import { readFileSync, statSync, readdirSync } from 'fs';
import { join, basename, extname, relative, sep } from 'path';
import { createHash } from 'crypto';

// Patterns to ignore when scanning directories
const IGNORE_PATTERNS = [
  /^\.git\//,
  /^node_modules\//,
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^\.env/,
  /\.log$/,
  /^\.cache\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^\.vercel\//,
  /^\.turbo\//,
  /^coverage\//,
  /^\.nyc_output\//,
];

/**
 * Check if a file path should be included
 */
function shouldIncludeFile(filePath) {
  // Normalize path separators for consistent matching
  const normalizedPath = filePath.split(sep).join('/');
  return !IGNORE_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Calculate SHA hash of file content
 */
function calculateSha(content) {
  return createHash('sha1').update(content).digest('hex');
}

/**
 * Get file extension without the dot
 */
function getExtension(filePath) {
  const ext = extname(filePath);
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Resolve file path to URL path (for markdown files)
 * Based on lib/resolve-link.ts logic
 */
function resolveFilePathToUrlPath(filePath) {
  // Remove extension
  let urlPath = filePath.replace(/\.(md|mdx)$/i, '');
  
  // Handle README -> root
  if (urlPath === 'README' || urlPath === 'readme') {
    return '/';
  }
  
  // Handle index files -> parent directory
  if (urlPath.endsWith('/index') || urlPath.endsWith('/INDEX')) {
    urlPath = urlPath.replace(/\/index$/i, '');
    return urlPath || '/';
  }
  
  // Return the path (will be prefixed with / in the URL)
  return urlPath || '/';
}

/**
 * Recursively scan a directory and return all files
 */
function scanDirectory(dirPath, baseDir = dirPath) {
  const files = [];
  
  function scan(currentPath) {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      const relativePath = relative(baseDir, fullPath);
      
      if (!shouldIncludeFile(relativePath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dirPath);
  return files;
}

/**
 * Discover files from a path (file or directory)
 * Returns array of file objects with metadata
 */
export function discoverFiles(inputPath) {
  const stats = statSync(inputPath);
  const files = [];
  
  if (stats.isFile()) {
    // Single file
    const content = readFileSync(inputPath);
    const extension = getExtension(inputPath);
    const fileName = basename(inputPath, extname(inputPath));
    
    // For single files, save as README with original extension
    const targetPath = extension === 'mdx' ? 'README.mdx' : 'README.md';
    const appPath = ['md', 'mdx'].includes(extension) ? '/' : null;
    
    files.push({
      originalPath: inputPath,
      path: targetPath,
      content,
      size: stats.size,
      sha: calculateSha(content),
      extension,
      appPath,
      projectName: fileName,
    });
  } else if (stats.isDirectory()) {
    // Directory
    const dirName = basename(inputPath);
    const allFiles = scanDirectory(inputPath);
    
    for (const filePath of allFiles) {
      const content = readFileSync(filePath);
      const extension = getExtension(filePath);
      const relativePath = relative(inputPath, filePath);
      const fileStats = statSync(filePath);
      
      // Calculate URL path for markdown files
      let appPath = null;
      if (['md', 'mdx'].includes(extension)) {
        const urlPath = resolveFilePathToUrlPath(relativePath);
        // Remove leading slash for storage (except root)
        appPath = urlPath === '/' ? '/' : urlPath.replace(/^\//, '');
      }
      
      files.push({
        originalPath: filePath,
        path: relativePath,
        content,
        size: fileStats.size,
        sha: calculateSha(content),
        extension,
        appPath,
      });
    }
    
    // Add project name from directory
    if (files.length > 0) {
      files[0].projectName = dirName;
    }
  } else {
    throw new Error(`Invalid path: ${inputPath} is neither a file nor a directory`);
  }
  
  return files;
}

/**
 * Get project name from discovered files
 */
export function getProjectName(files) {
  if (files.length === 0) {
    throw new Error('No files discovered');
  }
  return files[0].projectName;
}

/**
 * Validate that files were discovered
 */
export function validateFiles(files) {
  if (files.length === 0) {
    throw new Error('No files found to publish');
  }
  
  const hasMarkdown = files.some(f => ['md', 'mdx'].includes(f.extension));
  if (!hasMarkdown) {
    console.warn('Warning: No markdown files found. The site will be empty.');
  }
  
  return true;
}