#!/usr/bin/env node
// =============================================
// teardown-fake-data.mjs
// =============================================
// Removes everything created by the seed:* scripts. Safe to re-run.
//
// Order of operations:
//   1. DELETE workouts WHERE notes = '[seed]'  (cascades exercises/sets/muscles)
//   2. List auth.users WHERE email LIKE 'seed-%@itgirl.local', delete via Admin
//      API (cascades profiles via FK).
//   3. DELETE storage objects under workout-photos/seed/* and avatars/{userId}/*.
//
// Usage:
//   npm run seed:teardown

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteSeedWorkouts() {
  const { error, count } = await supabase
    .from('workouts')
    .delete({ count: 'exact' })
    .eq('notes', '[seed]');
  if (error) throw error;
  console.log(`Deleted ${count ?? 0} [seed] workouts (cascaded exercises/sets/muscles).`);
}

async function deleteSeedUsers() {
  // List all users (paginated, max 1000 per page).
  let allSeedUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const seed = data.users.filter((u) => /^seed-(buddy|extra)-/.test(u.email ?? ''));
    allSeedUsers.push(...seed);
    if (data.users.length < 1000) break;
    page++;
  }
  console.log(`Found ${allSeedUsers.length} seed auth users.`);
  for (const u of allSeedUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.warn(`Failed to delete user ${u.email}: ${error.message}`);
    else console.log(`  deleted ${u.email}`);
  }
  return allSeedUsers.map((u) => u.id);
}

async function deleteStorageObjects(deletedUserIds) {
  // workout-photos/seed/**
  const photoPrefixes = ['seed/buddy', 'seed/extra'];
  for (const prefix of photoPrefixes) {
    // List files recursively (1-level dirs first, then files within).
    const { data: top, error: topErr } = await supabase.storage
      .from('workout-photos')
      .list(prefix, { limit: 1000 });
    if (topErr) {
      console.warn(`list ${prefix} failed: ${topErr.message}`);
      continue;
    }
    for (const entry of top ?? []) {
      if (entry.id) {
        // It's a file directly at this prefix.
        await supabase.storage.from('workout-photos').remove([`${prefix}/${entry.name}`]);
      } else {
        // It's a subdir (buddy/<id>).
        const subPath = `${prefix}/${entry.name}`;
        const { data: nested } = await supabase.storage
          .from('workout-photos')
          .list(subPath, { limit: 1000 });
        const toDelete = (nested ?? []).map((f) => `${subPath}/${f.name}`);
        if (toDelete.length > 0) {
          const { error } = await supabase.storage.from('workout-photos').remove(toDelete);
          if (error) console.warn(`remove ${subPath} failed: ${error.message}`);
          else console.log(`  removed ${toDelete.length} files from ${subPath}`);
        }
      }
    }
  }

  // avatars/{userId}/avatar.jpg for each deleted seed user.
  if (deletedUserIds.length > 0) {
    const avatarPaths = deletedUserIds.map((id) => `${id}/avatar.jpg`);
    const { error } = await supabase.storage.from('avatars').remove(avatarPaths);
    if (error) console.warn(`avatar removal: ${error.message}`);
    else console.log(`  removed ${avatarPaths.length} avatar files`);
  }
}

async function main() {
  console.log('Tearing down all seed data...');
  await deleteSeedWorkouts();
  const deletedIds = await deleteSeedUsers();
  await deleteStorageObjects(deletedIds);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
