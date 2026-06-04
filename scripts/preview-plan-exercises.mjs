#!/usr/bin/env node
/**
 * Simple cross-reference of every exercise used in every plan.
 *
 * Run:   node scripts/preview-plan-exercises.mjs
 * Out:   ./plan-exercises-preview.html  (open in browser)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const env = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const m = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (m) SERVICE_KEY = m[1].trim();
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env / .env');
  process.exit(1);
}

const PLANS_DIR = path.resolve(import.meta.dirname, '..', 'src', 'data', 'programs');
const PLAN_FILES = [
  ['hourglass',        'Hourglass'],
  ['booty',            'Booty'],
  ['it-girl',          'It Girl'],
  ['muscle-mommy',     'Muscle Mommy'],
  ['pilates-princess', 'Pilates Princess'],
  ['summer-body',      'Summer Body'],
  ['busy-girl',        'Busy Girl'],
  ['home',             'Home'],
];

// Parse plan files for ex('Name', ...) calls
function extractExerciseNames(source) {
  const re = /\bex\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,/g;
  const out = [];
  let m;
  while ((m = re.exec(source)) !== null) out.push(m[2]);
  return out;
}

const perPlan = {};
for (const [planId, label] of PLAN_FILES) {
  const src = fs.readFileSync(path.join(PLANS_DIR, `${planId}.ts`), 'utf8');
  const names = extractExerciseNames(src);
  const counts = new Map();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  perPlan[planId] = { label, names: counts };
}

// Cross-reference: exercise name → which plans
const crossRef = new Map();
for (const [planId, plan] of Object.entries(perPlan)) {
  for (const name of plan.names.keys()) {
    const key = name.toLowerCase().trim();
    if (!crossRef.has(key)) crossRef.set(key, { original: name, plans: new Set() });
    crossRef.get(key).plans.add(planId);
  }
}

// Load aliases + DB rows
const ALIASES = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, 'exerciseAliases.json'), 'utf8')).aliases;
console.log('Fetching exercises from Supabase…');
const resp = await fetch(
  `${SUPABASE_URL}/rest/v1/exercises?select=id,name,display_name,thumbnail_url&order=display_name.asc&limit=2000`,
  { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
);
const allEx = await resp.json();
console.log(`  loaded ${allEx.length} exercises`);

const byName = new Map();
const byDisplayName = new Map();
for (const e of allEx) {
  if (e.name) byName.set(e.name.toLowerCase().trim(), e);
  if (e.display_name) byDisplayName.set(e.display_name.toLowerCase().trim(), e);
}

function resolve(name) {
  const key = name.toLowerCase().trim();
  const aliasTarget = ALIASES[key];
  if (aliasTarget) {
    const t = aliasTarget.toLowerCase().trim();
    return byName.get(t) || byDisplayName.get(t) || null;
  }
  return byDisplayName.get(key) || byName.get(key) || null;
}

// Build rows
const entries = [...crossRef.values()]
  .map((e) => {
    const row = resolve(e.original);
    const planIds = [...e.plans];
    const planCounts = {};
    let totalUses = 0;
    for (const p of planIds) {
      const c = perPlan[p].names.get(e.original) || 0;
      planCounts[p] = c;
      totalUses += c;
    }
    return { name: e.original, planIds, planCounts, totalUses, row };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

const matched = entries.filter((e) => e.row).length;
const unmatched = entries.length - matched;

// Render
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const chip = (planId) =>
  `<span class="chip c-${planId}">${perPlan[planId].label}<span class="chip-n">${perPlan[planId].names.get(entries.find((e) => e.planIds.includes(planId))?.name) ?? ''}</span></span>`;

function renderChips(e) {
  return e.planIds
    .map(
      (p) =>
        `<span class="chip c-${p}" title="${esc(perPlan[p].label)}: ${e.planCounts[p]}× use(s)">${perPlan[p].label} <em>${e.planCounts[p]}</em></span>`
    )
    .join(' ');
}

function renderRow(e) {
  const dbCell = e.row
    ? `<div class="match">
         ${e.row.thumbnail_url ? `<img src="${esc(e.row.thumbnail_url)}" loading="lazy" />` : '<div class="no-thumb"></div>'}
         <div>
           <div class="db-name">${esc(e.row.display_name || e.row.name)}</div>
           <div class="db-id">${e.row.id}</div>
         </div>
       </div>`
    : `<div class="no-match">no DB match</div>`;
  return `<tr data-text="${esc((e.name + ' ' + (e.row?.display_name || '') + ' ' + e.planIds.join(' ')).toLowerCase())}" class="${e.row ? '' : 'unmatched'}">
    <td>
      <div class="ex-name">${esc(e.name)}</div>
      <div class="ex-meta">used ${e.totalUses} time${e.totalUses === 1 ? '' : 's'} in ${e.planIds.length} plan${e.planIds.length === 1 ? '' : 's'}</div>
    </td>
    <td><div class="chips">${renderChips(e)}</div></td>
    <td>${dbCell}</td>
  </tr>`;
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Plan Exercises</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 0; padding: 24px 40px 80px; background: #fafafa; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; font-weight: 600; }
  .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
  .sub strong { color: #111; }
  .controls { position: sticky; top: 0; background: #fafafa; padding: 8px 0 16px; z-index: 5; border-bottom: 1px solid #e5e5e5; margin-bottom: 0; }
  input { width: 100%; padding: 10px 14px; border: 1px solid #d4d4d4; border-radius: 8px; font-size: 14px; }
  input:focus { outline: 2px solid #000; outline-offset: -1px; border-color: transparent; }
  .filter-row { display: flex; gap: 8px; margin-top: 8px; align-items: center; font-size: 13px; color: #666; }
  .filter-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; border-bottom: 1px solid #e5e5e5; font-weight: 600; }
  td { padding: 14px; vertical-align: middle; border-bottom: 1px solid #ececec; font-size: 14px; background: white; }
  tr:hover td { background: #f5f5f5; }
  tr.unmatched td { background: #fff8f8; }
  tr.unmatched:hover td { background: #ffeded; }
  th:first-child, td:first-child { padding-left: 20px; border-left: 1px solid #e5e5e5; }
  th:last-child, td:last-child { padding-right: 20px; border-right: 1px solid #e5e5e5; }
  tr:first-child td { border-top: 1px solid #e5e5e5; }
  tr:first-child td:first-child { border-top-left-radius: 8px; }
  tr:first-child td:last-child { border-top-right-radius: 8px; }
  .ex-name { font-weight: 600; }
  .ex-meta { color: #888; font-size: 12px; margin-top: 3px; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 500; }
  .chip em { font-style: normal; font-weight: 600; opacity: 0.75; font-size: 10px; }
  .c-hourglass { background: #fde8e8; color: #9b2222; }
  .c-booty { background: #ffe8d6; color: #8c4d11; }
  .c-it-girl { background: #ffe3f1; color: #9a1872; }
  .c-muscle-mommy { background: #e0ecff; color: #1d4ed8; }
  .c-pilates-princess { background: #ede7ff; color: #5b21b6; }
  .c-summer-body { background: #fff3b0; color: #7a5500; }
  .c-busy-girl { background: #d8f3dc; color: #1e6b3a; }
  .c-home { background: #ececec; color: #333; }
  .match { display: flex; align-items: center; gap: 10px; }
  .match img, .no-thumb { width: 40px; height: 40px; border-radius: 6px; background: #eee; object-fit: cover; flex-shrink: 0; }
  .db-name { font-weight: 500; }
  .db-id { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; color: #888; margin-top: 2px; user-select: all; }
  .no-match { color: #c0392b; font-weight: 500; }
  .empty { padding: 40px; text-align: center; color: #888; }
</style>
</head><body>
  <h1>Plan Exercises</h1>
  <div class="sub">
    <strong>${entries.length}</strong> exercises across <strong>${PLAN_FILES.length}</strong> plans —
    <strong>${matched}</strong> match DB rows · <strong style="color:#c0392b">${unmatched}</strong> unmatched
  </div>

  <div class="controls">
    <input id="search" type="text" placeholder="Search exercise name, plan, or DB row…" autofocus />
    <div class="filter-row">
      <label><input type="checkbox" id="only-unmatched"> Only show unmatched</label>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30%">Exercise (as written in plan)</th>
        <th style="width:35%">Used in</th>
        <th style="width:35%">Matches DB row</th>
      </tr>
    </thead>
    <tbody id="rows">
      ${entries.map(renderRow).join('')}
    </tbody>
  </table>

<script>
  const search = document.getElementById('search');
  const onlyUnmatched = document.getElementById('only-unmatched');
  const rows = document.querySelectorAll('#rows tr');
  function apply() {
    const q = search.value.trim().toLowerCase();
    rows.forEach((r) => {
      const text = r.getAttribute('data-text') || '';
      let show = true;
      if (q && !text.includes(q)) show = false;
      if (onlyUnmatched.checked && !r.classList.contains('unmatched')) show = false;
      r.style.display = show ? '' : 'none';
    });
  }
  search.addEventListener('input', apply);
  onlyUnmatched.addEventListener('change', apply);
</script>
</body></html>`;

const out = path.resolve(import.meta.dirname, '..', 'plan-exercises-preview.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`\n✓ Wrote ${out}`);
console.log(`  ${entries.length} unique exercises across ${PLAN_FILES.length} plans`);
console.log(`  ${matched} match DB rows, ${unmatched} unmatched`);
