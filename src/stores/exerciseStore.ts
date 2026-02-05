import { create } from 'zustand';
import { Image } from 'expo-image';
import { supabase } from '@/services/supabase';
import { Exercise, ExerciseTranslation, fetchExerciseTranslations } from '@/services/api/exercises';
import { formatExerciseDisplayName, toTitleCase } from '@/utils/textFormatters';

// 25 popular exercises for women (16-30) - names to match against DB
const POPULAR_EXERCISE_NAMES = [
  // Glutes & Legs (13)
  'hip thrust',
  'romanian deadlift',
  'barbell squat',
  'bulgarian split squat',
  'hip abduction',
  'cable kickback',
  'leg press',
  'leg extension',
  'leg curl',
  'walking lunge',
  'glute bridge',
  'sumo deadlift',
  'deadlift',
  // Upper Body (8)
  'lat pulldown',
  'seated row',
  'lateral raise',
  'shoulder press',
  'tricep pushdown',
  'dumbbell curl',
  'face pull',
  'dumbbell bench press',
  // Core (4)
  'plank',
  'cable crunch',
  'leg raise',
  'russian twist',
];

interface ExerciseStore {
  allExercises: Exercise[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Translation state
  translations: Map<string, ExerciseTranslation>;
  translationsLanguage: string | null;

  loadExercises: () => Promise<void>;
  loadTranslations: (language: string) => Promise<void>;
  getPopularExercises: () => Exercise[];
  getAllExercisesSorted: () => Exercise[];

  // Translation helpers
  getTranslatedDisplayName: (exercise: {
    id: string;
    name: string;
    display_name?: string;
    equipment?: string[];
  }) => string;
  getTranslatedInstructions: (exerciseId: string) => string[] | null;
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  allExercises: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  translations: new Map(),
  translationsLanguage: null,

  loadExercises: async () => {
    const { isLoaded, isLoading } = get();

    // Don't refetch if already loaded or loading
    if (isLoaded || isLoading) return;

    set({ isLoading: true, error: null });

    try {
      // Select fields needed for list view + search
      const { data, error } = await supabase
        .from('exercises')
        .select(
          'id, name, display_name, muscle_group, equipment, image_url, thumbnail_url, keywords, popularity'
        )
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      // Add muscle alias for backwards compatibility
      const exercises = (data || []).map((e) => ({
        ...e,
        muscle: e.muscle_group,
      }));

      set({
        allExercises: exercises,
        isLoaded: true,
        isLoading: false,
      });

      // Prefetch first 50 thumbnails in background to warm disk cache
      const thumbnailUrls = exercises
        .slice(0, 50)
        .map((e) => e.thumbnail_url)
        .filter((url): url is string => !!url);
      if (thumbnailUrls.length > 0) {
        Image.prefetch(thumbnailUrls).catch(() => {
          // Silent fail - prefetching is best-effort
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load exercises',
        isLoading: false,
      });
    }
  },

  loadTranslations: async (language: string) => {
    const { translationsLanguage, translations: currentTranslations } = get();

    // Already loaded for this language, or English needs no translations
    if (language === 'en') {
      set({ translations: new Map(), translationsLanguage: 'en' });
      return;
    }
    // Only skip if already loaded AND has data (don't cache empty results from failed fetches)
    if (translationsLanguage === language && currentTranslations.size > 0) return;

    const translations = await fetchExerciseTranslations(language);
    set({ translations, translationsLanguage: language });
  },

  getPopularExercises: () => {
    const { allExercises } = get();

    // Find exercises that match popular names (case-insensitive partial match)
    const popular: Exercise[] = [];

    for (const popularName of POPULAR_EXERCISE_NAMES) {
      const pLower = popularName.toLowerCase();
      const match = allExercises.find(
        (e) =>
          e.name.toLowerCase().includes(pLower) ||
          pLower.includes(e.name.toLowerCase()) ||
          (e.keywords &&
            e.keywords.some(
              (k) => k.toLowerCase().includes(pLower) || pLower.includes(k.toLowerCase())
            ))
      );
      if (match && !popular.some((p) => p.id === match.id)) {
        popular.push(match);
      }
    }

    return popular;
  },

  getAllExercisesSorted: () => {
    const { allExercises } = get();
    // Already sorted by name from Supabase query
    return allExercises;
  },

  getTranslatedDisplayName: (exercise) => {
    const { translations } = get();
    const t = translations.get(exercise.id);

    // Prefer translated display_name, then translated name, then English fallback
    if (t?.display_name) return t.display_name;
    if (t?.name) return toTitleCase(t.name);
    return exercise.display_name || formatExerciseDisplayName(exercise.name, exercise.equipment);
  },

  getTranslatedInstructions: (exerciseId: string) => {
    const { translations } = get();
    return translations.get(exerciseId)?.instructions_array || null;
  },
}));

// Prefetch a single exercise's GIF before navigating to detail view
export function prefetchExerciseGif(exerciseId: string) {
  const ex = useExerciseStore.getState().allExercises.find((e) => e.id === exerciseId);
  if (ex?.image_url) {
    Image.prefetch([ex.image_url]).catch(() => {});
  }
}

/**
 * Gets the translated display name for an exercise.
 * Can be called outside of React components (uses store directly).
 */
export function getExerciseDisplayName(exercise: {
  id: string;
  name: string;
  display_name?: string;
  equipment?: string[];
}): string {
  return useExerciseStore.getState().getTranslatedDisplayName(exercise);
}
