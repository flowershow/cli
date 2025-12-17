# FlowerShow CLI

A minimal CLI tool for publishing Markdown files and folders directly to FlowerShow without Git or authentication.

## Setup

1. **Install dependencies:**
   ```bash
   cd cli
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials:
   - Database connection strings (Postgres)
   - R2 storage credentials (Cloudflare R2)
   - FlowerShow domain
   - Anonymous user ID

3. **Create anonymous user in database:**
   
   Run this SQL in your database (or use Prisma Studio):
   ```sql
   INSERT INTO "User" (id, name, username, gh_username, email, role, created_at, updated_at)
   VALUES (
     'cli_anonymous_user_id',
     'Anonymous CLI User',
     'anonymous',
     'anonymous',
     'cli@flowershow.app',
     'USER',
     NOW(),
     NOW()
   )
   ON CONFLICT (id) DO NOTHING;
   ```

## Usage

### Publish a file or folder

```bash
node cli.js publish <path>
```

**Examples:**
```bash
# Publish a single markdown file
node cli.js publish ./my-note.md

# Publish a folder
node cli.js publish ./my-notes
```

**What happens:**
1. Files are discovered and filtered (ignores `.git`, `node_modules`, etc.)
2. Project name is derived from filename/folder name
3. Files are uploaded to R2 storage
4. Database records are created
5. CLI waits for markdown files to be processed
6. Site URL is displayed

**Single file behavior:**
- Filename becomes the project name
- File is saved as `README.md` (or `README.mdx`)
- Accessible at `/@anonymous/{filename}`

**Folder behavior:**
- Folder name becomes the project name
- All files maintain their relative paths
- Accessible at `/@anonymous/{foldername}`

### List all sites

```bash
node cli.js list
```

Shows all sites published by the anonymous user with their URLs and timestamps.

### Delete a site

```bash
node cli.js delete <project-name>
```

**Example:**
```bash
node cli.js delete my-notes
```

Removes the site from the database and deletes all files from R2 storage.

## File Filtering

The CLI automatically ignores common non-content files and directories:

- `.git/`, `node_modules/`, `.cache/`, `dist/`, `build/`
- `.DS_Store`, `Thumbs.db`
- `.env*`, `*.log`
- `.next/`, `.vercel/`, `.turbo/`

## Supported File Types

- **Markdown:** `.md`, `.mdx`
- **Images:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`
- **Documents:** `.pdf`
- **Data:** `.csv`, `.json`, `.yaml`, `.yml`, `.geojson`
- **Other:** `.css`, `.ico`

## Site URLs

All CLI-published sites are accessible at:
```
https://flowershow.app/@anonymous/{project-name}
```

## Limitations

- **No authentication:** Uses a shared anonymous user (for internal testing only)
- **No updates:** Re-publishing with the same name will fail (delete first)
- **No versioning:** Each publish is independent
- **Global namespace:** All CLI sites share the same namespace

## Troubleshooting

### "ANONYMOUS_USER_ID not set"
Make sure you've created the `.env` file and set the `ANONYMOUS_USER_ID` variable.

### "Site already exists"
A site with that name already exists. Either:
- Delete it first: `node cli.js delete <name>`
- Rename your file/folder
- Use `node cli.js list` to see all existing sites

### "No markdown files found"
The CLI will still create the site, but it will be empty. Make sure your folder contains `.md` or `.mdx` files.

### Files still processing after 30 seconds
The site is live, but some pages may not be ready yet. The Cloudflare worker processes files asynchronously. Check back in a moment.

## Development

The CLI is structured as follows:

```
cli/
├── cli.js                 # Main entry point
├── package.json          # Dependencies
├── .env                  # Configuration (gitignored)
├── lib/
│   ├── db.js            # Database operations
│   ├── storage.js       # R2 upload operations
│   ├── files.js         # File discovery & filtering
│   ├── utils.js         # Shared utilities
│   └── commands/
│       ├── publish.js   # Publish command
│       ├── list.js      # List command
│       └── delete.js    # Delete command
└── README.md            # This file
```

## Notes

- This is for **internal testing only**
- Only the FlowerShow team should use the anonymous user
- Files are processed by an existing Cloudflare worker
- No changes needed to the main FlowerShow application