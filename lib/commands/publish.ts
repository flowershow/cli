import { existsSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import ora from "ora";
import cliProgress from "cli-progress";
import { isAuthenticated, getUserInfo, getToken } from "../auth.js";
import {
  createSite,
  getUploadUrls,
  uploadToR2,
  getSiteByName,
} from "../api-client.js";
import { discoverFiles, getProjectName, validateFiles } from "../files.js";
import {
  displayPublishSuccess,
  displayError,
  displayWarning,
  waitForSync,
} from "../utils.js";
import { API_URL } from "../const.js";

interface UploadResult {
  path: string;
  success: boolean;
  error?: string;
}

/**
 * Get content type based on file extension
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    md: "text/markdown",
    mdx: "text/markdown",
    csv: "text/csv",
    geojson: "application/geo+json",
    json: "application/json",
    yaml: "application/yaml",
    yml: "application/yaml",
    base: "application/yaml",
    css: "text/css",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    webp: "image/webp",
    avif: "image/avif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    aac: "audio/aac",
    mp3: "audio/mpeg",
    opus: "audio/opus",
  };

  return contentTypes[extension] || "application/octet-stream";
}

/**
 * Check if user is authenticated, exit if not
 */
function requireAuth(): void {
  if (!isAuthenticated()) {
    displayError(
      "You must be authenticated to use this command.\n" +
        "Run `flowershow auth login` to authenticate."
    );
    process.exit(1);
  }
}

/**
 * Get authenticated user info
 */
async function getAuthenticatedUser() {
  const tokenData = getToken();
  if (!tokenData) {
    throw new Error("Not authenticated");
  }

  const userInfo = await getUserInfo(API_URL, tokenData.token);
  return userInfo;
}

/**
 * Publish command - upload files to FlowerShow
 * @param inputPaths - Path(s) to the file(s) or folder to publish
 * @param overwrite - Whether to overwrite existing site
 * @param siteName - Optional custom name for the site
 */
export async function publishCommand(
  inputPaths: string | string[],
  overwrite: boolean = false,
  siteName?: string
): Promise<void> {
  try {
    // Check authentication first
    requireAuth();

    const spinner = ora();

    // Get authenticated user
    spinner.start("Authenticating...");
    const user = await getAuthenticatedUser();
    spinner.succeed(`Publishing as: ${user.username || user.email}`);

    spinner.start("Discovering files...");
    // Normalize to array
    const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];

    // Validate input paths
    const absolutePaths: string[] = [];
    for (const inputPath of paths) {
      const absolutePath = resolve(inputPath);
      if (!existsSync(absolutePath)) {
        displayError(`Path not found: ${inputPath}`);
        process.exit(1);
      }
      absolutePaths.push(absolutePath);
    }

    // Discover files from all paths
    const files = discoverFiles(absolutePaths);
    validateFiles(files);

    // Use custom site name if provided, otherwise derive from project
    const projectName = siteName || getProjectName(files);
    spinner.succeed(`Found ${files.length} file(s) to publish.`);

    const existingSite = await getSiteByName(projectName);

    // Check if site already exists (if not overwriting)
    if (existingSite && !overwrite) {
      displayError(
        `A site named '${projectName}' already exists.\n` +
          `Please choose a different name or delete the existing site first.\n` +
          `Use 'flowershow list' to see all sites.\n\n` +
          `💡 Tip: Use the --overwrite flag to publish over an existing site.`
      );
      process.exit(1);
    }

    spinner.start("Creating site...");

    // Create site via API (with overwrite flag)
    const siteData = await createSite(projectName, overwrite);
    const site = siteData.site;
    spinner.succeed(`Site created (ID: ${site.id})`);

    // Create upload progress bar
    const uploadBar = new cliProgress.SingleBar(
      {
        format:
          "Uploading |" +
          chalk.cyan("{bar}") +
          "| {percentage}% | {value}/{total} files",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );

    uploadBar.start(files.length, 0);

    // Prepare file metadata for presigned URL request
    const fileMetadata = files.map((file) => ({
      path: file.path,
      size: file.size,
      sha: file.sha,
    }));

    // Get presigned URLs from API
    const uploadData = await getUploadUrls(site.id, fileMetadata);

    // Upload files directly to R2 using presigned URLs
    const uploadResults: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const uploadInfo = uploadData.uploadUrls.find(
        (u) => u.path === file.path
      );

      if (!uploadInfo) {
        uploadResults.push({
          path: file.path,
          success: false,
          error: "No upload URL received",
        });
        uploadBar.increment();
        continue;
      }

      try {
        const contentType = getContentType(file.extension);
        await uploadToR2(uploadInfo.uploadUrl, file.content, contentType);
        uploadResults.push({ path: file.path, success: true });
        uploadBar.increment();
      } catch (error) {
        uploadResults.push({
          path: file.path,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        uploadBar.increment();
      }
    }

    uploadBar.stop();

    const failedUploads = uploadResults.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      console.log(
        chalk.yellow(`⚠️  ${failedUploads.length} file(s) failed to upload`)
      );
      for (const result of failedUploads) {
        console.log(chalk.yellow(`  - ${result.path}: ${result.error}`));
      }
    } else {
      console.log(chalk.green(`✓ Uploaded ${files.length} file(s)`));
    }

    // Wait for markdown files to be processed with progress bar
    const syncResult = await waitForSync(site.id, 30);

    if (syncResult.timeout) {
      displayWarning(
        "Some files are still processing after 30 seconds.\n" +
          "Your site is available but some pages may not be ready yet.\n" +
          "Check back in a moment."
      );
    } else if (!syncResult.success && syncResult.errors) {
      displayWarning("Some files had processing errors (see above).");
    }

    // Display success
    displayPublishSuccess(projectName, user.username || user.email || "user");
  } catch (error) {
    if (error instanceof Error) {
      displayError(error.message);
      console.error(chalk.gray(error.stack));
    } else {
      displayError("An unknown error occurred");
    }
    process.exit(1);
  }
}
