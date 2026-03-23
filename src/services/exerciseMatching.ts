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

// Strip trailing 's' for basic plural handling
function depluralize(word: string): string {
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
  return word;
}

// Count how many query words appear in a target string
function countWordOverlap(query: string, target: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).map(depluralize);
  const targetWords = target
    .toLowerCase()
    .split(/[\s(),-]+/)
    .map(depluralize);
  return queryWords.filter((qw) => targetWords.some((tw) => tw.includes(qw) || qw.includes(tw)))
    .length;
}

function findBestMatch(
  aiName: string,
  exercises: Exercise[]
): { exercise: Exercise | null; confidence: number } {
  const normalized = aiName.toLowerCase().trim();
  const depluralized = depluralize(normalized);

  // Strategy 1: Exact match on name or display_name (with plural handling)
  const exact = exercises.find((e) => {
    const eName = e.name.toLowerCase();
    const eDisplay = (e.display_name || '').toLowerCase();
    return (
      eName === normalized ||
      eName === depluralized ||
      depluralize(eName) === depluralized ||
      eDisplay === normalized ||
      eDisplay === depluralized ||
      depluralize(eDisplay) === depluralized
    );
  });
  if (exact) return { exercise: exact, confidence: 1.0 };

  // Strategy 2: Keyword match (with plural handling)
  const keywordMatch = exercises.find((e) =>
    e.keywords?.some((k) => {
      const kLower = k.toLowerCase();
      return (
        kLower === normalized || kLower === depluralized || depluralize(kLower) === depluralized
      );
    })
  );
  if (keywordMatch) return { exercise: keywordMatch, confidence: 0.9 };

  // Strategy 3: Score ALL exercises by word overlap, prefer matches where most query words appear
  const queryWords = normalized.split(/\s+/);
  const queryWordCount = queryWords.length;

  // Score each exercise by how many query words match in name, display_name, and keywords
  const scored = exercises.map((e) => {
    const nameOverlap = countWordOverlap(normalized, e.name);
    const displayOverlap = countWordOverlap(normalized, e.display_name || '');
    const keywordOverlap = Math.max(
      ...(e.keywords || []).map((k) => countWordOverlap(normalized, k)),
      0
    );
    const bestOverlap = Math.max(nameOverlap, displayOverlap, keywordOverlap);
    return { exercise: e, overlap: bestOverlap };
  });

  // Sort by most words matched, then filter to best group
  scored.sort((a, b) => b.overlap - a.overlap);

  if (scored.length > 0 && scored[0].overlap > 0) {
    const bestOverlap = scored[0].overlap;
    // Get all exercises tied for best overlap
    const topCandidates = scored.filter((s) => s.overlap === bestOverlap).map((s) => s.exercise);

    // Among top candidates, use search ranking to pick the best one
    const ranked = searchAndRankExercises(topCandidates, aiName);
    const winner = ranked.length > 0 ? ranked[0] : topCandidates[0];
    const confidence = Math.min(0.95, 0.5 + (bestOverlap / queryWordCount) * 0.45);
    return { exercise: winner, confidence };
  }

  // Strategy 4: Try with abbreviation expansion
  let expanded = normalized;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    expanded = expanded.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }

  if (expanded !== normalized) {
    const expandedScored = exercises.map((e) => {
      const overlap = Math.max(
        countWordOverlap(expanded, e.name),
        countWordOverlap(expanded, e.display_name || '')
      );
      return { exercise: e, overlap };
    });
    expandedScored.sort((a, b) => b.overlap - a.overlap);
    if (expandedScored.length > 0 && expandedScored[0].overlap > 0) {
      return { exercise: expandedScored[0].exercise, confidence: 0.75 };
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
