import { useExerciseStore } from '@/stores/exerciseStore';
import { matchExercisesToDatabase } from '@/services/exerciseMatching';
import type { Exercise } from '@/services/api/exercises';
import aliasesJson from './exerciseAliases.json';

const ALIASES: Record<string, string> = aliasesJson.aliases;

export interface ResolvedProgramExercise {
  originalName: string;
  exerciseId: string | null;
  matchedName?: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  muscleGroup?: string;
  matchConfidence: number;
  inferred: boolean;
}

function stripEquipmentQualifier(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

// Direct alias lookup against exercises.name / display_name (case-insensitive).
// Returns the row if the alias points at a real DB exercise, else null.
function resolveAlias(originalName: string, allExercises: Exercise[]): Exercise | null {
  const key = originalName.toLowerCase().trim();
  const target = ALIASES[key];
  if (!target) return null;
  const t = target.toLowerCase();
  const exact = allExercises.find(
    (e) => e.name.toLowerCase() === t || (e.display_name || '').toLowerCase() === t
  );
  return exact ?? null;
}

export function resolveProgramExercises(names: string[]): ResolvedProgramExercise[] {
  if (names.length === 0) return [];

  const allExercises = useExerciseStore.getState().allExercises;
  if (!allExercises.length) {
    return names.map((name) => ({
      originalName: name,
      exerciseId: null,
      matchConfidence: 0,
      inferred: false,
    }));
  }

  const results = names.map((originalName): ResolvedProgramExercise => {
    // Aliases win over the fuzzy matcher. They encode user-curated decisions
    // (e.g. "Hip Thrusts" → "Hip Thrust (Barbell)" not "(Smith Machine)") that
    // the fuzzy matcher can't infer on its own.
    const aliased = resolveAlias(originalName, allExercises);
    if (aliased) {
      return {
        originalName,
        exerciseId: aliased.id,
        matchedName: aliased.display_name || aliased.name,
        gifUrl: aliased.image_url,
        thumbnailUrl: aliased.thumbnail_url,
        muscleGroup: aliased.muscle_group,
        matchConfidence: 1.0,
        inferred: false,
      };
    }

    const stripped = stripEquipmentQualifier(originalName);
    const candidates =
      stripped && stripped !== originalName
        ? [{ name: originalName }, { name: stripped }]
        : [{ name: originalName }];

    const matched = matchExercisesToDatabase(candidates);
    const best = matched.reduce((acc, m) => (m.confidence > acc.confidence ? m : acc), matched[0]);

    if (!best?.matchedExercise || best.confidence < 0.5) {
      return {
        originalName,
        exerciseId: null,
        matchConfidence: best?.confidence ?? 0,
        inferred: false,
      };
    }

    const inferred = best.confidence < 1.0;
    if (inferred) {
      console.log(
        `[program-match] '${originalName}' → '${best.matchedExercise.name}' (conf ${best.confidence.toFixed(2)})`
      );
    }

    return {
      originalName,
      exerciseId: best.matchedExercise.id,
      matchedName: best.matchedExercise.display_name || best.matchedExercise.name,
      gifUrl: best.matchedExercise.image_url,
      thumbnailUrl: best.matchedExercise.thumbnail_url,
      muscleGroup: best.matchedExercise.muscle_group,
      matchConfidence: best.confidence,
      inferred,
    };
  });

  const exact = results.filter((r) => r.exerciseId && !r.inferred).length;
  const fuzzy = results.filter((r) => r.inferred).length;
  const missing = results.filter((r) => !r.exerciseId).length;
  if (fuzzy || missing) {
    console.log(
      `[program-match] resolved ${results.length}: ${exact} exact, ${fuzzy} inferred, ${missing} unmatched`
    );
    if (missing) {
      const missingNames = results.filter((r) => !r.exerciseId).map((r) => r.originalName);
      console.log('[program-match] unmatched names:', missingNames.join(', '));
    }
  }

  return results;
}
