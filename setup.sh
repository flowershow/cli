#!/bin/bash

# FlowerShow CLI Setup Script

echo "🌸 Setting up FlowerShow CLI..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit .env and fill in your credentials, then run this script again."
    echo ""
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client in CLI directory
echo ""
echo "🔧 Generating Prisma client..."
npx prisma@5.5.2 generate --schema=prisma/schema.prisma

# Create anonymous user
echo ""
echo "👤 Creating anonymous user..."
if node scripts/create-anonymous-user.js; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "You can now use the CLI:"
    echo "  node cli.js publish <path>   - Publish a file or folder"
    echo "  node cli.js list             - List all sites"
    echo "  node cli.js delete <name>    - Delete a site"
    echo ""
else
    echo ""
    echo "❌ Failed to create anonymous user"
    echo "Please check the error above and try again"
    echo ""
    exit 1
fi