#!/usr/bin/env node
// =============================================
// backdate-drip-posts.mjs
// =============================================
// One-off: pull 20 future-dated seed workouts that aren't from the It Girl
// program (plan_id != 'it-girl'), and backdate their completed_at to slot
// in just before the current discover_visibility_cutoff_iso so they become
// visible in Discover *without* advancing the cutoff (drip stays paused).
//
// Diversity: round-robins across non-It-Girl seed users so no single buddy
// floods the feed.
//
// Usage:
//   node scripts/backdate-drip-posts.mjs --dry-run
//   node scripts/backdate-drip-posts.mjs

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const TARGET_COUNT = 20;
const SPREAD_HOURS = 12;        // backdate window before cutoff
const TAIL_BUFFER_MIN = 5;      // newest backdated post sits this many min before cutoff

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes('--dry-run');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  // 1. Cutoff
  const { data: cfg, error: cfgErr } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'discover_visibility_cutoff_iso')
    .single();
  if (cfgErr) throw cfgErr;
  const cutoffMs = new Date(cfg.value).getTime();
  if (!Number.isFinite(cutoffMs)) {
    throw new Error(`Could not parse cutoff value: ${cfg.value}`);
  }
  console.log(`Cutoff: ${new Date(cutoffMs).toISOString()}`);

  // 2. Non-It-Girl seed user ids. We do this in a separate query because
  //    supabase-js doesn't let us .filter() on a joined column directly.
  const { data: seedUsers, error: usersErr } = await supabase
    .from('profiles')
    .select('id, name, plan_id')
    .eq('is_seed', true);
  if (usersErr) throw usersErr;

  const eligibleUserIds = seedUsers
    .filter((u) => u.plan_id !== 'it-girl')
    .map((u) => u.id);
  const userMeta = new Map(seedUsers.map((u) => [u.id, u]));
  console.log(`Eligible seed users (non It Girl): ${eligibleUserIds.length}`);

  // 3. Candidate workouts — future-dated, with photo, audience=everyone
  const { data: candidates, error: candErr } = await supabase
    .from('workouts')
    .select('id, name, user_id, completed_at, image_uri, image_audience')
    .in('user_id', eligibleUserIds)
    .eq('image_audience', 'everyone')
    .not('image_uri', 'is', null)
    .gt('completed_at', new Date(cutoffMs).toISOString())
    .order('completed_at', { ascending: true });
  if (candErr) throw candErr;
  console.log(`Candidate future-dated workouts: ${candidates.length}`);
  if (candidates.length < TARGET_COUNT) {
    console.warn(
      `Only ${candidates.length} candidates available; will backdate all of them.`
    );
  }

  // 4. Group by user, then round-robin pick
  const byUser = new Map();
  for (const w of candidates) {
    if (!byUser.has(w.user_id)) byUser.set(w.user_id, []);
    byUser.get(w.user_id).push(w);
  }
  const userOrder = shuffle(Array.from(byUser.keys()));
  const picked = [];
  let round = 0;
  while (picked.length < TARGET_COUNT) {
    let progressed = false;
    for (const uid of userOrder) {
      const queue = byUser.get(uid);
      if (queue && queue.length > round) {
        picked.push(queue[round]);
        progressed = true;
        if (picked.length === TARGET_COUNT) break;
      }
    }
    if (!progressed) break; // exhausted
    round++;
  }
  console.log(`Picked ${picked.length} workouts (round-robin across users).`);

  // 5. Assign timestamps — evenly spaced in [cutoff - SPREAD_HOURS, cutoff - TAIL_BUFFER_MIN]
  const tailMs = cutoffMs - TAIL_BUFFER_MIN * 60_000;
  const headMs = cutoffMs - SPREAD_HOURS * 3600_000;
  const slots = [];
  const n = picked.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? tailMs : headMs + ((tailMs - headMs) * i) / (n - 1);
    slots.push(new Date(Math.round(t)).toISOString());
  }
  const shuffledSlots = shuffle(slots);
  const assignments = picked.map((w, i) => ({ ...w, newTs: shuffledSlots[i] }));

  // 6. Apply (or dry-run preview)
  console.log(`\n${DRY_RUN ? 'DRY RUN — would update:' : 'Updating:'}`);
  for (const a of assignments) {
    const meta = userMeta.get(a.user_id);
    const buddy = meta ? `${meta.name} (${meta.plan_id ?? '—'})` : a.user_id;
    console.log(`  ${buddy} | "${a.name ?? '(no name)'}" | ${a.completed_at} → ${a.newTs}`);
  }
  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run without --dry-run to apply.');
    return;
  }

  let updated = 0;
  for (const a of assignments) {
    const { error } = await supabase
      .from('workouts')
      .update({ completed_at: a.newTs })
      .eq('id', a.id);
    if (error) {
      console.error(`  ✗ ${a.id}:`, error.message);
    } else {
      updated++;
    }
  }
  console.log(`\nUpdated ${updated}/${assignments.length} workouts.`);

  // 7. Verify: peek at the feed
  const { data: feed, error: feedErr } = await supabase.rpc('get_public_workout_photos', {
    p_limit: 100,
  });
  if (feedErr) {
    console.warn('Feed verification failed:', feedErr.message);
  } else {
    console.log(`Discover feed now shows ${feed.length} visible posts.`);
    console.log('First 10:');
    for (const r of feed.slice(0, 10)) {
      console.log(`  ${r.user_name} | "${r.workout_name}" | ${r.completed_at}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
