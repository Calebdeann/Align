import { Exercise, ExerciseTranslation } from '@/services/api/exercises';
import { useExerciseStore } from '@/stores/exerciseStore';
import { getSimplifiedMuscleId } from '@/constants/muscleGroups';

// Bidirectional synonym groups for search.
// Each inner array is a group of terms that should match each other.
const SYNONYM_GROUPS: string[][] = [['plate', 'plated', 'weight', 'weighted']];

// Build a lookup: term → set of synonyms (excluding itself)
const synonymMap = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const term of group) {
    const others = group.filter((t) => t !== term);
    const existing = synonymMap.get(term);
    synonymMap.set(term, existing ? [...existing, ...others] : others);
  }
}

// Returns the query term plus any synonyms for it
function expandWithSynonyms(term: string): string[] {
  const lower = term.toLowerCase();
  const synonyms = synonymMap.get(lower);
  return synonyms ? [lower, ...synonyms] : [lower];
}

/**
 * Scores an exercise based on how well it matches a search query.
 * Higher scores indicate better matches.
 * Checks both English and translated names/keywords (bilingual search).
 *
 * Scoring layers:
 * Layer 1 - Relevance (how well the query matches):
 *   1. Name starts with query (100 points)
 *   2. Exact keyword match (90 points)
 *   3. Keyword starts with query (80 points)
 *   4. Query is a complete word in name (50 points)
 *   5. Query contained in a keyword (40 points)
 *   6. A word in name starts with query (30 points)
 *   7. Query appears anywhere in name (25 points)
 *   8. Query matches muscle group (10 points)
 *
 * Layer 2 - Popularity tiebreaker (0-5 points):
 *   Exercises marked as popular (the ~200 most common exercises) get a
 *   small boost so they surface above obscure variants with equal relevance.
 */
function scoreExercise(
  exercise: Exercise,
  query: string,
  translation?: ExerciseTranslation | null
): number {
  const q = query.toLowerCase().trim();
  const name = exercise.name.toLowerCase();
  const displayName = exercise.display_name?.toLowerCase() || '';
  const muscle = exercise.muscle?.toLowerCase() || '';
  const keywords = exercise.keywords || [];

  let score = 0;

  // Keyword matching: take the BEST match across all keywords (not cumulative)
  let bestKeywordScore = 0;
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    if (kw === q) {
      bestKeywordScore = Math.max(bestKeywordScore, 90);
    } else if (kw.startsWith(q)) {
      bestKeywordScore = Math.max(bestKeywordScore, 80);
    } else if (kw.includes(q)) {
      bestKeywordScore = Math.max(bestKeywordScore, 40);
    }
  }

  // Translated keyword matching (same approach, best match wins)
  if (translation?.keywords) {
    for (const keyword of translation.keywords) {
      const kw = keyword.toLowerCase();
      if (kw === q) {
        bestKeywordScore = Math.max(bestKeywordScore, 90);
      } else if (kw.startsWith(q)) {
        bestKeywordScore = Math.max(bestKeywordScore, 80);
      } else if (kw.includes(q)) {
        bestKeywordScore = Math.max(bestKeywordScore, 40);
      }
    }
  }
  score += bestKeywordScore;

  // Name matching (checks English name, display_name, and translated names)
  const tName = translation?.name?.toLowerCase() || '';
  const tDisplayName = translation?.display_name?.toLowerCase() || '';

  if (
    name.startsWith(q) ||
    displayName.startsWith(q) ||
    tName.startsWith(q) ||
    tDisplayName.startsWith(q)
  ) {
    score += 100;
  }

  // Strip surrounding punctuation so "(pec" matches "pec" and "deck)" matches "deck"
  const strip = (w: string) => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

  const nameWords = name.split(/\s+/).map(strip);
  const displayWords = displayName ? displayName.split(/\s+/).map(strip) : [];
  const tNameWords = tName ? tName.split(/\s+/).map(strip) : [];
  const tDisplayWords = tDisplayName ? tDisplayName.split(/\s+/).map(strip) : [];
  const allWords = [...nameWords, ...displayWords, ...tNameWords, ...tDisplayWords].filter(
    (w) => w.length > 0
  );

  if (allWords.some((word) => word === q)) {
    score += 50;
  }

  if (allWords.some((word) => word.startsWith(q))) {
    score += 30;
  }

  if (
    name.includes(q) ||
    displayName.includes(q) ||
    tName.includes(q) ||
    tDisplayName.includes(q)
  ) {
    score += 25;
  }

  // Match against both raw muscle name and simplified category (e.g., "legs" matches quads/hamstrings/calves)
  const simplifiedMuscle = muscle ? getSimplifiedMuscleId(muscle) : '';
  if (muscle.includes(q) || simplifiedMuscle.includes(q)) {
    score += 10;
  }

  // Layer 2: Popularity tiebreaker - popular exercises rank above obscure ones
  if (score > 0 && exercise.popularity) {
    score += Math.min(exercise.popularity, 5);
  }

  return score;
}

/**
 * Searches and ranks exercises based on relevance to the query.
 * Returns exercises sorted by score (highest first).
 * Scores against both English and translated names/keywords.
 *
 * Multi-word queries are split into individual terms. Each term is scored
 * independently, and exercises matching more terms always rank higher.
 * e.g. "bench incline" matches "Incline Bench Press" (2 words) above "Incline Curl" (1 word).
 *
 * If no query is provided, returns the original array unchanged.
 */
export function searchAndRankExercises(exercises: Exercise[], query: string): Exercise[] {
  const trimmedQuery = query.trim();

  // No query = return all exercises (maintain original order)
  if (!trimmedQuery) {
    return exercises;
  }

  // Get current translations for bilingual search
  const translations = useExerciseStore.getState().translations;

  // Split query into individual words (filter out empty strings from extra spaces)
  const queryWords = trimmedQuery.split(/\s+/).filter((w) => w.length > 0);

  return exercises
    .map((exercise) => {
      const translation = translations.get(exercise.id);

      if (queryWords.length === 1) {
        // Single word: score original + synonyms, take best
        const variants = expandWithSynonyms(trimmedQuery);
        let best = 0;
        for (const variant of variants) {
          best = Math.max(best, scoreExercise(exercise, variant, translation));
        }
        return { exercise, score: best };
      }

      // Multi-word: score each word independently, expanding synonyms
      let matchedWords = 0;
      let totalScore = 0;
      for (const word of queryWords) {
        const variants = expandWithSynonyms(word);
        let bestWordScore = 0;
        for (const variant of variants) {
          bestWordScore = Math.max(bestWordScore, scoreExercise(exercise, variant, translation));
        }
        if (bestWordScore > 0) {
          matchedWords++;
          totalScore += bestWordScore;
        }
      }

      // Exercises matching more words always rank above those matching fewer
      const score = matchedWords > 0 ? matchedWords * 1000 + totalScore : 0;
      return { exercise, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Tie-breaker: popularity descending, then alphabetical by display name
      const popA = a.exercise.popularity || 0;
      const popB = b.exercise.popularity || 0;
      if (popB !== popA) {
        return popB - popA;
      }
      const nameA = a.exercise.display_name || a.exercise.name;
      const nameB = b.exercise.display_name || b.exercise.name;
      return nameA.localeCompare(nameB);
    })
    .map((result) => result.exercise);
}
