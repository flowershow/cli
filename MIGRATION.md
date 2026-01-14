# Migration Guide: flowershow → flowershow-publish

This package has been renamed from `flowershow` to `flowershow-publish` with improved command structure.

## What Changed?

### Package Name

- **Old**: `flowershow`
- **New**: `flowershow-publish`

### Command Name

- **Old**: `flowershow`
- **New**: `publish`

### Command Structure

The main publish command is now the default action (no subcommand needed):

- **Old**: `flowershow publish <path>`
- **New**: `publish <path>`

All other commands remain as subcommands with the new base command.

## Why the Change?

1. **Clearer package name** - More descriptive on npm
2. **Simpler commands** - Just `publish <path>` instead of `flowershow publish <path>`
3. **Better UX** - Fewer keystrokes for the most common action
4. **Fresh start** - Clean slate with version 0.1.0 to indicate this is a new package

## How to Migrate

### 1. Uninstall Old Package

```bash
npm uninstall -g flowershow
```

### 2. Install New Package

```bash
npm install -g flowershow-publish
```

### 3. No Re-authentication Needed

Your authentication token is stored in `~/.flowershow/token.json` and will continue to work with the new CLI. No need to log in again!

## Examples

### Before (old package)

```bash
npm install -g flowershow
flowershow auth login
flowershow publish ./my-notes
flowershow sync ./my-notes
flowershow list
```

### After (new package)

```bash
npm install -g flowershow-publish
publish auth login
publish ./my-notes
publish sync ./my-notes
publish list
```

## Breaking Changes

None! All functionality remains the same, only the package name and command names have changed.
