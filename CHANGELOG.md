# CHANGELOG

## 0.3.0

### Minor Changes

- **BREAKING CHANGES - Package and Command Rename**

  This release renames the package from `flowershow` to `flowershow-publish` with significant command structure improvements.

  ## What Changed

  ### Package Name

  - NPM package: `flowershow` → `flowershow-publish`
  - Binary command: `flowershow` → `publish`

  ### Command Structure

  - **Main publish command is now default**: `publish <path>` (previously `flowershow publish <path>`)
  - **All other commands updated**: Use `publish` as the base command
    - `publish auth login` (was `flowershow auth login`)
    - `publish sync <path>` (was `flowershow sync <path>`)
    - `publish list` (was `flowershow list`)
    - `publish delete <name>` (was `flowershow delete <name>`)

  ### Migration

  See [MIGRATION.md](MIGRATION.md) for complete migration instructions.

## 0.2.12

### Patch Changes

- Use content type returned from the API when uploading files using presigned URLs.

## 0.2.11

### Patch Changes

- Publish to production environment.

## 0.2.10

### Patch Changes

- Normalize paths on Windows.

## 0.2.9

### Patch Changes

- Fix version display.

## 0.2.8

### Patch Changes

- Fix version display.

## 0.2.7

### Patch Changes

- Fix version display.

## 0.2.6

### Patch Changes

- Fix package version display when running `flowershow --version`.

## 0.2.5

### Patch Changes

- Add `sync` command for intelligent syncing of changed files.
