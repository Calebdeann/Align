#!/usr/bin/env npx tsx
/**
 * Preview every workout in every plan, grouped by plan → week → day.
 *
 * Run:  npx tsx scripts/preview-plan-workouts.mts
 * Out:  ./plan-workouts-preview.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { HOURGLASS_PROGRAM } from '../src/data/programs/hourglass';
import { BOOTY_PROGRAM } from '../src/data/programs/booty';
import { IT_GIRL_PROGRAM } from '../src/data/programs/it-girl';
import { MUSCLE_MOMMY_PROGRAM } from '../src/data/programs/muscle-mommy';
import { PILATES_PRINCESS_PROGRAM } from '../src/data/programs/pilates-princess';
import { SUMMER_BODY_PROGRAM } from '../src/data/programs/summer-body';
import { BUSY_GIRL_PROGRAM } from '../src/data/programs/busy-girl';
import { HOME_PROGRAM } from '../src/data/programs/home';
import type { Program } from '../src/data/programs/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLANS: { id: string; label: string; program: Program }[] = [
  { id: 'hourglass',        label: 'Hourglass',        program: HOURGLASS_PROGRAM },
  { id: 'booty',            label: 'Booty',            program: BOOTY_PROGRAM },
  { id: 'it-girl',          label: 'It Girl',          program: IT_GIRL_PROGRAM },
  { id: 'muscle-mommy',     label: 'Muscle Mommy',     program: MUSCLE_MOMMY_PROGRAM },
  { id: 'pilates-princess', label: 'Pilates Princess', program: PILATES_PRINCESS_PROGRAM },
  { id: 'summer-body',      label: 'Summer Body',      program: SUMMER_BODY_PROGRAM },
  { id: 'busy-girl',        label: 'Busy Girl',        program: BUSY_GIRL_PROGRAM },
  { id: 'home',             label: 'Home',             program: HOME_PROGRAM },
];

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── DB resolution ───────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const env = fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
    const m = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (m) SERVICE_KEY = m[1].trim();
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env / .env');
  process.exit(1);
}

const ALIASES: Record<string, string> = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'programs', 'exerciseAliases.json'), 'utf8')
).aliases;

console.log('Fetching exercises from Supabase…');
const exResp = await fetch(
  `${SUPABASE_URL}/rest/v1/exercises?select=id,name,display_name,keywords,popularity&order=display_name.asc&limit=2000`,
  { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
);
type ExRow = { id: string; name: string; display_name: string | null; keywords: string[] | null; popularity: number | null };
const allEx: ExRow[] = await exResp.json();
console.log(`  loaded ${allEx.length} exercises`);

const byName = new Map<string, ExRow>();
const byDisplayName = new Map<string, ExRow>();
for (const e of allEx) {
  if (e.name) byName.set(e.name.toLowerCase().trim(), e);
  if (e.display_name) byDisplayName.set(e.display_name.toLowerCase().trim(), e);
}

// Faithful port of src/services/exerciseMatching.ts (findBestMatch) PLUS
// src/utils/exerciseSearch.ts (searchAndRankExercises) for tiebreaking.
const ABBREVIATIONS: Record<string, string> = {
  rdl: 'romanian deadlift', ohp: 'overhead press', bb: 'barbell', db: 'dumbbell', ez: 'ez bar',
  dl: 'deadlift', bp: 'bench press', sldl: 'stiff leg deadlift', cgbp: 'close grip bench press',
  jm: 'jm press', ghr: 'glute ham raise', rdls: 'romanian deadlift', 'hip thrust': 'barbell hip thrust',
};
function depluralize(w: string) {
  return w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w;
}
function countWordOverlap(query: string, target: string): number {
  const q = query.toLowerCase().split(/\s+/).map(depluralize);
  const t = target.toLowerCase().split(/[\s(),-]+/).map(depluralize);
  return q.filter((qw) => t.some((tw) => tw.includes(qw) || qw.includes(tw))).length;
}

// Score one row vs one query (single-word or multi-word), porting the layered
// scorer from src/utils/exerciseSearch.ts.
function scoreExercise(e: ExRow, query: string): number {
  const q = query.toLowerCase().trim();
  const name = e.name.toLowerCase();
  const displayName = (e.display_name || '').toLowerCase();
  const keywords = e.keywords || [];
  let score = 0;

  let bestKwScore = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (k === q) bestKwScore = Math.max(bestKwScore, 90);
    else if (k.startsWith(q)) bestKwScore = Math.max(bestKwScore, 80);
    else if (k.includes(q)) bestKwScore = Math.max(bestKwScore, 40);
  }
  score += bestKwScore;

  if (name.startsWith(q) || displayName.startsWith(q)) score += 100;

  const strip = (w: string) => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  const nameWords = name.split(/\s+/).map(strip);
  const displayWords = displayName ? displayName.split(/\s+/).map(strip) : [];
  const allWords = [...nameWords, ...displayWords].filter((w) => w.length > 0);

  if (allWords.some((w) => w === q)) score += 50;
  if (allWords.some((w) => w.startsWith(q))) score += 30;
  if (name.includes(q) || displayName.includes(q)) score += 25;
  if (score > 0 && e.popularity) score += Math.min(e.popularity, 5);
  return score;
}

function searchAndRank(rows: ExRow[], query: string): ExRow[] {
  const q = query.trim();
  if (!q) return rows;
  const words = q.split(/\s+/).filter((w) => w.length > 0);

  return rows
    .map((e) => {
      if (words.length === 1) {
        return { e, score: scoreExercise(e, q) };
      }
      let matchedWords = 0;
      let total = 0;
      for (const w of words) {
        const s = scoreExercise(e, w);
        if (s > 0) { matchedWords++; total += s; }
      }
      const score = matchedWords > 0 ? matchedWords * 1000 + total : 0;
      return { e, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const popA = a.e.popularity || 0;
      const popB = b.e.popularity || 0;
      if (popB !== popA) return popB - popA;
      return (a.e.display_name || a.e.name).localeCompare(b.e.display_name || b.e.name);
    })
    .map((r) => r.e);
}

function findBestMatch(programName: string): { row: ExRow | null; via: 'exact' | 'keyword' | 'fuzzy' | 'abbr' | null } {
  const norm = programName.toLowerCase().trim();
  const dep = depluralize(norm);
  // 1) Exact name / display_name (plural-aware)
  for (const e of allEx) {
    const n = e.name.toLowerCase(); const d = (e.display_name || '').toLowerCase();
    if (n === norm || n === dep || depluralize(n) === dep || d === norm || d === dep || depluralize(d) === dep) {
      return { row: e, via: 'exact' };
    }
  }
  // 2) Keyword exact
  for (const e of allEx) {
    if (e.keywords?.some((k) => {
      const kl = k.toLowerCase(); return kl === norm || kl === dep || depluralize(kl) === dep;
    })) return { row: e, via: 'keyword' };
  }
  // 3) Word-overlap scoring → ties broken by searchAndRank (layered scorer)
  const scored = allEx.map((e) => {
    const nOverlap = countWordOverlap(norm, e.name);
    const dOverlap = countWordOverlap(norm, e.display_name || '');
    const kOverlap = Math.max(...(e.keywords || []).map((k) => countWordOverlap(norm, k)), 0);
    return { e, score: Math.max(nOverlap, dOverlap, kOverlap) };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored.length && scored[0].score > 0) {
    const best = scored[0].score;
    const top = scored.filter((s) => s.score === best).map((s) => s.e);
    const ranked = searchAndRank(top, programName);
    return { row: ranked.length > 0 ? ranked[0] : top[0], via: 'fuzzy' };
  }
  // 4) Abbreviation expansion
  let expanded = norm;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    expanded = expanded.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  if (expanded !== norm) {
    const exScored = allEx.map((e) => ({
      e, score: Math.max(countWordOverlap(expanded, e.name), countWordOverlap(expanded, e.display_name || ''))
    }));
    exScored.sort((a, b) => b.score - a.score);
    if (exScored.length && exScored[0].score > 0) return { row: exScored[0].e, via: 'abbr' };
  }
  return { row: null, via: null };
}

function resolve(programName: string): { row: ExRow | null; broken: boolean; via: 'alias' | 'exact' | 'keyword' | 'fuzzy' | 'abbr' | null } {
  const key = programName.toLowerCase().trim();
  const aliasTarget = ALIASES[key];
  if (aliasTarget) {
    const t = aliasTarget.toLowerCase().trim();
    const hit = byName.get(t) || byDisplayName.get(t);
    return { row: hit ?? null, broken: !hit, via: hit ? 'alias' : null };
  }
  const match = findBestMatch(programName);
  return { row: match.row, broken: false, via: match.via };
}

function renderPlan(plan: { id: string; label: string; program: Program }) {
  const weeks = new Map<number, typeof plan.program.days>();
  for (const day of plan.program.days) {
    if (!weeks.has(day.week)) weeks.set(day.week, []);
    weeks.get(day.week)!.push(day);
  }
  const sortedWeeks = [...weeks.keys()].sort((a, b) => a - b);

  const weekSections = sortedWeeks
    .map((wk) => {
      const days = weeks.get(wk)!.sort((a, b) => a.dayInWeek - b.dayInWeek);
      const dayBlocks = days
        .map((day) => {
          const workouts = day.workouts
            .map((w) => {
              const exercises = w.exercises
                .map((ex) => {
                  const superset = ex.supersetGroup
                    ? ` <span class="superset">superset ${ex.supersetGroup}</span>`
                    : '';
                  const notes = ex.notes ? `<div class="ex-notes">${esc(ex.notes)}</div>` : '';
                  const { row, via } = resolve(ex.name);
                  const trackerName = row ? (row.display_name || row.name) : ex.name;
                  // Trim only — even a single char (or hyphen) difference = mismatch.
                  const isMatch = ex.name.trim() === trackerName.trim();
                  const status = isMatch
                    ? `<span class="status match">MATCH</span>`
                    : `<span class="status mismatch">MISMATCH</span>`;
                  const viaLabel = via ? `<span class="via via-${via}">${via}</span>` : '';
                  return `<li class="${isMatch ? 'ex-match' : 'ex-mismatch'}">
                    <div class="ex-row">
                      <div class="ex-col">
                        <div class="ex-label">Preview</div>
                        <div class="ex-name">${esc(ex.name)}</div>
                        <div class="ex-meta">${ex.sets} × ${esc(ex.reps)}${superset}</div>
                      </div>
                      <div class="ex-arrow">→</div>
                      <div class="ex-col">
                        <div class="ex-label">Tracker</div>
                        <div class="ex-name">${esc(trackerName)}</div>
                        <div class="ex-meta">${viaLabel}</div>
                      </div>
                      <div class="ex-status">${status}</div>
                    </div>
                    ${notes}
                  </li>`;
                })
                .join('');
              return `<div class="workout type-${w.type}">
                <div class="workout-title">${esc(w.title)}</div>
                <ul class="ex-list">${exercises}</ul>
              </div>`;
            })
            .join('');
          return `<div class="day">
            <div class="day-label">${DAY_LABELS[day.dayInWeek] || `Day ${day.dayInWeek}`}</div>
            ${workouts}
          </div>`;
        })
        .join('');
      return `<section class="week">
        <h3 class="week-title">Week ${wk}</h3>
        <div class="days">${dayBlocks}</div>
      </section>`;
    })
    .join('');

  return `<section class="plan" id="plan-${plan.id}">
    <h2 class="plan-title">${esc(plan.label)}</h2>
    ${weekSections}
  </section>`;
}

const planTabs = PLANS.map(
  (p) => `<a class="tab" href="#plan-${p.id}">${p.label}</a>`
).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Plan Workouts</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 0; padding: 0; background: #fafafa; color: #111; }
  header { padding: 24px 32px 0; }
  h1 { font-size: 22px; margin: 0 0 16px; font-weight: 600; }
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #e5e5e5; padding-bottom: 0; position: sticky; top: 0; background: #fafafa; padding: 8px 32px 0; z-index: 5; }
  .tab { padding: 8px 14px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: #555; border-bottom: 2px solid transparent; margin-bottom: -1px; font-weight: 500; text-decoration: none; }
  .tab:hover { color: #111; }
  main { padding: 24px 32px 80px; max-width: 1280px; margin: 0 auto; }
  .plan { margin-bottom: 64px; scroll-margin-top: 60px; }
  .plan-title { font-size: 28px; margin: 0 0 24px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #111; }
  .week { margin-bottom: 32px; }
  .week-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 12px; font-weight: 600; }
  .days { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .day { background: white; border: 1px solid #e5e5e5; border-radius: 10px; overflow: hidden; }
  .day-label { padding: 10px 16px; background: #f5f5f5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; font-weight: 600; border-bottom: 1px solid #e5e5e5; }
  .workout { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
  .workout:last-child { border-bottom: none; }
  .workout-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .workout-title::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--type-color, #ccc); }
  .type-lower      { --type-color: #FFB6C1; }
  .type-upper      { --type-color: #C8B6FF; }
  .type-full-body  { --type-color: #B6E0FF; }
  .type-recovery   { --type-color: #B6FFD9; }
  .type-abs        { --type-color: #FFE08A; }
  .type-cardio     { --type-color: #FFA585; }
  .ex-list { list-style: none; padding: 0; margin: 0; }
  .ex-list li { padding: 10px 0; border-top: 1px solid #f0f0f0; }
  .ex-list li:first-child { border-top: none; }
  .ex-list li.ex-mismatch { background: #fff5f5; margin: 0 -16px; padding: 10px 16px; border-radius: 0; }
  .ex-list li.ex-mismatch + li.ex-mismatch { border-top-color: #fad6d6; }
  .ex-row { display: grid; grid-template-columns: 1fr 16px 1fr auto; gap: 10px; align-items: center; }
  .ex-col { min-width: 0; }
  .ex-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 2px; font-weight: 600; }
  .ex-name { color: #111; font-size: 13px; font-weight: 500; word-break: break-word; }
  .ex-meta { color: #888; font-size: 11px; margin-top: 2px; }
  .ex-arrow { color: #bbb; font-size: 14px; text-align: center; }
  .ex-status { align-self: stretch; display: flex; align-items: center; }
  .status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
  .status.match { background: #d8f3dc; color: #1e6b3a; }
  .status.mismatch { background: #ffd6d6; color: #b3261e; }
  .superset { display: inline-block; background: #fff7ce; color: #7a5500; font-size: 10px; padding: 1px 6px; border-radius: 999px; margin-left: 4px; }
  .ex-notes { font-size: 11px; color: #666; margin-top: 6px; font-style: italic; }
  .via { display: inline-block; padding: 0 5px; border-radius: 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; vertical-align: middle; }
  .via-fuzzy { background: #fde2bc; color: #8a4500; }
  .via-abbr { background: #d6e8ff; color: #1a4d99; }
  .via-alias { background: #d8f3dc; color: #1e6b3a; }
  .via-keyword { background: #ede7ff; color: #5b21b6; }
  .via-exact { background: #f0f0f0; color: #555; }
</style>
</head><body>
<header>
  <h1>Plan Workouts</h1>
</header>
<nav class="tabs" id="tabs">${planTabs}</nav>
<main id="content">
  ${PLANS.map(renderPlan).join('')}
</main>
</body></html>`;

const out = path.resolve(__dirname, '..', 'plan-workouts-preview.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`✓ Wrote ${out}`);
for (const p of PLANS) {
  const workoutCount = p.program.days.reduce((acc, d) => acc + d.workouts.length, 0);
  const exerciseCount = p.program.days.reduce(
    (acc, d) => acc + d.workouts.reduce((a, w) => a + w.exercises.length, 0),
    0
  );
  console.log(`  ${p.label}: ${p.program.days.length} days, ${workoutCount} workouts, ${exerciseCount} exercises`);
}
