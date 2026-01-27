/**
 * Migration script: Update onboarding schema
 *
 * Adds health_situation and energy_fluctuation columns to
 * onboarding_sessions and profiles tables.
 * Removes deprecated accomplish column from both tables.
 *
 * Usage: node scripts/migrate-onboarding-schema.mjs
 *
 * This outputs the SQL to run in Supabase SQL Editor.
 * Copy-paste the output into your Supabase dashboard.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env for project URL
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : 'unknown';

// Read and print the migration SQL
const sqlPath = resolve(__dirname, '..', 'supabase', 'migrations', '011_onboarding_questions_update.sql');
const sqlContent = readFileSync(sqlPath, 'utf-8');

console.log('=== Onboarding Schema Migration ===\n');
console.log('Run this SQL in your Supabase SQL Editor:\n');
console.log(sqlContent);
console.log(`\nOpen: https://supabase.com/dashboard/project/${projectRef}/sql`);
