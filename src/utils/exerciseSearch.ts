import { Exercise } from '@/services/api/exercises';

/**
 * Scores an exercise based on how well it matches a search query.
 * Higher scores indicate better matches.
 *
 * Scoring priority:
 * 1. Name starts with query (100 points) - "bench" → "Bench Press"
 * 2. Query is a complete word in name (50 points) - "bench" in "Incline Bench Press"
 * 3. A word in name starts with query (30 points) - "pre" in "Bench Press"
 * 4. Query appears anywhere in name (25 points) - "ench" in "Bench Press"
 * 5. Query matches muscle group (10 points)
 */
function scoreExercise(exercise: Exercise, query: string): number {
  const q = query.toLowerCase().trim();
  const name = exercise.name.toLowerCase();
  const muscle = exercise.muscle?.toLowerCase() || '';

  let score = 0;

  // Highest priority: Name starts with query
  // e.g., "bench" → "Bench Press" gets max score
  if (name.startsWith(q)) {
    score += 100;
  }

  // High priority: Query is a complete word in the name
  // e.g., "bench" in "Incline Bench Press"
  const nameWords = name.split(/\s+/);
  if (nameWords.some((word) => word === q)) {
    score += 50;
  }

  // Medium-high priority: A word in the name starts with the query
  // e.g., "pre" matches "Press" in "Bench Press"
  if (nameWords.some((word) => word.startsWith(q))) {
    score += 30;
  }

  // Medium priority: Query appears anywhere in name
  // e.g., "ench" in "Bench Press"
  if (name.includes(q)) {
    score += 25;
  }

  // Lower priority: Query matches muscle group
  // e.g., "chest" when muscle is "Chest"
  if (muscle.includes(q)) {
    score += 10;
  }

  return score;
}

/**
 * Searches and ranks exercises based on relevance to the query.
 * Returns exercises sorted by score (highest first).
 *
 * If no query is provided, returns the original array unchanged.
 */
export function searchAndRankExercises(exercises: Exercise[], query: string): Exercise[] {
  const trimmedQuery = query.trim();

  // No query = return all exercises (maintain original order)
  if (!trimmedQuery) {
    return exercises;
  }

  return exercises
    .map((exercise) => ({
      exercise,
      score: scoreExercise(exercise, trimmedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Tie-breaker: alphabetical by name
      return a.exercise.name.localeCompare(b.exercise.name);
    })
    .map((result) => result.exercise);
}
