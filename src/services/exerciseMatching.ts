import { Exercise } from '@/services/api/exercises';
import { useExerciseStore } from '@/stores/exerciseStore';
import { searchAndRankExercises } from '@/utils/exerciseSearch';

// Common gym abbreviations → full names
const ABBREVIATIONS: Record<string, string> = {
  rdl: 'romanian deadlift',
  ohp: 'overhead press',
  bb: 'barbell',
  db: 'dumbbell',
  ez: 'ez bar',
  dl: 'deadlift',
  bp: 'bench press',
  sldl: 'stiff leg deadlift',
  cgbp: 'close grip bench press',
  jm: 'jm press',
  ghr: 'glute ham raise',
  rdls: 'romanian deadlift',
  'hip thrust': 'barbell hip thrust',
};

export interface MatchResult {
  aiName: string;
  sets: number;
  reps: number;
  repsPerSet?: number[];
  weight: string | null;
  notes: string | null;
  matchedExercise: Exercise | null;
  confidence: number;
  matched: boolean;
}

interface AIExercise {
  name: string;
  sets?: number;
  reps?: number;
  repsPerSet?: number[];
  weight?: string;
  notes?: string;
}

/**
 * Takes AI-parsed exercises and fuzzy matches each against the exercise database.
 * Returns match results with confidence scores.
 */
export function matchExercisesToDatabase(aiExercises: AIExercise[]): MatchResult[] {
  const store = useExerciseStore.getState();
  const allExercises = store.allExercises;

  if (!allExercises.length) {
    return aiExercises.map((ex) => ({
      aiName: ex.name,
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      repsPerSet: ex.repsPerSet,
      weight: ex.weight || null,
      notes: ex.notes || null,
      matchedExercise: null,
      confidence: 0,
      matched: false,
    }));
  }

  return aiExercises.map((aiEx) => {
    const match = findBestMatch(aiEx.name, allExercises);
    return {
      aiName: aiEx.name,
      sets: aiEx.sets || 3,
      reps: aiEx.reps || 10,
      repsPerSet: aiEx.repsPerSet,
      weight: aiEx.weight || null,
      notes: aiEx.notes || null,
      matchedExercise: match.exercise,
      confidence: match.confidence,
      matched: match.confidence >= 0.5,
    };
  });
}

function findBestMatch(
  aiName: string,
  exercises: Exercise[]
): { exercise: Exercise | null; confidence: number } {
  const normalized = aiName.toLowerCase().trim();

  // Strategy 1: Exact match on name or display_name
  const exact = exercises.find(
    (e) => e.name.toLowerCase() === normalized || e.display_name?.toLowerCase() === normalized
  );
  if (exact) return { exercise: exact, confidence: 1.0 };

  // Strategy 2: Keyword match
  const keywordMatch = exercises.find((e) =>
    e.keywords?.some((k) => k.toLowerCase() === normalized)
  );
  if (keywordMatch) return { exercise: keywordMatch, confidence: 0.9 };

  // Strategy 3: Use existing search scoring (leverages multi-word scoring)
  const ranked = searchAndRankExercises(exercises, aiName);
  if (ranked.length > 0) {
    const topResult = ranked[0];
    // Heuristic: check how many query words appear in the result name
    const queryWords = normalized.split(/\s+/);
    const nameWords = (topResult.display_name || topResult.name).toLowerCase().split(/\s+/);
    const matchedWords = queryWords.filter((qw) =>
      nameWords.some((nw) => nw.includes(qw) || qw.includes(nw))
    );
    const confidence = Math.min(0.95, 0.5 + (matchedWords.length / queryWords.length) * 0.45);
    return { exercise: topResult, confidence };
  }

  // Strategy 4: Try with abbreviation expansion
  let expanded = normalized;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    expanded = expanded.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }

  if (expanded !== normalized) {
    const expandedRanked = searchAndRankExercises(exercises, expanded);
    if (expandedRanked.length > 0) {
      return { exercise: expandedRanked[0], confidence: 0.75 };
    }
  }

  // Strategy 5: Try individual words (e.g., "squat" from "goblet squat variation")
  const words = normalized.split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    const wordResults = searchAndRankExercises(exercises, word);
    if (wordResults.length > 0) {
      return { exercise: wordResults[0], confidence: 0.4 };
    }
  }

  return { exercise: null, confidence: 0 };
}
