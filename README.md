# FlowerShow CLI (Alpha 🚧)

A CLI tool for publishing Markdown files and folders directly to FlowerShow with OAuth authentication.

## Installation

```bash
npm install -g flowershow
```

Then use the `flowershow` command anywhere:

```bash
flowershow auth login
flowershow publish ./my-notes
```

## Quick Start

### 1. Authenticate

Before using any commands, you must authenticate:

```bash
flowershow auth login
```

This will:

1. Display a URL and verification code
2. Open your browser to authorize the CLI
3. Store your authentication token locally

See [Authentication Documentation](docs/authentication.md) for details.

### 2. Publish Your Content

```bash
# Publish a folder
flowershow publish ./my-notes

# Publish a single file
flowershow publish ./my-note.md
```

## Commands

### Authentication

#### `flowershow auth login`

Authenticate with FlowerShow via browser OAuth flow.

```bash
flowershow auth login
```

#### `flowershow auth status`

Check your current authentication status.

```bash
flowershow auth status
```

#### `flowershow auth logout`

Remove your stored authentication token.

```bash
flowershow auth logout
```

See [Authentication Documentation](docs/authentication.md) for detailed information.

### Publishing

#### `flowershow publish <path> [morePaths...] [options]`

Publish files or folders to FlowerShow.

**Options:**

- `--overwrite` - Overwrite existing site if it already exists
- `--name <siteName>` - Custom name for the site (defaults to file/folder name)

**Examples:**

```bash
# Publish a single markdown file
flowershow publish ./my-note.md

# Publish multiple files
flowershow publish ./intro.md ./chapter1.md ./chapter2.md

# Publish a folder
flowershow publish ./my-notes

# Overwrite an existing site
flowershow publish ./my-notes --overwrite

# Publish with a custom site name
flowershow publish ./my-notes --name my-custom-site

# Combine options
flowershow publish ./my-notes --name my-custom-site --overwrite
```

**What happens:**

1. Files are discovered and filtered (ignores `.git`, `node_modules`, etc.)
2. Project name is derived from the first file/folder name
3. Site is created via the FlowerShow API
4. Presigned URLs are obtained for secure file uploads
5. Files are uploaded directly to Cloudflare R2 storage
6. CLI waits for markdown files to be processed
7. Site URL is displayed

**Single file behavior:**

- Filename becomes the project name
- File is saved as `README.md` (or `README.mdx`)
- Accessible at `/@{username}/{filename}`

**Multiple files behavior:**

- First filename becomes the project name
- First file is saved as `README.md` (or `README.mdx`)
- Subsequent files keep their original names
- Accessible at `/@{username}/{first-filename}`

**Folder behavior:**

- Folder name becomes the project name
- All files maintain their relative paths
- Accessible at `/@{username}/{foldername}`

### Site Management

#### `flowershow list`

List all sites published by your authenticated user.

```bash
flowershow list
```

Shows site names, URLs, and timestamps.

#### `flowershow delete <project-name>`

Delete a site and all its files.

```bash
flowershow delete my-notes
```

Removes the site and all its files via the FlowerShow API.

## File Filtering

The CLI automatically ignores common non-content files and directories:

- `.git/`, `node_modules/`, `.cache/`, `dist/`, `build/`
- `.DS_Store`, `Thumbs.db`
- `.env*`, `*.log`
- `.next/`, `.vercel/`, `.turbo/`

If `.gitignore` file is present in the published folder, it will also ignore files matched by it.

## Site URLs

All CLI-published sites are accessible at:

```
https://my.flowershow.app/@{username}/{project-name}
```

Where `{username}` is your authenticated username.

## Troubleshooting

### "You must be authenticated to use this command"

Run `flowershow auth login` to authenticate.

### "Authentication token is invalid or expired"

Your token may have been revoked. Re-authenticate:

```bash
flowershow auth login
```

### "Site already exists"

A site with that name already exists. You can:

- Use the `--overwrite` flag: `flowershow publish <path> --overwrite`
- Delete it first: `flowershow delete <name>`
- Rename your file/folder
- Use `flowershow list` to see all existing sites

### Files still processing after timeout

The site is live, but some pages may not be ready yet. The Cloudflare worker processes files asynchronously. Check your site again in a moment.

## Architecture

All CLI commands communicate with the FlowerShow API:

- **Authentication**: OAuth device flow endpoints
- **Site Management**: Create, list, and delete sites
- **File Upload**: Presigned URL generation and status polling
- **User Info**: Retrieve authenticated user details

### Security

- **Token Storage**: Authentication tokens are stored in `~/.flowershow/token.json`
- **Token Format**: CLI tokens use the `fs_cli_` prefix
- **Token Expiration**: Tokens do not expire by default
- **Token Revocation**: Revoke tokens from the FlowerShow dashboard or via `flowershow auth logout`
- **Secure Uploads**: Files are uploaded using time-limited presigned URLs
- **No Credentials**: CLI never stores database or storage credentials

## Development

### Setup

1. **Clone and install dependencies:**

```bash
cd cli
pnpm install
```

2. **Configure environment:**

Use local or other non-production API and publish URLs.

```bash
cp .env.example .env
```

```bash
API_URL="http://cloud.localhost:3000"
APP_URL="http://my.localhost:3000"
```

3. **Run commands:**

```bash
pnpm dev auth login
pnpm dev publish ...
```

You can also build the project, link it globally and use it as you normally would the npm-installed version:

```bash
pnpm build
npm link
flowershow ...
```
