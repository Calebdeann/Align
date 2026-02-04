import { Exercise, ExerciseTranslation } from '@/services/api/exercises';
import { useExerciseStore } from '@/stores/exerciseStore';

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

  // Keyword matching: check English search aliases
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    if (kw === q) {
      score += 90;
    } else if (kw.startsWith(q)) {
      score += 80;
    } else if (kw.includes(q)) {
      score += 40;
    }
  }

  // Translated keyword matching (same weights)
  if (translation?.keywords) {
    for (const keyword of translation.keywords) {
      const kw = keyword.toLowerCase();
      if (kw === q) {
        score += 90;
      } else if (kw.startsWith(q)) {
        score += 80;
      } else if (kw.includes(q)) {
        score += 40;
      }
    }
  }

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

  const nameWords = name.split(/\s+/);
  const displayWords = displayName ? displayName.split(/\s+/) : [];
  const tNameWords = tName ? tName.split(/\s+/) : [];
  const tDisplayWords = tDisplayName ? tDisplayName.split(/\s+/) : [];
  const allWords = [...nameWords, ...displayWords, ...tNameWords, ...tDisplayWords];

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

  if (muscle.includes(q)) {
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

  return exercises
    .map((exercise) => ({
      exercise,
      score: scoreExercise(exercise, trimmedQuery, translations.get(exercise.id)),
    }))
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
