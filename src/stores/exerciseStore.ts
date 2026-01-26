import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Exercise } from '@/services/api/exercises';

// 30 popular exercises for women - names to match against DB
const POPULAR_EXERCISE_NAMES = [
  // Glutes/Legs (12)
  'barbell hip thrust',
  'glute bridge',
  'romanian deadlift',
  'bulgarian split squat',
  'barbell squat',
  'leg press',
  'walking lunge',
  'cable kickback',
  'sumo deadlift',
  'dumbbell step up',
  'lying leg curl',
  'standing calf raise',
  // Upper Body (10)
  'lat pulldown',
  'seated cable row',
  'dumbbell shoulder press',
  'lateral raise',
  'dumbbell curl',
  'tricep pushdown',
  'push up',
  'dumbbell bench press',
  'face pull',
  'barbell row',
  // Core (8)
  'plank',
  'crunch',
  'leg raise',
  'russian twist',
  'dead bug',
  'mountain climber',
  'cable crunch',
  'bird dog',
];

interface ExerciseStore {
  allExercises: Exercise[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  loadExercises: () => Promise<void>;
  getPopularExercises: () => Exercise[];
  getAllExercisesSorted: () => Exercise[];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  allExercises: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  loadExercises: async () => {
    const { isLoaded, isLoading } = get();

    // Don't refetch if already loaded or loading
    if (isLoaded || isLoading) return;

    set({ isLoading: true, error: null });

    try {
      // Only select fields needed for list view (faster query)
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment, image_url, thumbnail_url')
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      // Filter out exercises without images and add muscle alias
      const exercisesWithImages = (data || [])
        .filter((e) => e.image_url && e.image_url.length > 0)
        .map((e) => ({
          ...e,
          muscle: e.muscle_group,
        }));

      set({
        allExercises: exercisesWithImages,
        isLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load exercises',
        isLoading: false,
      });
    }
  },

  getPopularExercises: () => {
    const { allExercises } = get();

    // Find exercises that match popular names (case-insensitive partial match)
    const popular: Exercise[] = [];

    for (const popularName of POPULAR_EXERCISE_NAMES) {
      const match = allExercises.find(
        (e) =>
          e.name.toLowerCase().includes(popularName.toLowerCase()) ||
          popularName.toLowerCase().includes(e.name.toLowerCase())
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
}));
