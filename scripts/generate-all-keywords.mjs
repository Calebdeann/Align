/**
 * Generate keywords and display_name for ALL exercises in Supabase.
 *
 * This script auto-generates search keywords for every exercise and
 * cleans up display names for obscure/jargon-heavy exercises. It merges
 * with (never overwrites) the 201 hand-curated entries from populate-exercise-names.mjs.
 *
 * Usage:
 *   node scripts/generate-all-keywords.mjs --stats     # Summary counts
 *   node scripts/generate-all-keywords.mjs --preview   # Generate HTML review page
 *   node scripts/generate-all-keywords.mjs --apply     # Push changes to Supabase
 */

import fs from 'fs';
import path from 'path';

// ---------- Config ----------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as environment variable.');
  process.exit(1);
}

// ---------- Fetch all exercises from Supabase ----------
async function fetchAllExercises() {
  const all = [];
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,display_name,muscle_group,equipment,keywords&order=name&offset=${offset}&limit=${batchSize}`;
    const resp = await fetch(url, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${await resp.text()}`);
    const data = await resp.json();
    all.push(...data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return all;
}

// ---------- Equipment abbreviation mappings ----------
const EQUIPMENT_ABBREVS = {
  'dumbbell': ['db'],
  'barbell': ['bb'],
  'ez barbell': ['ez bar', 'ez'],
  'kettlebell': ['kb'],
  'smith machine': ['smith'],
  'exercise ball': ['stability ball', 'swiss ball'],
  'medicine ball': ['med ball'],
  'bosu ball': ['bosu'],
  'trap bar': ['hex bar'],
};

// Equipment prefixes to strip from names (longest first)
const EQUIPMENT_PREFIXES = [
  'smith machine', 'leverage machine', 'sled machine', 'olympic barbell',
  'ez barbell', 'trap bar', 'exercise ball', 'medicine ball', 'bosu ball',
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'band', 'weighted', 'assisted', 'roller',
];

// ---------- Jargon → common name mappings ----------
const JARGON_REPLACEMENTS = [
  { pattern: /^lever\b/i, replacement: 'machine', keywords: ['machine'] },
  { pattern: /^sled\b/i, replacement: 'machine', keywords: ['machine'] },
  { pattern: /\bfemoral\b/i, replacement: 'hamstring', keywords: ['hamstring curl', 'leg curl', 'hamstring'] },
  { pattern: /\bpallof\b/i, replacement: null, keywords: ['core rotation', 'anti rotation', 'pallof press'] },
  { pattern: /\bsupine\b/i, replacement: 'lying', keywords: ['lying', 'face up'] },
  { pattern: /\bprone\b/i, replacement: 'face down', keywords: ['face down', 'lying'] },
  { pattern: /\bpectoralis\b/i, replacement: 'chest', keywords: ['chest'] },
  { pattern: /\bpectoral\b/i, replacement: 'chest', keywords: ['chest'] },
  { pattern: /\bgluteus\b/i, replacement: 'glute', keywords: ['glute'] },
  { pattern: /\bpiriformis\b/i, replacement: 'glute', keywords: ['glute', 'hip'] },
  { pattern: /\brectus femoris\b/i, replacement: 'quad', keywords: ['quad', 'hip flexor'] },
  { pattern: /\brollout\b/i, replacement: null, keywords: ['ab wheel', 'ab rollout'] },
  { pattern: /\brollerout\b/i, replacement: null, keywords: ['ab wheel', 'ab rollout'] },
];

// ---------- Compound hyphen variants ----------
const HYPHEN_VARIANTS = {
  'push-up': ['pushup', 'push up', 'push ups', 'pushups'],
  'pull-up': ['pullup', 'pull up', 'pull ups', 'pullups'],
  'sit-up': ['situp', 'sit up', 'sit ups', 'situps'],
  'step-up': ['stepup', 'step up', 'step ups', 'stepups'],
  'chin-up': ['chinup', 'chin up', 'chin ups', 'chinups'],
};

// ---------- Exercise-specific synonym rules ----------
const SYNONYM_RULES = [
  { match: /bridge/i, context: /barbell|hip/i, keywords: ['hip thrust', 'glute bridge'] },
  { match: /pulldown|pull-down|pull down/i, context: /lat|lateral/i, keywords: ['lat pulldown', 'pull down', 'lat pull down', 'lats', 'back', 'lat'] },
  { match: /pulldown|pull-down|pull down/i, context: null, keywords: ['pull down', 'pulldown'] },
  { match: /fly\b|flye/i, context: null, keywords: ['fly', 'flye', 'flyes'] },
  { match: /close[- ]?grip/i, context: null, keywords: ['close grip', 'narrow grip'] },
  { match: /wide[- ]?grip/i, context: null, keywords: ['wide grip'] },
  { match: /skull\s*crush/i, context: null, keywords: ['skull crusher', 'skullcrusher', 'lying tricep extension'] },
  { match: /lateral raise|side raise/i, context: null, keywords: ['lateral raise', 'side raise'] },
  { match: /front raise/i, context: null, keywords: ['front raise', 'front delt raise'] },
  { match: /rear delt/i, context: null, keywords: ['rear delt', 'reverse fly', 'posterior deltoid'] },
  { match: /face pull/i, context: null, keywords: ['face pull', 'face pulls', 'rear delt pull'] },
  { match: /kickback/i, context: /tricep|arm/i, keywords: ['tricep kickback', 'kickback'] },
  { match: /kickback/i, context: /glute|hip|cable/i, keywords: ['glute kickback', 'cable kickback', 'kickback'] },
  { match: /hip thrust/i, context: null, keywords: ['hip thrust', 'glute bridge', 'hip extension'] },
  { match: /deadlift/i, context: /romanian|rdl|stiff/i, keywords: ['rdl', 'romanian deadlift', 'stiff leg deadlift'] },
  { match: /deadlift/i, context: /sumo/i, keywords: ['sumo deadlift', 'wide stance deadlift'] },
  { match: /squat/i, context: /goblet/i, keywords: ['goblet squat', 'db squat', 'dumbbell squat'] },
  { match: /squat/i, context: /front/i, keywords: ['front squat'] },
  { match: /squat/i, context: /hack/i, keywords: ['hack squat'] },
  { match: /squat/i, context: /split/i, keywords: ['split squat', 'lunge'] },
  { match: /squat/i, context: /bulgarian/i, keywords: ['bulgarian split squat', 'rear foot elevated squat', 'bss'] },
  { match: /squat/i, context: /sumo/i, keywords: ['sumo squat', 'wide squat', 'plie squat'] },
  { match: /crunch/i, context: /bicycle|air bike/i, keywords: ['bicycle crunch', 'cycling crunch', 'air bike'] },
  { match: /curl/i, context: /hammer/i, keywords: ['hammer curl', 'neutral grip curl'] },
  { match: /curl/i, context: /preacher/i, keywords: ['preacher curl', 'scott curl'] },
  { match: /curl/i, context: /concentration/i, keywords: ['concentration curl', 'seated curl'] },
  { match: /curl/i, context: /incline/i, keywords: ['incline curl', 'incline bicep curl'] },
  { match: /press/i, context: /bench/i, keywords: ['bench press', 'chest press'] },
  { match: /press/i, context: /shoulder|overhead|military/i, keywords: ['shoulder press', 'overhead press', 'ohp'] },
  { match: /row/i, context: /seated|cable|machine/i, keywords: ['seated row', 'cable row', 'machine row'] },
  { match: /row/i, context: /bent over/i, keywords: ['bent over row', 'barbell row', 'bb row'] },
  { match: /extension/i, context: /tricep/i, keywords: ['tricep extension', 'arm extension'] },
  { match: /extension/i, context: /leg/i, keywords: ['leg extension', 'quad extension'] },
  { match: /extension/i, context: /back|hyper/i, keywords: ['back extension', 'hyperextension'] },
  { match: /leg curl|hamstring curl/i, context: null, keywords: ['leg curl', 'hamstring curl'] },
  { match: /calf raise/i, context: null, keywords: ['calf raise', 'calf press', 'heel raise'] },
  { match: /plank/i, context: null, keywords: ['plank', 'planks', 'core hold'] },
  { match: /lunge/i, context: null, keywords: ['lunge', 'lunges'] },
  { match: /good morning/i, context: null, keywords: ['good morning', 'good mornings', 'hip hinge'] },
  { match: /push[- ]?up|pushup/i, context: null, keywords: ['push up', 'pushup', 'push ups', 'pushups', 'press up'] },
  { match: /pull[- ]?up|pullup|chin[- ]?up|chinup/i, context: null, keywords: ['pull up', 'pullup', 'chin up', 'chinup'] },
  { match: /dip\b|dips\b/i, context: null, keywords: ['dip', 'dips'] },
  { match: /shrug/i, context: null, keywords: ['shrug', 'shrugs', 'trap shrug'] },
  { match: /russian twist/i, context: null, keywords: ['russian twist', 'oblique twist', 'seated twist'] },
  { match: /mountain climber/i, context: null, keywords: ['mountain climber', 'mountain climbers'] },
  { match: /burpee/i, context: null, keywords: ['burpee', 'burpees'] },
  { match: /hip abduction/i, context: null, keywords: ['hip abduction', 'outer thigh', 'abductor'] },
  { match: /hip adduction/i, context: null, keywords: ['hip adduction', 'inner thigh', 'adductor'] },
  { match: /glute bridge/i, context: null, keywords: ['glute bridge', 'bridge', 'hip bridge'] },
  { match: /pullover/i, context: null, keywords: ['pullover', 'lat pullover'] },
  { match: /wrist curl/i, context: null, keywords: ['wrist curl', 'forearm curl'] },
  { match: /leg raise/i, context: null, keywords: ['leg raise', 'leg raises'] },
  { match: /sit[- ]?up|situp/i, context: null, keywords: ['sit up', 'situp', 'sit ups'] },
  { match: /v[- ]?up/i, context: null, keywords: ['v up', 'v ups'] },
  { match: /push[- ]?down|pushdown/i, context: /tricep|cable/i, keywords: ['tricep pushdown', 'cable pushdown', 'pushdown'] },
  { match: /pull[- ]?through/i, context: null, keywords: ['pull through', 'hip hinge'] },
  { match: /nordic/i, context: null, keywords: ['nordic curl', 'nordic hamstring curl'] },
  { match: /rack pull/i, context: null, keywords: ['rack pull', 'block pull', 'rack deadlift'] },
  { match: /reverse hyper/i, context: null, keywords: ['reverse hyper', 'reverse hyperextension'] },
];

// ---------- Muscle group aliases ----------
const MUSCLE_ALIASES = {
  'abductors': ['outer thigh', 'hip abductors'],
  'adductors': ['inner thigh', 'hip adductors'],
  'biceps': ['bicep', 'arms'],
  'triceps': ['tricep', 'arms'],
  'calves': ['calf'],
  'cardiovascular system': ['cardio'],
  'delts': ['deltoids', 'shoulders', 'shoulder'],
  'forearms': ['forearm', 'grip'],
  'glutes': ['glute', 'butt', 'booty'],
  'hamstrings': ['hamstring', 'hams'],
  'lats': ['back', 'lat'],
  'levator scapulae': ['neck', 'upper back'],
  'pectorals': ['chest', 'pec', 'pecs'],
  'quads': ['quadriceps', 'quad', 'thigh'],
  'serratus anterior': ['serratus', 'side chest'],
  'spine': ['lower back', 'erectors'],
  'traps': ['trapezius', 'upper back'],
  'upper back': ['mid back', 'rhomboids'],
  'abs': ['abdominals', 'core', 'stomach'],
};

// ---------- Helper functions ----------
function toTitleCase(text) {
  return text.split(' ').map(w => {
    if (w.startsWith('(') && w.length > 1) {
      return '(' + w.charAt(1).toUpperCase() + w.slice(2).toLowerCase();
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function stripEquipmentPrefix(name) {
  const lower = name.toLowerCase().trim();
  for (const prefix of EQUIPMENT_PREFIXES) {
    if (lower.startsWith(prefix + ' ')) {
      return { stripped: name.trim().substring(prefix.length).trim(), equipment: prefix };
    }
  }
  return { stripped: name.trim(), equipment: null };
}

// ---------- Auto-generate display_name for ALL exercises ----------
function generateDisplayName(exercise) {
  let name = exercise.name;
  if (!name) return null;

  let displayName = name;

  // Strip "(female)" tags
  displayName = displayName.replace(/\s*\(female\)\s*/gi, ' ');

  // Strip camera angle tags: "(back pov)", "(side pov)", etc
  displayName = displayName.replace(/\s*\([^)]*pov\)\s*/gi, ' ');

  // Strip version suffixes: "v. 2", "v. 3", "v.2"
  displayName = displayName.replace(/\s*v\.\s*\d+\s*/gi, ' ');

  // Strip verbose parenthetical descriptions (>15 chars inside parens)
  displayName = displayName.replace(/\s*\([^)]{15,}\)\s*/g, ' ');

  // Replace anatomical jargon with common names
  // Note: use word boundaries carefully to avoid merging words
  displayName = displayName.replace(/\bfemoral\b/gi, 'hamstring');
  displayName = displayName.replace(/\bpectoralis(\s+(major|minor))?\b/gi, 'chest');
  displayName = displayName.replace(/\bpectoral\b/gi, 'chest');
  displayName = displayName.replace(/\bgluteus(\s+(maximus|medius|minimus))?\b/gi, 'glute');
  displayName = displayName.replace(/\bpiriformis\b/gi, 'glute');
  displayName = displayName.replace(/\brectus femoris\b/gi, 'quad');
  displayName = displayName.replace(/\brectus abdominis\b/gi, 'abs');
  displayName = displayName.replace(/\btensor fasciae latae\b/gi, 'hip');
  displayName = displayName.replace(/\bobturator\b/gi, 'hip');
  displayName = displayName.replace(/\blatissimus(\s+dorsi)?\b/gi, 'lat');
  displayName = displayName.replace(/\bgastrocnemius\b/gi, 'calf');
  displayName = displayName.replace(/\bsoleus\b/gi, 'calf');
  displayName = displayName.replace(/\bgracilis\b/gi, 'inner thigh');
  displayName = displayName.replace(/\brhomboid\w*\b/gi, 'upper back');
  displayName = displayName.replace(/\bbrachialis\b/gi, 'arm');
  displayName = displayName.replace(/\binfrasp\w*\b/gi, 'rotator cuff');
  displayName = displayName.replace(/\bsupraspinatus\b/gi, 'rotator cuff');
  displayName = displayName.replace(/\bserratus(\s+anterior)?\b/gi, 'serratus');
  displayName = displayName.replace(/\bteres(\s+(major|minor))?\b/gi, 'upper back');

  // Replace "lever"/"sled" with "machine" only at the start of the name
  // (equipment prefix position). Avoids breaking gymnastics terms like "back lever".
  displayName = displayName.replace(/^lever\b/gi, 'machine');
  displayName = displayName.replace(/^sled\b/gi, 'machine');

  // Replace "supine" with "Lying"
  displayName = displayName.replace(/\bsupine\b/gi, 'lying');
  // Replace "prone" with "Face Down"
  displayName = displayName.replace(/\bprone\b/gi, 'face down');

  // Strip "full range of motion"
  displayName = displayName.replace(/\bfull range of motion\b/gi, '');

  // Strip "on exercise ball" / "on ball" → will be in equipment
  displayName = displayName.replace(/\bon\s+(exercise\s+)?ball\b/gi, '');

  // Strip "with rope/towel/stability ball/band" filler
  displayName = displayName.replace(/\bwith\s+(rope|towel|stability\s+ball|stability|band)\b/gi, '');

  // Clean up empty parentheses, trailing dashes, and excessive whitespace
  displayName = displayName.replace(/\(\s*\)/g, '');
  displayName = displayName.replace(/\s*-\s*$/g, '');
  displayName = displayName.replace(/\s+/g, ' ').trim();

  // Remove duplicate adjacent words (e.g., "glute and glute" → "glute")
  displayName = displayName.replace(/\b(\w+)\s+and\s+\1\b/gi, '$1');
  displayName = displayName.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // Now apply equipment prefix → parentheses formatting
  const lower = displayName.toLowerCase();
  for (const prefix of EQUIPMENT_PREFIXES) {
    if (lower.startsWith(prefix + ' ')) {
      const rest = displayName.substring(prefix.length).trim();
      displayName = rest + ' (' + prefix + ')';
      break;
    }
  }

  // Title case the result
  displayName = toTitleCase(displayName);

  // If it's basically the same as the original (just case change), skip it
  if (displayName.toLowerCase().trim() === toTitleCase(name).toLowerCase().trim()) {
    return null;
  }

  return displayName;
}

// ---------- Auto-generate keywords for an exercise ----------
function generateKeywords(exercise) {
  const name = exercise.name || '';
  const lower = name.toLowerCase().trim();
  const muscleGroup = (exercise.muscle_group || '').toLowerCase().trim();
  const keywords = new Set();

  // 1. Stripped name without equipment prefix
  const { stripped, equipment } = stripEquipmentPrefix(name);
  if (equipment && stripped.length > 2) {
    keywords.add(stripped.toLowerCase());
  }

  // 2. Equipment abbreviations
  if (equipment) {
    const abbrevs = EQUIPMENT_ABBREVS[equipment];
    if (abbrevs) {
      for (const abbrev of abbrevs) {
        // Add "abbrev + stripped name" (e.g., "db bench press")
        if (stripped.length > 2) {
          keywords.add(abbrev + ' ' + stripped.toLowerCase());
        }
        // Add just the abbreviation as well
        keywords.add(abbrev);
      }
    }
  }

  // 3. Hyphen variants
  for (const [hyphenated, variants] of Object.entries(HYPHEN_VARIANTS)) {
    if (lower.includes(hyphenated) || lower.includes(hyphenated.replace(/-/g, ' ')) || lower.includes(hyphenated.replace(/-/g, ''))) {
      for (const v of variants) {
        keywords.add(v);
      }
    }
  }

  // 4. Jargon keywords
  for (const { pattern, keywords: jargonKws } of JARGON_REPLACEMENTS) {
    if (pattern.test(lower)) {
      for (const kw of jargonKws) {
        keywords.add(kw);
      }
    }
  }

  // 5. Exercise-specific synonym rules
  for (const rule of SYNONYM_RULES) {
    if (rule.match.test(lower)) {
      if (!rule.context || rule.context.test(lower)) {
        for (const kw of rule.keywords) {
          keywords.add(kw);
        }
      }
    }
  }

  // 6. Muscle group and its aliases
  if (muscleGroup) {
    keywords.add(muscleGroup);
    const aliases = MUSCLE_ALIASES[muscleGroup];
    if (aliases) {
      for (const alias of aliases) {
        keywords.add(alias);
      }
    }
  }

  // 7. The full name itself as a keyword (so searching the original always works)
  keywords.add(lower);

  // 8. Equipment name as keyword
  if (equipment) {
    keywords.add(equipment);
  }

  // Remove any empty/short keywords
  const result = [...keywords].filter(k => k && k.length >= 2);

  return result;
}

// ---------- Main logic ----------
async function main() {
  const mode = process.argv[2];

  if (!mode || !['--stats', '--preview', '--apply'].includes(mode)) {
    console.log('Usage:');
    console.log('  node scripts/generate-all-keywords.mjs --stats     # Summary counts');
    console.log('  node scripts/generate-all-keywords.mjs --preview   # Generate HTML review');
    console.log('  node scripts/generate-all-keywords.mjs --apply     # Push to Supabase');
    process.exit(0);
  }

  console.log('Fetching all exercises from Supabase...');
  const exercises = await fetchAllExercises();
  console.log(`Fetched ${exercises.length} exercises.\n`);

  // Process each exercise
  const results = [];
  let newDisplayNames = 0;
  let newKeywords = 0;
  let mergedKeywords = 0;
  let unchangedCount = 0;

  for (const exercise of exercises) {
    const hasExistingDisplayName = !!exercise.display_name;
    const hasExistingKeywords = exercise.keywords && exercise.keywords.length > 0;

    // Generate auto display_name
    const autoDisplayName = generateDisplayName(exercise);

    // Generate auto keywords
    const autoKeywords = generateKeywords(exercise);

    // Merge logic: hand-curated always wins
    let finalDisplayName = exercise.display_name || autoDisplayName || null;
    let finalKeywords = [];

    if (hasExistingKeywords) {
      // Merge: existing hand-curated + auto-generated, no duplicates
      const existing = new Set(exercise.keywords.map(k => k.toLowerCase()));
      finalKeywords = [...exercise.keywords];
      for (const kw of autoKeywords) {
        if (!existing.has(kw.toLowerCase())) {
          finalKeywords.push(kw);
          existing.add(kw.toLowerCase());
        }
      }
      if (finalKeywords.length > exercise.keywords.length) {
        mergedKeywords++;
      }
    } else {
      finalKeywords = autoKeywords;
      if (finalKeywords.length > 0) newKeywords++;
    }

    // Check if display_name is new
    if (!hasExistingDisplayName && finalDisplayName) {
      newDisplayNames++;
    }

    // Did anything change?
    const displayNameChanged = finalDisplayName !== exercise.display_name;
    const keywordsChanged = !hasExistingKeywords || finalKeywords.length !== exercise.keywords.length;

    if (!displayNameChanged && !keywordsChanged) {
      unchangedCount++;
    }

    results.push({
      id: exercise.id,
      exercise_db_id: exercise.exercise_db_id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      originalDisplayName: exercise.display_name,
      originalKeywords: exercise.keywords || [],
      finalDisplayName,
      finalKeywords,
      displayNameChanged,
      keywordsChanged,
      isHandCurated: hasExistingDisplayName,
      isAutoNamed: !hasExistingDisplayName && !!finalDisplayName,
    });
  }

  const changedResults = results.filter(r => r.displayNameChanged || r.keywordsChanged);

  // ---------- --stats mode ----------
  if (mode === '--stats') {
    console.log('=== EXERCISE KEYWORD GENERATION STATS ===\n');
    console.log(`Total exercises:                ${exercises.length}`);
    console.log(`Already have display_name:      ${results.filter(r => r.isHandCurated).length} (hand-curated)`);
    console.log(`New auto display_name:          ${newDisplayNames}`);
    console.log(`Already had keywords:           ${results.filter(r => r.originalKeywords.length > 0).length}`);
    console.log(`New keywords (from scratch):    ${newKeywords}`);
    console.log(`Merged keywords (added to existing): ${mergedKeywords}`);
    console.log(`Unchanged:                      ${unchangedCount}`);
    console.log(`Total exercises to update:      ${changedResults.length}`);

    // Show avg keywords per exercise
    const avgKw = results.reduce((sum, r) => sum + r.finalKeywords.length, 0) / results.length;
    console.log(`\nAvg keywords per exercise:      ${avgKw.toFixed(1)}`);

    // Show sample of auto display names
    const autoNamed = results.filter(r => r.isAutoNamed);
    if (autoNamed.length > 0) {
      console.log(`\n=== SAMPLE: Auto-generated display names (${autoNamed.length} total) ===\n`);
      const sample = autoNamed.slice(0, 25);
      for (const r of sample) {
        console.log(`  "${r.name}" → "${r.finalDisplayName}"`);
      }
      if (autoNamed.length > 25) console.log(`  ... and ${autoNamed.length - 25} more`);
    }

    // Show sample of keyword generation
    console.log(`\n=== SAMPLE: Auto-generated keywords ===\n`);
    const kwSample = results.filter(r => !r.isHandCurated).slice(0, 15);
    for (const r of kwSample) {
      console.log(`  "${r.name}" → [${r.finalKeywords.slice(0, 6).join(', ')}${r.finalKeywords.length > 6 ? '...' : ''}]`);
    }

    process.exit(0);
  }

  // ---------- --preview mode ----------
  if (mode === '--preview') {
    const outputPath = path.resolve(import.meta.dirname, 'all-keywords-preview.html');

    // Categorize for the HTML page
    const handCurated = results.filter(r => r.isHandCurated);
    const autoNamed = results.filter(r => r.isAutoNamed);
    const keywordsOnly = results.filter(r => !r.isHandCurated && !r.isAutoNamed && r.keywordsChanged);
    const unchanged = results.filter(r => !r.displayNameChanged && !r.keywordsChanged);

    const html = generatePreviewHTML(results, {
      total: exercises.length,
      handCurated: handCurated.length,
      autoNamed: autoNamed.length,
      keywordsOnly: keywordsOnly.length,
      unchanged: unchanged.length,
    });

    fs.writeFileSync(outputPath, html);
    console.log(`Preview written to: ${outputPath}`);
    console.log(`Open in browser to review all ${exercises.length} exercises.`);
    console.log(`\nSummary:`);
    console.log(`  Hand-curated (display_name + keywords): ${handCurated.length}`);
    console.log(`  Auto display_name + keywords:           ${autoNamed.length}`);
    console.log(`  Keywords only (name is fine):            ${keywordsOnly.length}`);
    console.log(`  Unchanged:                               ${unchanged.length}`);
    process.exit(0);
  }

  // ---------- --apply mode ----------
  if (mode === '--apply') {
    console.log(`Applying changes to ${changedResults.length} exercises...\n`);

    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < changedResults.length; i += 10) {
      const batch = changedResults.slice(i, i + 10);

      const promises = batch.map(async (r) => {
        const updateBody = {};
        if (r.finalDisplayName && r.finalDisplayName !== r.originalDisplayName) {
          updateBody.display_name = r.finalDisplayName;
        }
        if (r.finalKeywords.length > 0) {
          updateBody.keywords = r.finalKeywords;
        }

        if (Object.keys(updateBody).length === 0) {
          success++;
          return;
        }

        const url = `${SUPABASE_URL}/rest/v1/exercises?id=eq.${r.id}`;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(updateBody),
        });

        if (!resp.ok) {
          const body = await resp.text();
          errors.push({ name: r.name, id: r.id, status: resp.status, body });
          failed++;
        } else {
          success++;
        }
      });

      await Promise.all(promises);
      process.stdout.write(`  Processed ${Math.min(i + 10, changedResults.length)}/${changedResults.length}\r`);
    }

    console.log(`\n\nDone!`);
    console.log(`  Success: ${success}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Skipped (no changes): ${unchangedCount}`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      for (const err of errors) {
        console.log(`  "${err.name}" (${err.id}): ${err.status} - ${err.body}`);
      }
    }
  }
}

// ---------- HTML Preview Generator ----------
function generatePreviewHTML(results, counts) {
  const exerciseData = results.map(r => ({
    name: r.name,
    muscle: r.muscle_group || '',
    dbId: r.exercise_db_id || '',
    origDisplayName: r.originalDisplayName || '',
    finalDisplayName: r.finalDisplayName || '',
    origKeywords: r.originalKeywords,
    finalKeywords: r.finalKeywords,
    category: r.isHandCurated ? 'hand-curated' : r.isAutoNamed ? 'auto-named' : r.keywordsChanged ? 'keywords-only' : 'unchanged',
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exercise Keywords &amp; Names Preview - All ${counts.total} Exercises</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; }
  h1 { color: #f0f6fc; margin-bottom: 8px; font-size: 24px; }
  .subtitle { color: #8b949e; margin-bottom: 20px; font-size: 14px; }
  .stats-bar { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
  .stat-number { font-size: 24px; font-weight: bold; color: #f0f6fc; }
  .stat-label { font-size: 12px; color: #8b949e; margin-top: 2px; }
  .controls { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  .search-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; color: #c9d1d9; font-size: 14px; width: 300px; }
  .search-box:focus { outline: none; border-color: #947AFF; }
  .filter-btn { background: #21262d; border: 1px solid #30363d; border-radius: 20px; padding: 6px 14px; color: #c9d1d9; cursor: pointer; font-size: 13px; transition: all 0.15s; }
  .filter-btn:hover { border-color: #947AFF; }
  .filter-btn.active { background: #947AFF; border-color: #947AFF; color: #fff; }
  .filter-btn.hand-curated.active { background: #388bfd; border-color: #388bfd; }
  .filter-btn.auto-named.active { background: #a371f7; border-color: #a371f7; }
  .filter-btn.keywords-only.active { background: #3fb950; border-color: #3fb950; }
  .filter-btn.unchanged.active { background: #484f58; border-color: #484f58; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: #161b22; color: #8b949e; padding: 10px 8px; text-align: left; position: sticky; top: 0; border-bottom: 1px solid #30363d; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr { border-bottom: 1px solid #21262d; transition: background 0.1s; }
  tbody tr:hover { background: #161b22; }
  td { padding: 8px; vertical-align: top; }
  .name-cell { color: #f0f6fc; font-weight: 500; max-width: 250px; }
  .display-name { color: #a371f7; font-weight: 500; }
  .display-name.hand-curated { color: #388bfd; }
  .kw-tag { display: inline-block; background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 1px 6px; margin: 2px 2px; font-size: 11px; color: #8b949e; }
  .kw-tag.new { background: #0d2818; border-color: #238636; color: #3fb950; }
  .kw-tag.existing { background: #0c2d6b; border-color: #1f6feb; color: #58a6ff; }
  .category-badge { display: inline-block; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 500; }
  .category-badge.hand-curated { background: #0c2d6b; color: #388bfd; }
  .category-badge.auto-named { background: #2a1a4e; color: #a371f7; }
  .category-badge.keywords-only { background: #0d2818; color: #3fb950; }
  .category-badge.unchanged { background: #21262d; color: #484f58; }
  .muscle-cell { color: #8b949e; font-size: 12px; }
  .result-count { color: #8b949e; font-size: 13px; margin-bottom: 8px; }
  .empty-state { text-align: center; color: #484f58; padding: 40px; font-size: 16px; }
  mark { background: #947AFF33; color: #d2a8ff; border-radius: 2px; padding: 0 2px; }
</style>
</head>
<body>
<h1>Exercise Keywords &amp; Display Names Preview</h1>
<p class="subtitle">All ${counts.total} exercises | Review before applying to Supabase</p>

<div class="stats-bar">
  <div class="stat"><div class="stat-number">${counts.total}</div><div class="stat-label">Total Exercises</div></div>
  <div class="stat"><div class="stat-number" style="color:#388bfd">${counts.handCurated}</div><div class="stat-label">Hand-Curated</div></div>
  <div class="stat"><div class="stat-number" style="color:#a371f7">${counts.autoNamed}</div><div class="stat-label">Auto Display Name</div></div>
  <div class="stat"><div class="stat-number" style="color:#3fb950">${counts.keywordsOnly}</div><div class="stat-label">Keywords Only</div></div>
  <div class="stat"><div class="stat-number" style="color:#484f58">${counts.unchanged}</div><div class="stat-label">Unchanged</div></div>
</div>

<div class="controls">
  <input type="text" class="search-box" id="searchBox" placeholder="Search exercises, keywords, display names...">
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn hand-curated" data-filter="hand-curated">Hand-Curated</button>
  <button class="filter-btn auto-named" data-filter="auto-named">Auto Named</button>
  <button class="filter-btn keywords-only" data-filter="keywords-only">Keywords Only</button>
  <button class="filter-btn unchanged" data-filter="unchanged">Unchanged</button>
</div>

<div class="result-count" id="resultCount"></div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Category</th>
      <th>Original Name</th>
      <th>Display Name</th>
      <th>Muscle</th>
      <th>Keywords</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>

<div class="empty-state" id="emptyState" style="display:none">No exercises match your search.</div>

<script>
const EXERCISES = ${JSON.stringify(exerciseData)};

let currentFilter = 'all';
let currentSearch = '';

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const re = new RegExp('(' + query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
  return escaped.replace(re, '<mark>$1</mark>');
}

function render() {
  const tbody = document.getElementById('tbody');
  const query = currentSearch.toLowerCase();

  const filtered = EXERCISES.filter(e => {
    if (currentFilter !== 'all' && e.category !== currentFilter) return false;
    if (query) {
      const searchable = [e.name, e.finalDisplayName, e.muscle, ...e.finalKeywords].join(' ').toLowerCase();
      return searchable.includes(query);
    }
    return true;
  });

  document.getElementById('resultCount').textContent = filtered.length + ' exercises shown';
  document.getElementById('emptyState').style.display = filtered.length === 0 ? 'block' : 'none';

  // Render in chunks to avoid blocking
  const rows = [];
  for (let i = 0; i < filtered.length; i++) {
    const e = filtered[i];
    const catClass = e.category;

    let kwHtml = '';
    const existingSet = new Set(e.origKeywords.map(k => k.toLowerCase()));
    for (const kw of e.finalKeywords) {
      const isExisting = existingSet.has(kw.toLowerCase());
      const cls = isExisting ? 'existing' : 'new';
      kwHtml += '<span class="kw-tag ' + cls + '">' + highlightText(kw, currentSearch) + '</span>';
    }

    const displayNameClass = e.category === 'hand-curated' ? 'display-name hand-curated' : 'display-name';

    rows.push('<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><span class="category-badge ' + catClass + '">' + catClass.replace('-', ' ') + '</span></td>' +
      '<td class="name-cell">' + highlightText(e.name, currentSearch) + '</td>' +
      '<td class="' + displayNameClass + '">' + (e.finalDisplayName ? highlightText(e.finalDisplayName, currentSearch) : '<span style="color:#484f58">—</span>') + '</td>' +
      '<td class="muscle-cell">' + highlightText(e.muscle, currentSearch) + '</td>' +
      '<td>' + kwHtml + '</td>' +
    '</tr>');
  }

  tbody.innerHTML = rows.join('');
}

// Search
document.getElementById('searchBox').addEventListener('input', (e) => {
  currentSearch = e.target.value.trim();
  render();
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();
</script>
</body>
</html>`;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
