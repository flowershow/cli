import { getAuthHeaders, isAuthenticated } from "./auth.js";
import { API_URL } from "./const.js";

interface Site {
  id: string;
  projectName: string;
  url: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  fileCount?: number;
  totalSize?: number;
  plan?: "FREE" | "PREMIUM";
}

interface CreateSiteResponse {
  site: Site;
}

interface GetSitesResponse {
  sites: Site[];
  total: number;
}

interface GetSiteResponse {
  site: Site;
}

interface DeleteSiteResponse {
  success: boolean;
  message: string;
  deletedFiles: number;
}

interface FileMetadata {
  path: string;
  size: number;
  sha: string;
}

interface UploadUrl {
  path: string;
  uploadUrl: string;
  blobId: string;
}

interface GetUploadUrlsResponse {
  uploadUrls: UploadUrl[];
  expiresIn: number;
}

interface BlobStatus {
  path: string;
  syncStatus: "PENDING" | "SUCCESS" | "ERROR";
  syncError?: string;
}

interface SiteStatusResponse {
  siteId: string;
  status: string;
  files: {
    total: number;
    pending: number;
    success: number;
    failed: number;
  };
  blobs: BlobStatus[];
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/cli/site')
 * @param options - Fetch options
 * @returns Response object
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();

  const url = `${API_URL}${endpoint}`;
  const headers = {
    ...options.headers,
    ...(authHeaders || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Create a new site
 * @param projectName - Project name
 * @param overwrite - Whether to overwrite existing site
 * @returns Site data
 */
export async function createSite(
  projectName: string,
  overwrite: boolean = false
): Promise<CreateSiteResponse> {
  const response = await apiRequest("/api/cli/site", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectName, overwrite }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to create site: ${response.statusText}`
    );
  }

  return (await response.json()) as CreateSiteResponse;
}

/**
 * Get list of user's sites from API
 * @returns Sites data
 */
export async function getSites(): Promise<GetSitesResponse> {
  const response = await apiRequest("/api/cli/site/get-all");

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to fetch sites: ${response.statusText}`
    );
  }

  return (await response.json()) as GetSitesResponse;
}

/**
 * Get a specific site by ID
 * @param siteId - Site ID
 * @returns Site data
 */
export async function getSiteById(siteId: string): Promise<GetSiteResponse> {
  const response = await apiRequest(`/api/cli/site/${siteId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to fetch site: ${response.statusText}`
    );
  }

  return (await response.json()) as GetSiteResponse;
}

/**
 * Get a specific site by name
 * @param siteName - Site name
 * @returns Site data or null if not found
 */
export async function getSiteByName(
  siteName: string
): Promise<GetSiteResponse | null> {
  const response = await apiRequest(`/api/cli/site/by-name/${siteName}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to fetch site: ${response.statusText}`
    );
  }

  return (await response.json()) as GetSiteResponse;
}

/**
 * Delete a site
 * @param siteId - Site ID
 * @returns Delete result
 */
export async function deleteSite(siteId: string): Promise<DeleteSiteResponse> {
  const response = await apiRequest(`/api/cli/site/${siteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to delete site: ${response.statusText}`
    );
  }

  return (await response.json()) as DeleteSiteResponse;
}

/**
 * Get presigned URLs for uploading files
 * @param siteId - Site ID
 * @param files - Array of file metadata
 * @returns Upload URLs data
 */
export async function getUploadUrls(
  siteId: string,
  files: FileMetadata[]
): Promise<GetUploadUrlsResponse> {
  const response = await apiRequest(`/api/cli/site/${siteId}/upload-urls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to get upload URLs: ${response.statusText}`
    );
  }

  return (await response.json()) as GetUploadUrlsResponse;
}

/**
 * Upload a file directly to R2 using presigned URL
 * @param uploadUrl - Presigned URL
 * @param content - File content
 * @param contentType - Content type
 * @returns true if successful
 */
export async function uploadToR2(
  uploadUrl: string,
  content: Buffer,
  contentType: string
): Promise<boolean> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: content,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  return true;
}

/**
 * Get site processing status
 * @param siteId - Site ID
 * @returns Site status data
 */
export async function getSiteStatus(siteId: string): Promise<SiteStatusResponse> {
  const response = await apiRequest(`/api/cli/site/${siteId}/status`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      error.message || `Failed to get site status: ${response.statusText}`
    );
  }

  return (await response.json()) as SiteStatusResponse;
}

/**
 * Check if user is authenticated and has valid token
 * @returns true if authenticated
 */
export function hasValidAuth(): boolean {
  return isAuthenticated();
}
