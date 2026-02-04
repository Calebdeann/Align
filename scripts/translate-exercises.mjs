/**
 * Translate exercise names, instructions, and keywords for all supported languages.
 *
 * Uses Claude API to translate exercises in batches, then upserts to the
 * exercise_translations table in Supabase.
 *
 * Usage:
 *   node scripts/translate-exercises.mjs --language es --preview    # Preview translations for Spanish
 *   node scripts/translate-exercises.mjs --language es --apply      # Push Spanish translations to Supabase
 *   node scripts/translate-exercises.mjs --language all --apply     # Translate all 11 languages
 *   node scripts/translate-exercises.mjs --language es --apply --resume  # Resume from checkpoint
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY - API key from console.anthropic.com
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (or in .env file)
 */

import fs from 'fs';
import path from 'path';

// ---------- Config ----------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
    const anthropicMatch = envFile.match(/ANTHROPIC_API_KEY=(.+)/);
    if (anthropicMatch) ANTHROPIC_API_KEY = anthropicMatch[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as environment variable.');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Get one from https://console.anthropic.com');
  process.exit(1);
}

const SUPPORTED_LANGUAGES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese (Simplified)',
  hi: 'Hindi',
  ru: 'Russian',
  ro: 'Romanian',
  az: 'Azerbaijani',
  nl: 'Dutch',
};

const BATCH_SIZE = 20; // Exercises per API call
const MODEL = 'claude-haiku-4-20250414';

// ---------- Checkpoint management ----------
function getCheckpointPath(language) {
  return path.resolve(import.meta.dirname, `.translate-checkpoint-${language}.json`);
}

function loadCheckpoint(language) {
  try {
    const data = fs.readFileSync(getCheckpointPath(language), 'utf8');
    return JSON.parse(data);
  } catch {
    return { completedIds: [], translations: [] };
  }
}

function saveCheckpoint(language, checkpoint) {
  fs.writeFileSync(getCheckpointPath(language), JSON.stringify(checkpoint, null, 2));
}

function clearCheckpoint(language) {
  try {
    fs.unlinkSync(getCheckpointPath(language));
  } catch {}
}

// ---------- Fetch exercises from Supabase ----------
async function fetchAllExercises() {
  const all = [];
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,name,display_name,muscle_group,equipment,instructions_array&order=name&offset=${offset}&limit=${batchSize}`;
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

// ---------- Translate a batch of exercises using Claude ----------
async function translateBatch(exercises, language, languageName) {
  const exerciseData = exercises.map(e => ({
    id: e.id,
    name: e.name,
    display_name: e.display_name || null,
    instructions: e.instructions_array || [],
  }));

  const prompt = `Translate the following exercise data from English to ${languageName}.

For each exercise, provide:
1. "name": The translated exercise name (lowercase, like the original)
2. "display_name": A clean, user-friendly translated name (Title Case). If the exercise name includes equipment in parentheses like "Hip Thrust (Barbell)", keep the parenthetical format but translate appropriately.
3. "instructions": Array of translated instruction steps. Keep them concise and natural. Remove any "Step X:" prefixes.
4. "keywords": 3-8 translated search keywords that a ${languageName}-speaking user might type to find this exercise. Include common synonyms and abbreviations in ${languageName}.

IMPORTANT: This is a women's fitness app. Use feminine forms where the language requires gendered words.
IMPORTANT: Keep exercise names accurate to the actual movement. Do not over-translate technical terms that are commonly used in their English form in ${languageName}-speaking fitness communities (e.g., "deadlift", "squat", "hip thrust" may be kept as-is in some languages if that's how they're commonly known).

Return ONLY a JSON array with objects matching this structure:
[
  {
    "id": "exercise-uuid",
    "name": "translated name",
    "display_name": "Translated Display Name",
    "instructions": ["step 1 translated", "step 2 translated"],
    "keywords": ["keyword1", "keyword2"]
  }
]

Here are the exercises to translate:
${JSON.stringify(exerciseData, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  const text = result.content[0]?.text || '';

  // Extract JSON from the response (handle potential markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Could not parse JSON from response: ${text.substring(0, 200)}...`);
  }

  return JSON.parse(jsonMatch[0]);
}

// ---------- Upsert translations to Supabase ----------
async function upsertTranslations(translations, language) {
  const rows = translations.map(t => ({
    exercise_id: t.id,
    language,
    name: t.name,
    display_name: t.display_name || null,
    instructions_array: t.instructions && t.instructions.length > 0 ? t.instructions : null,
    keywords: t.keywords && t.keywords.length > 0 ? t.keywords : null,
  }));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const url = `${SUPABASE_URL}/rest/v1/exercise_translations`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Upsert failed: ${resp.status} - ${body}`);
    }
  }
}

// ---------- Main ----------
async function main() {
  const args = process.argv.slice(2);
  const langIdx = args.indexOf('--language');
  const language = langIdx !== -1 ? args[langIdx + 1] : null;
  const isPreview = args.includes('--preview');
  const isApply = args.includes('--apply');
  const isResume = args.includes('--resume');

  if (!language || (!isPreview && !isApply)) {
    console.log('Usage:');
    console.log('  node scripts/translate-exercises.mjs --language es --preview');
    console.log('  node scripts/translate-exercises.mjs --language es --apply');
    console.log('  node scripts/translate-exercises.mjs --language all --apply');
    console.log('  node scripts/translate-exercises.mjs --language es --apply --resume');
    console.log('\nSupported languages:', Object.entries(SUPPORTED_LANGUAGES).map(([k, v]) => `${k} (${v})`).join(', '));
    process.exit(0);
  }

  const languages = language === 'all'
    ? Object.keys(SUPPORTED_LANGUAGES)
    : [language];

  for (const lang of languages) {
    if (!SUPPORTED_LANGUAGES[lang]) {
      console.error(`Unsupported language: ${lang}`);
      console.error('Supported:', Object.keys(SUPPORTED_LANGUAGES).join(', '));
      process.exit(1);
    }
  }

  console.log('Fetching all exercises from Supabase...');
  const exercises = await fetchAllExercises();
  console.log(`Fetched ${exercises.length} exercises.\n`);

  for (const lang of languages) {
    const langName = SUPPORTED_LANGUAGES[lang];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Translating to ${langName} (${lang})`);
    console.log(`${'='.repeat(60)}\n`);

    // Load checkpoint if resuming
    let checkpoint = isResume ? loadCheckpoint(lang) : { completedIds: [], translations: [] };
    const completedSet = new Set(checkpoint.completedIds);

    // Filter out already-translated exercises
    const remaining = exercises.filter(e => !completedSet.has(e.id));
    console.log(`  Remaining: ${remaining.length} exercises (${checkpoint.completedIds.length} already done)\n`);

    if (remaining.length === 0) {
      console.log('  All exercises already translated for this language!');
      if (isApply && checkpoint.translations.length > 0) {
        console.log('  Upserting cached translations to Supabase...');
        await upsertTranslations(checkpoint.translations, lang);
        console.log('  Done!');
        clearCheckpoint(lang);
      }
      continue;
    }

    // Process in batches
    const allTranslations = [...checkpoint.translations];
    let batchNum = 0;
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

    for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
      batchNum++;
      const batch = remaining.slice(i, i + BATCH_SIZE);
      const batchExercises = batch.map(e => e.name).join(', ');

      process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} exercises)... `);

      try {
        const translations = await translateBatch(batch, lang, langName);
        allTranslations.push(...translations);

        // Update checkpoint
        for (const e of batch) {
          completedSet.add(e.id);
        }
        checkpoint = {
          completedIds: [...completedSet],
          translations: allTranslations,
        };
        saveCheckpoint(lang, checkpoint);

        console.log(`done (${translations.length} translated)`);

        // Brief pause to avoid rate limiting
        if (i + BATCH_SIZE < remaining.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
        console.log(`  Checkpoint saved. Resume with --resume flag.`);
        process.exit(1);
      }
    }

    console.log(`\n  Total translations: ${allTranslations.length}`);

    if (isPreview) {
      // Show a sample
      console.log(`\n  === SAMPLE TRANSLATIONS (${langName}) ===\n`);
      const sample = allTranslations.slice(0, 10);
      for (const t of sample) {
        const orig = exercises.find(e => e.id === t.id);
        console.log(`  "${orig?.name}" -> "${t.display_name}"`);
        if (t.keywords?.length > 0) {
          console.log(`    Keywords: ${t.keywords.join(', ')}`);
        }
        if (t.instructions?.length > 0) {
          console.log(`    Instructions: ${t.instructions.length} steps`);
        }
        console.log();
      }

      if (allTranslations.length > 10) {
        console.log(`  ... and ${allTranslations.length - 10} more\n`);
      }

      console.log(`  Checkpoint saved. Run with --apply to push to Supabase.`);
    }

    if (isApply) {
      console.log(`\n  Upserting ${allTranslations.length} translations to Supabase...`);
      await upsertTranslations(allTranslations, lang);
      console.log('  Done!');
      clearCheckpoint(lang);
    }
  }

  console.log('\nAll done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
