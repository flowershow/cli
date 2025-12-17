#!/usr/bin/env node

import pkg from '@prisma/client';

const { PrismaClient } = pkg;

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function createAnonymousUser() {
  const anonymousUserId = process.env.ANONYMOUS_USER_ID;

  if (!anonymousUserId) {
    console.error('❌ Error: ANONYMOUS_USER_ID not set in .env file');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: anonymousUserId },
    });

    if (existingUser) {
      console.log('✓ Anonymous user already exists');
      console.log(`  ID: ${existingUser.id}`);
      console.log(`  Username: @${existingUser.ghUsername}`);
      return;
    }

    // Create the anonymous user
    const user = await prisma.user.create({
      data: {
        id: anonymousUserId,
        name: 'Anonymous CLI User',
        username: 'anonymous',
        ghUsername: 'anonymous',
        email: 'cli@flowershow.app',
        role: 'USER',
      },
    });

    console.log('✓ Successfully created anonymous user');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: @${user.ghUsername}`);
    console.log(`  Email: ${user.email}`);
  } catch (error) {
    console.error('❌ Error creating anonymous user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAnonymousUser();
