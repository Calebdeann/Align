#!/usr/bin/env node
// =============================================
// seed-fake-accounts.mjs
// =============================================
// Creates the 19 buddy fake users + 8 "extra" pastel-avatar fake users.
//
// For each account:
//   1. Create auth user via Admin API (email_confirm: true so it doesn't bounce).
//   2. Upload avatar to the `avatars` bucket at `{userId}/avatar.jpg`.
//      - Buddies: assets/profileImages/profile-XX.png
//      - Extras: 512x512 solid pastel PNG generated with `sharp`.
//   3. Upsert profile row with name, plan_id, traits, avatar_url, etc.
//      - Buddies: full bio + tags-translated-to-traits.
//      - Extras: no bio, 1 generic trait.
//   4. Mark with `traffic_source = 'seed-buddy-<id>' | 'seed-extra-<i>'` so
//      teardown can identify them.
//
// Writes manifest: scripts/seed-data/fake-accounts.json
//
// Idempotent: skips accounts whose `traffic_source` sentinel already exists.
//
// Usage:
//   npm run seed:accounts

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const ASSETS_DIR = path.resolve(import.meta.dirname, '..', 'assets', 'profileImages');
const MANIFEST_OUT = path.resolve(import.meta.dirname, 'seed-data', 'fake-accounts.json');

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

// Mirror of src/data/gymBuddies.ts. Kept in sync manually — this script doesn't
// import the TS module to avoid a compile step. If the source changes, update
// here too (or rerun seed:teardown then seed:accounts to refresh).
const BUDDIES = [
  { id: 1,  name: 'Emma',    bio: '22. 🇺🇸',                                          planId: 'pilates-princess', tags: { goal: 'Tone up',          identity: 'Pilates princess', why: 'Self love',          lifestyle: 'Coffee before lifting' } },
  { id: 2,  name: 'Tilly',   bio: null,                                                planId: 'it-girl',          tags: { goal: 'Build discipline', identity: 'Lifter',           stat: '60 day streak',  why: 'Discipline',         lifestyle: 'Headphones in' } },
  { id: 3,  name: 'Rachel',  bio: 'just trying my best tbh',                           planId: 'summer-body',      tags: { goal: 'Stay consistent', identity: 'Beginner',         stat: '25+ workouts',   why: 'Routine',            lifestyle: '9-5 grind' } },
  { id: 4,  name: 'Priya',   bio: '27 | momma bear 🐻',                                planId: 'home',             tags: { goal: 'Be fit',          identity: 'Gym girlie',       stat: '30 day streak',  why: 'Routine',            lifestyle: 'Lunch break sessions' } },
  { id: 6,  name: 'Sarah',   bio: null,                                                planId: 'pilates-princess', tags: { goal: 'Sculpt my abs',   identity: 'Muscle mommy',     stat: '50+ workouts',   why: 'Look good naked',    lifestyle: 'Headphones in' } },
  { id: 7,  name: 'Bec',     bio: 'I just want a dumpy bro',                           planId: 'booty',            tags: { goal: 'Build my booty',  identity: 'Squat queen',      stat: '80kg squat',     why: 'Confidence',         lifestyle: 'Solo sessions' } },
  { id: 8,  name: 'Mila',    bio: 'first plan done. not stopping now.',                planId: 'muscle-mommy',     tags: { goal: 'Stay consistent',                                stat: 'First plan done',                            lifestyle: 'Student' } },
  { id: 9,  name: 'Hannah',  bio: '⋆｡°✩',                                              planId: 'busy-girl' ,          tags: { goal: 'Feel confident',  identity: 'Comeback queen',                           why: 'Self love' } },
  { id: 10, name: 'Aaliyah', bio: 'on my grind',                                       planId: 'busy-girl' ,          tags: {} },
  { id: 11, name: 'Lauren',  bio: 'late lifer + headphones in.',                       planId: 'hourglass',        tags: {} },
  { id: 12, name: 'Sofia',   bio: 'on my glow up shit',                                planId: 'busy-girl' ,          tags: { goal: 'Feel confident',  identity: 'Gym girlie',                                why: 'Look good naked',    lifestyle: 'Pre workout girlie' } },
  { id: 13, name: 'Jess',    bio: 'i love the beach 🏝️',                              planId: 'summer-body',      tags: { goal: 'Lose weight',     identity: 'Gym girlie',       stat: '25+ workouts',   why: 'Mood booster',       lifestyle: 'Weekend lifter' } },
  { id: 14, name: 'Liv',     bio: 'coffee, gym, sleep, repeat.',                       planId: 'pilates-princess', tags: { goal: 'Tone up',         identity: 'Gym girlie',       stat: '30 day streak',  why: 'Confidence',         lifestyle: 'Coffee before lifting' } },
  { id: 15, name: 'Cazz',    bio: null,                                                planId: 'hourglass',        tags: { goal: 'Build my upper body', identity: 'Form obsessed', stat: '60 day streak', why: 'Discipline',         lifestyle: 'Early bird' } },
  { id: 16, name: 'Tay',     bio: null,                                                planId: 'booty',            tags: { goal: 'Build my booty',  identity: 'Glutes lover',     stat: '120kg hip thrust', why: 'Mood booster',     lifestyle: 'Headphones in' } },
  { id: 17, name: 'Mei',     bio: 'between classes + gym. just here to feel good.',    planId: 'home',             tags: { goal: 'Be fit',          identity: 'Beginner',                                  why: 'Mental clarity',     lifestyle: 'Student' } },
  { id: 18, name: 'Donna',   bio: 'comeback sznnn',                                    planId: 'summer-body',      tags: {                          identity: 'Comeback queen',   stat: 'First pull up',  why: 'Sleep better' } },
  { id: 19, name: 'Ruby',    bio: 'beach mornings, gym afternoons',                    planId: 'busy-girl' ,          tags: { goal: 'Feel confident',  identity: 'Gym girlie',       stat: '25+ workouts',   why: 'Confidence',         lifestyle: 'Weekend lifter' } },
  { id: 20, name: 'Remi',    bio: null,                                                planId: 'muscle-mommy',     tags: { goal: 'Get stronger',    identity: 'Competitive',      stat: '100kg deadlift', why: 'Prove myself wrong', lifestyle: '5am club' } },
];

// Buddy tag key → trait category id (constants/traits.ts).
const TAG_KEY_TO_CATEGORY = {
  goal: 'goals',
  identity: 'identity',
  stat: 'stats',
  why: 'why',
  lifestyle: 'lifestyle',
};

// Default trait positions on the normalized 0–1 canvas. Spread them out so
// nothing overlaps. Order is goals → identity → stats → why → lifestyle.
const TRAIT_POSITIONS = [
  { x: 0.22, y: 0.20, rotation:  0.05 },
  { x: 0.72, y: 0.28, rotation: -0.08 },
  { x: 0.30, y: 0.50, rotation: -0.05 },
  { x: 0.74, y: 0.58, rotation:  0.06 },
  { x: 0.40, y: 0.78, rotation:  0.00 },
];

function buddyTraits(buddy) {
  const order = ['goal', 'identity', 'stat', 'why', 'lifestyle'];
  const placed = [];
  let posIdx = 0;
  for (const key of order) {
    const tag = buddy.tags?.[key];
    if (!tag) continue;
    const pos = TRAIT_POSITIONS[posIdx++ % TRAIT_POSITIONS.length];
    placed.push({
      categoryId: TAG_KEY_TO_CATEGORY[key],
      tag,
      x: pos.x,
      y: pos.y,
      rotation: pos.rotation,
    });
  }
  return placed;
}

const EXTRAS = [
  { idx: 1, name: 'Avery',   planId: 'summer-body',      color: '#FFB3BA' },
  { idx: 2, name: 'Madison', planId: 'busy-girl' ,          color: '#FFDFBA' },
  { idx: 3, name: 'Quinn',   planId: 'pilates-princess', color: '#FFFFBA' },
  { idx: 4, name: 'Skylar',  planId: 'home',             color: '#BAFFC9' },
  { idx: 5, name: 'Charlie', planId: 'it-girl',          color: '#BAE1FF' },
  { idx: 6, name: 'Reese',   planId: 'booty',            color: '#D4A5FF' },
  { idx: 7, name: 'Harper',  planId: 'hourglass',        color: '#FFC8DD' },
  { idx: 8, name: 'Sloane',  planId: 'muscle-mommy',     color: '#C9E4DE' },
];

const EXTRA_TRAITS = [
  // One generic trait apiece — enough to look real, not enough to fingerprint.
  [{ categoryId: 'why', tag: 'Self love', ...TRAIT_POSITIONS[0] }],
];

async function fetchExistingSeedProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, traffic_source, name')
    .like('traffic_source', 'seed-%');
  if (error) throw error;
  return new Map(data.map((p) => [p.traffic_source, p]));
}

async function uploadAvatar(userId, buffer, contentType) {
  // service-role bypasses RLS; upsert true so re-runs are safe.
  const url = `${SUPABASE_URL}/storage/v1/object/avatars/${userId}/avatar.jpg`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (res.status !== 200 && res.status !== 201) {
    const text = await res.text();
    throw new Error(`Avatar upload failed (${res.status}): ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
}

async function createOrFindUser(email) {
  // Try create; on conflict (already exists), look up via listUsers.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!error && data?.user) return data.user;
  // Already exists path — search by email.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const found = list.users.find((u) => u.email === email);
  if (found) return found;
  throw new Error(`createUser failed and user not found via list: ${error?.message}`);
}

async function upsertProfile(row) {
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function seedBuddy(buddy, existingByTraffic, refreshMeta) {
  const traffic = `seed-buddy-${buddy.id}`;
  const existing = existingByTraffic.get(traffic);
  if (existing && !refreshMeta) {
    return { kind: 'skipped', userId: existing.id, name: buddy.name };
  }
  if (existing && refreshMeta) {
    // Re-apply meta (name/bio/traits/plan_id) to the existing seed buddy
    // without re-creating the auth user or re-uploading the avatar. Used to
    // backfill traits/bio for buddies that were seeded before the BUDDIES
    // inline data had those fields populated.
    await upsertProfile({
      id: existing.id,
      name: buddy.name,
      bio: buddy.bio,
      plan_id: buddy.planId,
      traits: buddyTraits(buddy),
      updated_at: new Date().toISOString(),
    });
    return { kind: 'refreshed', userId: existing.id, name: buddy.name };
  }

  const email = `seed-buddy-${buddy.id}@itgirl.local`;
  const user = await createOrFindUser(email);
  const userId = user.id;

  // Read local avatar file → bytes → upload.
  const avatarFile = path.join(ASSETS_DIR, `profile-${String(buddy.id).padStart(2, '0')}.png`);
  if (!fs.existsSync(avatarFile)) {
    throw new Error(`Avatar file missing: ${avatarFile}`);
  }
  const avatarBytes = fs.readFileSync(avatarFile);
  const avatarUrl = await uploadAvatar(userId, avatarBytes, 'image/png');

  await upsertProfile({
    id: userId,
    email,
    name: buddy.name,
    bio: buddy.bio,
    plan_id: buddy.planId,
    avatar_url: avatarUrl,
    traits: buddyTraits(buddy),
    traffic_source: traffic,
    updated_at: new Date().toISOString(),
  });

  return { kind: 'created', userId, name: buddy.name };
}

async function seedExtra(extra, existingByTraffic, refreshMeta) {
  const traffic = `seed-extra-${extra.idx}`;
  const existing = existingByTraffic.get(traffic);
  if (existing && !refreshMeta) {
    return { kind: 'skipped', userId: existing.id, name: extra.name };
  }
  if (existing && refreshMeta) {
    await upsertProfile({
      id: existing.id,
      name: extra.name,
      bio: null,
      plan_id: extra.planId,
      traits: EXTRA_TRAITS[0],
      updated_at: new Date().toISOString(),
    });
    return { kind: 'refreshed', userId: existing.id, name: extra.name };
  }

  const email = `seed-extra-${extra.idx}@itgirl.local`;
  const user = await createOrFindUser(email);
  const userId = user.id;

  // Solid-color 512×512 PNG.
  const avatarBytes = await sharp({
    create: { width: 512, height: 512, channels: 4, background: extra.color },
  })
    .png()
    .toBuffer();
  const avatarUrl = await uploadAvatar(userId, avatarBytes, 'image/png');

  await upsertProfile({
    id: userId,
    email,
    name: extra.name,
    bio: null,
    plan_id: extra.planId,
    avatar_url: avatarUrl,
    traits: EXTRA_TRAITS[0],
    traffic_source: traffic,
    updated_at: new Date().toISOString(),
  });

  return { kind: 'created', userId, name: extra.name };
}

async function main() {
  const refreshMeta = process.argv.includes('--refresh-meta');
  if (refreshMeta) {
    console.log('--refresh-meta: existing seed buddies will have name/bio/traits/plan_id re-applied.');
  }

  const existing = await fetchExistingSeedProfiles();
  console.log(`Existing seed profiles: ${existing.size}`);

  const manifest = [];

  for (const buddy of BUDDIES) {
    const result = await seedBuddy(buddy, existing, refreshMeta);
    console.log(`buddy ${buddy.id} ${buddy.name}: ${result.kind} (${result.userId})`);
    manifest.push({
      kind: 'buddy',
      buddyId: buddy.id,
      userId: result.userId,
      name: buddy.name,
      planId: buddy.planId,
    });
  }

  for (const extra of EXTRAS) {
    const result = await seedExtra(extra, existing, refreshMeta);
    console.log(`extra ${extra.idx} ${extra.name}: ${result.kind} (${result.userId})`);
    manifest.push({
      kind: 'extra',
      extraIdx: extra.idx,
      userId: result.userId,
      name: extra.name,
      planId: extra.planId,
    });
  }

  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));

  console.log('---');
  console.log(`Total accounts: ${manifest.length}`);
  console.log(`Manifest: ${MANIFEST_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
