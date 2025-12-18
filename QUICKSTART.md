# FlowerShow CLI - Quick Start Guide

## Installation

1. **Navigate to CLI directory:**

   ```bash
   cd cli
   ```

2. **Run setup script:**

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment:**
   Edit `cli/.env` with your credentials (copy from main project's `.env` if available)

   Then run setup script again:

   ```bash
   ./setup.sh
   ```

   The setup script will automatically:

   - Install dependencies
   - Generate Prisma client
   - Create the anonymous user in the database

## Quick Examples

### Publish a single file

```bash
node cli.js publish ../docs/my-note.md
```

### Publish multiple files

```bash
node cli.js publish ../docs/intro.md ../docs/chapter1.md ../docs/chapter2.md
```

### Publish a folder

```bash
node cli.js publish ../docs/my-notes
```

### List all sites

```bash
node cli.js list
```

### Delete a site

```bash
node cli.js delete my-note
```

## What Gets Published?

### Single File

- **Input:** `my-note.md`
- **Project name:** `my-note`
- **Saved as:** `README.md`
- **URL:** `https://flowershow.app/@anonymous/my-note`

### Multiple Files

- **Input:** `intro.md chapter1.md chapter2.md`
- **Project name:** `intro` (from first file)
- **First file saved as:** `README.md`
- **Other files:** Keep their original names
- **URL:** `https://flowershow.app/@anonymous/intro`

### Folder

- **Input:** `my-notes/` folder
- **Project name:** `my-notes`
- **Files:** All files maintain their structure
- **URL:** `https://flowershow.app/@anonymous/my-notes`

## Common Issues

### "Site already exists"

→ Delete it first: `node cli.js delete <name>` or use `--overwrite` flag when publishing.

### "No markdown files found"

→ Site will be created but empty (add .md or .mdx files)

## Next Steps

1. Test with a single file
2. Test with a folder
3. Verify the site is accessible
4. Try listing and deleting sites

For full documentation, see [README.md](./README.md)
