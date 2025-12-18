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
 * Discover files from a path or array of paths (files or directories)
 * Returns array of file objects with metadata
 */
export function discoverFiles(inputPaths) {
  // Normalize to array
  const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
  
  if (paths.length === 0) {
    throw new Error('No paths provided');
  }
  
  const allFiles = [];
  let projectName = null;
  
  // Process each path
  for (let i = 0; i < paths.length; i++) {
    const inputPath = paths[i];
    const stats = statSync(inputPath);
    const isFirstPath = i === 0;
    
    if (stats.isFile()) {
      // Single file
      const content = readFileSync(inputPath);
      const extension = getExtension(inputPath);
      const fileName = basename(inputPath, extname(inputPath));
      
      // First file becomes README, others keep their names
      let targetPath;
      let appPath;
      
      if (isFirstPath) {
        // First file is saved as README with original extension
        targetPath = extension === 'mdx' ? 'README.mdx' : 'README.md';
        appPath = ['md', 'mdx'].includes(extension) ? '/' : null;
        projectName = fileName;
      } else {
        // Subsequent files keep their original names
        targetPath = basename(inputPath);
        if (['md', 'mdx'].includes(extension)) {
          const urlPath = resolveFilePathToUrlPath(targetPath);
          appPath = urlPath === '/' ? '/' : urlPath.replace(/^\//, '');
        } else {
          appPath = null;
        }
      }
      
      allFiles.push({
        originalPath: inputPath,
        path: targetPath,
        content,
        size: stats.size,
        sha: calculateSha(content),
        extension,
        appPath,
      });
    } else if (stats.isDirectory()) {
      // Directory
      const dirName = basename(inputPath);
      const dirFiles = scanDirectory(inputPath);
      
      // If this is the first path, use directory name as project name
      if (isFirstPath && !projectName) {
        projectName = dirName;
      }
      
      for (const filePath of dirFiles) {
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
        
        allFiles.push({
          originalPath: filePath,
          path: relativePath,
          content,
          size: fileStats.size,
          sha: calculateSha(content),
          extension,
          appPath,
        });
      }
    } else {
      throw new Error(`Invalid path: ${inputPath} is neither a file nor a directory`);
    }
  }
  
  // Store project name in first file
  if (allFiles.length > 0 && projectName) {
    allFiles[0].projectName = projectName;
  }
  
  return allFiles;
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