import { colors } from '@/constants/theme';
import { WorkoutTemplate } from './templateStore';

// Unique images for each template, organized by category
const TEMPLATE_IMAGES = {
  // Core (7 unique images from ABS-CORE folder)
  'core-1': require('../../assets/images/ABS-CORE/IMG_4464.jpg'),
  'core-2': require('../../assets/images/ABS-CORE/IMG_4465.jpg'),
  'core-3': require('../../assets/images/ABS-CORE/IMG_4466.jpg'),
  'core-4': require('../../assets/images/ABS-CORE/IMG_4467.jpg'),
  'core-5': require('../../assets/images/ABS-CORE/IMG_4468.jpg'),
  'core-6': require('../../assets/images/ABS-CORE/IMG_4469.jpg'),
  'core-7': require('../../assets/images/ABS-CORE/IMG_4470.jpg'),

  // Glutes (7 unique images from GLUTES folder)
  'glutes-1': require('../../assets/images/GLUTES/IMG_4472.jpg'),
  'glutes-2': require('../../assets/images/GLUTES/IMG_4473.jpg'),
  'glutes-3': require('../../assets/images/GLUTES/IMG_4474.jpg'),
  'glutes-4': require('../../assets/images/GLUTES/IMG_4475.jpg'),
  'glutes-5': require('../../assets/images/GLUTES/IMG_4476.jpg'),
  'glutes-6': require('../../assets/images/GLUTES/IMG_4477.jpg'),
  'glutes-7': require('../../assets/images/GLUTES/IMG_4478.jpg'),

  // Lower Body (7 unique images from LOWER BODY folder)
  'lower-1': require('../../assets/images/LOWER BODY/IMG_4484.jpg'),
  'lower-2': require('../../assets/images/LOWER BODY/IMG_4485.jpg'),
  'lower-3': require('../../assets/images/LOWER BODY/IMG_4486.jpg'),
  'lower-4': require('../../assets/images/LOWER BODY/IMG_4487.jpg'),
  'lower-5': require('../../assets/images/LOWER BODY/IMG_4488.jpg'),
  'lower-6': require('../../assets/images/LOWER BODY/IMG_4489.jpg'),
  'lower-7': require('../../assets/images/LOWER BODY/IMG_4490.jpg'),

  // Pull (7 unique images from BACK-PULL folder)
  'pull-1': require('../../assets/images/BACK-PULL/IMG_4451.jpg'),
  'pull-2': require('../../assets/images/BACK-PULL/IMG_4452.jpg'),
  'pull-3': require('../../assets/images/BACK-PULL/IMG_4454.jpg'),
  'pull-4': require('../../assets/images/BACK-PULL/IMG_4455.jpg'),
  'pull-5': require('../../assets/images/BACK-PULL/IMG_4456.jpg'),
  'pull-6': require('../../assets/images/BACK-PULL/IMG_4457.jpg'),
  'pull-7': require('../../assets/images/BACK-PULL/IMG_4458.jpg'),

  // Push (5 unique images)
  'push-1': require('../../assets/images/UPPER BODY/IMG_4492.jpg'),
  'push-2': require('../../assets/images/UPPER BODY/IMG_4493.jpg'),
  'push-3': require('../../assets/images/UPPER BODY/IMG_4494.jpg'),
  'push-4': require('../../assets/images/BACK-PULL/IMG_4459.jpg'),
  'push-5': require('../../assets/images/BACK-PULL/IMG_4460.jpg'),

  // Upper Body (7 unique images)
  'upper-1': require('../../assets/images/UPPER BODY/IMG_4495.jpg'),
  'upper-2': require('../../assets/images/UPPER BODY/IMG_4496.jpg'),
  'upper-3': require('../../assets/images/UPPER BODY/IMG_4497.jpg'),
  'upper-4': require('../../assets/images/UPPER BODY/IMG_4498.jpg'),
  'upper-5': require('../../assets/images/BACK-PULL/IMG_4461.jpg'),
  'upper-6': require('../../assets/images/BACK-PULL/IMG_4462.jpg'),
  'upper-7': require('../../assets/images/BACK-PULL/IMG_4463.jpg'),

  // Home (7 images from HOME WORKOUT-MAT folder)
  'home-1': require('../../assets/images/HOME WORKOUT-MAT/IMG_4499.jpg'),
  'home-2': require('../../assets/images/HOME WORKOUT-MAT/IMG_4500.jpg'),
  'home-3': require('../../assets/images/HOME WORKOUT-MAT/IMG_4501.jpg'),
  'home-4': require('../../assets/images/HOME WORKOUT-MAT/IMG_4502.jpg'),
  'home-5': require('../../assets/images/HOME WORKOUT-MAT/IMG_4503.jpg'),
  'home-6': require('../../assets/images/HOME WORKOUT-MAT/IMG_4504.jpg'),
  'home-7': require('../../assets/images/HOME WORKOUT-MAT/IMG_4505.jpg'),

  // Cardio (6 images from CARDIO folder)
  'cardio-1': require('../../assets/images/CARDIO/IMG_4506.jpg'),
  'cardio-2': require('../../assets/images/CARDIO/IMG_4507.jpg'),
  'cardio-3': require('../../assets/images/CARDIO/IMG_4508.jpg'),
  'cardio-4': require('../../assets/images/CARDIO/IMG_4509.jpg'),
  'cardio-5': require('../../assets/images/CARDIO/IMG_4510.jpg'),
  'cardio-6': require('../../assets/images/CARDIO/IMG_4511.jpg'),

  // Full Body (4 images from FULL BODY folder)
  'full-1': require('../../assets/images/FULL BODY/IMG_4480.jpg'),
  'full-2': require('../../assets/images/FULL BODY/IMG_4481.jpg'),
  'full-3': require('../../assets/images/FULL BODY/IMG_4482.jpg'),
  'full-4': require('../../assets/images/FULL BODY/IMG_4483.jpg'),

  // Extra (3 images from Gym aesthetic folder)
  'extra-1': require('../../assets/images/Gym aesthetic /IMG_4512.jpg'),
  'extra-2': require('../../assets/images/Gym aesthetic /IMG_4513.jpg'),
  'extra-3': require('../../assets/images/Gym aesthetic /IMG_4514.jpg'),
} as const;

// Helper to create 3 default sets with optional weights
const s3 = (r1: number, r2: number, r3: number, w1?: number, w2?: number, w3?: number) =>
  w1 != null
    ? [
        { setNumber: 1, targetWeight: w1, targetReps: r1 },
        { setNumber: 2, targetWeight: w2 ?? w1, targetReps: r2 },
        { setNumber: 3, targetWeight: w3 ?? w2 ?? w1, targetReps: r3 },
      ]
    : [
        { setNumber: 1, targetReps: r1 },
        { setNumber: 2, targetReps: r2 },
        { setNumber: 3, targetReps: r3 },
      ];

// Hero images for all category cards in the Explore screen
export const CATEGORY_HERO_IMAGES: Record<string, any> = {
  core: require('../../assets/images/AbsMain.jpg'),
  glutes: require('../../assets/images/GlutesMain.jpg'),
  'lower-body': require('../../assets/images/LowerBodyMain.jpg'),
  pull: require('../../assets/images/PullMain.jpg'),
  push: require('../../assets/images/PushMain.jpg'),
  'upper-body': require('../../assets/images/UpperBodyMain.jpg'),
  'at-home': require('../../assets/images/HomeWorkoutMain.jpg'),
  travel: require('../../assets/images/TravelMain.jpg'),
  cardio: require('../../assets/images/CardioMain.jpg'),
  rehab: require('../../assets/images/RehabMain.jpg'),
};

// 60 preset templates across 10 categories
export const PRESET_TEMPLATES: WorkoutTemplate[] = [
  // ===================================================================
  // CORE (8 templates)
  // ===================================================================
  {
    id: 'preset-core-machines',
    name: 'Machines',
    description: 'Machine-based core workout targeting all abdominal muscles',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0175',
        exerciseName: 'Cable Crunches (Kneeling)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0175.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0175.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'pallof-press',
        exerciseName: 'Pallof Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0979.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0979.png',
        muscle: 'Core',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0243',
        exerciseName: 'Cable Rotations',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0243.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0243.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0277',
        exerciseName: 'Decline Sit Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0277.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0277.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-dumbbells',
    name: 'Dumbbells',
    description: 'Dumbbell core workout with carries and stability work',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0407',
        exerciseName: 'Dumbbell Side Bend',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0407.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0407.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 12, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0276',
        exerciseName: 'Isometric Hold with Heel Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'dumbbell-side-bend',
        exerciseName: 'Farmers Carry',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0407.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0407.png',
        muscle: 'Core',
        sets: s3(40, 40, 30, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'dumbbell-side-bend',
        exerciseName: 'Suitcase Carry',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0407.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0407.png',
        muscle: 'Core',
        sets: s3(40, 40, 30, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-mat',
    name: 'Mat',
    description: 'Floor-based core workout with no equipment needed',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 12, 10),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'bird-dog',
        exerciseName: 'Bird Dogs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0872',
        exerciseName: 'Reverse Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0872.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0872.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0620',
        exerciseName: 'Leg Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0620.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0620.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-mix',
    name: 'Mix',
    description: 'Mixed core workout combining hanging, cable and floor exercises',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '0472',
        exerciseName: 'Hanging Knee Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0472.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0472.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0175',
        exerciseName: 'Kneeling Cable Crunch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0175.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0175.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0857',
        exerciseName: 'Ab Roller',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0857.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0857.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-all-muscles',
    name: 'All Muscles',
    description: 'Comprehensive core workout hitting all muscle groups',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0687',
        exerciseName: 'Russian Twists',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0687.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0687.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: 'pallof-press',
        exerciseName: 'Pallof Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0979.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0979.png',
        muscle: 'Core',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0407',
        exerciseName: 'Side Flexion with DB',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0407.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0407.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0274',
        exerciseName: 'Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0274.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0274.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 15, 15),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-hard',
    name: 'Hard Core',
    description: 'Advanced core challenge with progressive leg lifts and planks',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Advanced',
    equipment: 'No Equipment',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs (Alternating)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs (Double Leg)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(10, 8, 8),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0620',
        exerciseName: 'Alternating Leg Lifts',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0620.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0620.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0620',
        exerciseName: 'Double Leg Lifts',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0620.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0620.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(10, 8, 8),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0872',
        exerciseName: 'Leg Lifts into Reverse Crunch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0872.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0872.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(10, 8, 8),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(45, 45, 60),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-slow-burn',
    name: 'Slow Burn',
    description: 'Controlled tempo core workout for deep abdominal burn',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-7'],
    exercises: [
      {
        id: '1',
        exerciseId: '0274',
        exerciseName: 'Table Top Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0274.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0274.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 15, 15),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0972',
        exerciseName: 'Bicycle Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0972.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0972.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0274',
        exerciseName: 'Heel Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0274.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0274.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '3212',
        exerciseName: 'Toe Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3212.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3212.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '3212',
        exerciseName: 'Alternating Toe Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3212.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3212.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-endurance',
    name: 'Endurance',
    description: 'Core endurance workout with planks, twists and mountain climbers',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Advanced',
    equipment: 'No Equipment',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(45, 45, 60),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0464',
        exerciseName: 'Plank Twists',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '1775',
        exerciseName: 'Side Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '1775',
        exerciseName: 'Side Plank Dips',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0630',
        exerciseName: 'Mountain Climbers',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0630.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 25, 25),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: '2135',
        exerciseName: 'Weighted Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2135.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2135.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // GLUTES (9 templates)
  // ===================================================================
  {
    id: 'preset-glutes-1',
    name: 'Thrust & Split',
    description: 'Classic glute workout with hip thrusts, splits and RDLs',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '1409',
        exerciseName: 'Hip Thrusts',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'bulgarian-split-squat',
        exerciseName: 'Bulgarian Split Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-61684449-ed56-43fb-8f57-0744766cf0c9.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0085',
        exerciseName: 'Romanian Deadlift (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0085.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0085.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0860',
        exerciseName: 'Cable Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0860.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0860.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0573',
        exerciseName: 'Back Extensions',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0573.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0573.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-2',
    name: 'Bridge & Hinge',
    description: 'Glute-focused session with bridges, RDLs and abduction work',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '1409',
        exerciseName: 'Hip Thrusts',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'kas-glute-bridge',
        exerciseName: 'Kas Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-6e006513-b111-4011-b9a6-d56034fe8954.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0432',
        exerciseName: 'Stiff Leg Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0432.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0432.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '1760',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0597',
        exerciseName: 'Hip Abduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0597.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0597.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12, 30, 35, 35),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-3',
    name: 'Smith & Cable',
    description: 'Machine and Smith machine focused glute workout',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-3'],
    exercises: [
      {
        id: '1',
        exerciseId: 'machine-hip-thrust',
        exerciseName: 'Hip Thrust Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2286.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-16c3e7ec-5282-49a3-a700-ba750b64d018.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0381',
        exerciseName: 'Reverse Lunge (Smith)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0381.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0044',
        exerciseName: 'Good Mornings',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0044.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0044.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0597',
        exerciseName: 'Hip Abductions',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0597.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0597.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0860',
        exerciseName: 'Cable Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0860.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0860.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-4',
    name: 'Step & Sculpt',
    description: 'Glute workout with bridges, splits, step ups and kickbacks',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-4'],
    exercises: [
      {
        id: '1',
        exerciseId: 'kas-glute-bridge',
        exerciseName: 'Kas Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-6e006513-b111-4011-b9a6-d56034fe8954.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'bulgarian-split-squat',
        exerciseName: 'Bulgarian Split Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-61684449-ed56-43fb-8f57-0744766cf0c9.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0431',
        exerciseName: 'Cable Step Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0860',
        exerciseName: 'Cable Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0860.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0860.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '1760',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-db',
    name: 'Dumbbells',
    description: 'Dumbbell-only glute workout for gym or home',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 40,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '1409',
        exerciseName: 'Single Leg Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: 'bulgarian-split-squat',
        exerciseName: 'Bulgarian Split Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-61684449-ed56-43fb-8f57-0744766cf0c9.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '1757',
        exerciseName: 'Single Leg Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1757.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1757.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '1760',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-barbell',
    name: 'Barbell & Smith',
    description: 'Heavy barbell and Smith machine glute builder',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Advanced',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '1409',
        exerciseName: 'Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 60),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0085',
        exerciseName: 'Romanian Deadlift',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0085.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0085.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 30, 35, 40),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0044',
        exerciseName: 'Good Mornings',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0044.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0044.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0431',
        exerciseName: 'Step Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '3533',
        exerciseName: 'Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 40),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-unilateral',
    name: 'Unilateral',
    description: 'Single-leg focused glute workout for balance and symmetry',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-7'],
    exercises: [
      {
        id: '1',
        exerciseId: '0431',
        exerciseName: 'Dumbbell Step Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '1757',
        exerciseName: 'Single Leg Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1757.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1757.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0544',
        exerciseName: 'Single Leg Box Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0544.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0544.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(8, 8, 6),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0860',
        exerciseName: 'Cable Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0860.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0860.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '1425',
        exerciseName: 'Single Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1425.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1425.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 35),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-bilateral',
    name: 'Bilateral',
    description: 'Two-legged compound glute workout for maximum load',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Advanced',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-1'],
    exercises: [
      {
        id: '1',
        exerciseId: 'machine-hip-thrust',
        exerciseName: 'Hip Thrust Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2286.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-16c3e7ec-5282-49a3-a700-ba750b64d018.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 60),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0085',
        exerciseName: 'Romanian Deadlift (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0085.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0085.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 30, 35, 40),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0597',
        exerciseName: 'Hip Abduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0597.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0597.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '1760',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0573',
        exerciseName: 'Back Extensions',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0573.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0573.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-compound',
    name: 'Compound',
    description: 'Heavy compound lifts for maximum glute activation',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Advanced',
    equipment: 'Gym',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0739',
        exerciseName: 'Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0739.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0739.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 60, 70, 80),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '1409',
        exerciseName: 'Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 60),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0043',
        exerciseName: 'Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0043.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0043.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 40),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0032',
        exerciseName: 'Deadlift',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0032.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0032.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(8, 8, 6, 40, 50, 50),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // LOWER BODY (4 templates)
  // ===================================================================
  {
    id: 'preset-lower-1',
    name: 'Squat & Deadlift',
    description: 'Full lower body workout with squats, deadlifts and isolation',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'lower-body',
    localImage: TEMPLATE_IMAGES['lower-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0043',
        exerciseName: 'Back Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0043.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0043.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 40),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0032',
        exerciseName: 'Deadlift',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0032.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0032.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 8, 8, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0586',
        exerciseName: 'Hamstring Curl (Lying)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0586.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0586.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0585',
        exerciseName: 'Leg Extension',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0585.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0585.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0773',
        exerciseName: 'Calf Raise (Smith)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0773.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0773.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-lower-2',
    name: 'Press & Lunge',
    description: 'Leg press, lunges, step ups and calf work',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'lower-body',
    localImage: TEMPLATE_IMAGES['lower-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0739',
        exerciseName: 'Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0739.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0739.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 60, 70, 80),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0336',
        exerciseName: 'Walking Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '1760',
        exerciseName: 'Goblet Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0431',
        exerciseName: 'Step Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0605',
        exerciseName: 'Calf Raise Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '0432',
        exerciseName: 'Stiff Leg Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0432.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0432.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-lower-3',
    name: 'Hack & Press',
    description: 'Hack squat, single leg press and extensions',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'lower-body',
    localImage: TEMPLATE_IMAGES['lower-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0743',
        exerciseName: 'Hack Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0743.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0743.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 30, 40, 40),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '1425',
        exerciseName: 'Single Leg Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1425.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1425.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0585',
        exerciseName: 'Leg Extensions',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0585.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0585.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0381',
        exerciseName: 'Reverse Lunge (Smith)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0381.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0605',
        exerciseName: 'Single Leg Calf Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-lower-quad-calf',
    name: 'Quad & Calf',
    description: 'Quad and calf focused lower body session',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'lower-body',
    localImage: TEMPLATE_IMAGES['lower-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '1760',
        exerciseName: 'Heel Elevated Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0739',
        exerciseName: 'Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0739.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0739.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 60, 70, 80),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0336',
        exerciseName: 'Lunge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0585',
        exerciseName: 'Knee Extension',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0585.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0585.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0605',
        exerciseName: 'Single Leg Calf Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '0605',
        exerciseName: 'Calf Raise Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // PULL (6 templates)
  // ===================================================================
  {
    id: 'preset-pull-1',
    name: 'Wide Grip & Rows',
    description: 'Wide grip pulldowns, rows, face pulls and curls',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0150',
        exerciseName: 'Wide Grip Lat Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0293',
        exerciseName: 'Dumbbell Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0293.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0293.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'face-pull',
        exerciseName: 'Face Pull',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0233.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-0d404985-3387-415b-a8c2-af89bc83730e.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0447',
        exerciseName: 'EZ Barbell Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0447.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0447.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0313',
        exerciseName: 'Hammer Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0313.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0313.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-2',
    name: 'Pull Ups & Cables',
    description: 'Pull ups, cable rows and bicep work',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0017',
        exerciseName: 'Assisted Pull Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0017.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0017.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0861',
        exerciseName: 'Seated Cable Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0861.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0861.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0238',
        exerciseName: 'Straight Arm Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0238.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0238.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0294',
        exerciseName: 'Dumbbell Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0294.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0294.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0868',
        exerciseName: 'Cable Curls',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0868.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0868.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-3',
    name: 'Close Grip & Rows',
    description: 'Close grip pulldowns, machine row and EZ bar curls',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0150',
        exerciseName: 'Close Grip Lat Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0292',
        exerciseName: 'Dumbbell One Arm Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0292.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 12, 14, 14),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0027',
        exerciseName: 'Barbell Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0027.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0027.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0447',
        exerciseName: 'EZ Bar Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0447.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0447.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0868',
        exerciseName: 'Cable Curls',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0868.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0868.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-4',
    name: 'Pull Ups & Rear Delts',
    description: 'Band assisted pull ups, pulldowns and rear delt work',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '0970',
        exerciseName: 'Band Assisted Pull Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0970.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0970.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0150',
        exerciseName: 'Close Grip Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0293',
        exerciseName: 'Dumbbell Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0293.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0293.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '2292',
        exerciseName: 'Rear Delt Fly',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2292.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0285',
        exerciseName: 'Bicep Curls',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0285.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0285.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-5',
    name: 'Barbell & Preacher',
    description: 'Barbell rows, reverse flies and preacher curls',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '0027',
        exerciseName: 'Bent Over Rows',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0027.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0027.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0861',
        exerciseName: 'Single Arm Cable Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0861.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0861.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '2292',
        exerciseName: 'Reverse Flies',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2292.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0447',
        exerciseName: 'EZ Barbell Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0447.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0447.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0070',
        exerciseName: 'Preacher Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0070.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0070.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-6',
    name: 'Machine & Isolation',
    description: 'Machine rows, lat pulldowns and isolation curls',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '1350',
        exerciseName: 'Machine Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1350.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1350.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0150',
        exerciseName: 'Lat Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'face-pull',
        exerciseName: 'Face Pull',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0233.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-0d404985-3387-415b-a8c2-af89bc83730e.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0070',
        exerciseName: 'Preacher Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0070.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0070.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0868',
        exerciseName: 'Cable Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0868.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0868.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '2292',
        exerciseName: 'Reverse Fly (DB)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2292.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // PUSH (4 templates)
  // ===================================================================
  {
    id: 'preset-push-1',
    name: 'Shoulders & Flies',
    description: 'Shoulder press, raises, chest flies and triceps',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0405',
        exerciseName: 'Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0405.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0405.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0334',
        exerciseName: 'Lateral & Front Raise Superset',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0308',
        exerciseName: 'Chest Flies',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0308.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0308.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0201',
        exerciseName: 'Tricep Cable Push Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0201.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0201.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0333',
        exerciseName: 'Standing Tricep Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0333.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0333.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-push-2',
    name: 'Machine Press & Raises',
    description: 'Machine-based shoulder, lateral raise and tricep work',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0603',
        exerciseName: 'Shoulder Press Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0603.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0603.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0584',
        exerciseName: 'Lever Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0584.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0584.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0310',
        exerciseName: 'Seated Incline Front Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0310.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0310.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0194',
        exerciseName: 'Tricep Cable Overhead',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0194.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0194.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0201',
        exerciseName: 'Tricep Push Down Cable',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0201.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0201.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 15, 18, 18),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-push-3',
    name: 'Press & Cables',
    description: 'Cable lateral raise, overhead press and chest flies',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0178',
        exerciseName: 'Cable Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0178.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0178.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 5, 6, 6),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0091',
        exerciseName: 'Barbell Overhead Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0091.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0091.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0396',
        exerciseName: 'Seated Incline Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0396.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0396.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0308',
        exerciseName: 'Chest Flies',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0308.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0308.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0814',
        exerciseName: 'Tricep Dips',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0814.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0814.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-push-4',
    name: 'Dumbbell Press',
    description: 'DB chest and shoulder press with tricep isolation',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 45,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '0289',
        exerciseName: 'Dumbbell Bench Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0289.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0289.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0405',
        exerciseName: 'Dumbbell Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0405.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0405.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0310',
        exerciseName: 'Front & Lateral Raise Superset',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0310.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0310.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0194',
        exerciseName: 'Overhead Tricep Extension (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0194.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0194.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0201',
        exerciseName: 'Tricep Single Arm Push Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0201.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0201.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // UPPER BODY (4 templates)
  // ===================================================================
  {
    id: 'preset-upper-1',
    name: 'Pull & Press',
    description: 'Balanced upper body with pulldowns, presses and curls',
    tagIds: ['back', 'shoulders', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'upper-body',
    localImage: TEMPLATE_IMAGES['upper-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '0150',
        exerciseName: 'Lat Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0405',
        exerciseName: 'Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0405.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0405.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0178',
        exerciseName: 'Lat Raise (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0178.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0178.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 5, 6, 6),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0861',
        exerciseName: 'Cable Rows',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0861.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0861.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0285',
        exerciseName: 'Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0285.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0285.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '0201',
        exerciseName: 'Tricep Pushdown',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0201.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0201.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 15, 18, 18),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-upper-2',
    name: 'Row & Press',
    description: 'Pull ups, rows, rear delts and shoulder press',
    tagIds: ['back', 'shoulders', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'upper-body',
    localImage: TEMPLATE_IMAGES['upper-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '0970',
        exerciseName: 'Pull Ups (Band Assisted)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0970.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0970.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0027',
        exerciseName: 'Barbell Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0027.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0027.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '2292',
        exerciseName: 'Rear Delt Flies',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2292.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0603',
        exerciseName: 'Shoulder Press Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0603.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0603.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0294',
        exerciseName: 'Dumbbell Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0294.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0294.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '0194',
        exerciseName: 'Tricep Overhead Cable',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0194.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0194.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-upper-machines',
    name: 'Machines',
    description: 'All-machine upper body workout for consistent form',
    tagIds: ['back', 'shoulders', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 45,
    difficulty: 'Beginner',
    equipment: 'Gym',
    category: 'upper-body',
    localImage: TEMPLATE_IMAGES['upper-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0603',
        exerciseName: 'Shoulder Press Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0603.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0603.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0577',
        exerciseName: 'Chest Press Machine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0577.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0577.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '1350',
        exerciseName: 'Machine Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1350.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1350.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0584',
        exerciseName: 'Lever Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0584.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0584.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '1627',
        exerciseName: 'EZ Barbell Preacher Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1627.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1627.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-upper-4',
    name: 'Barbell & Bench',
    description: 'Barbell press, pulldowns, bench and arm supersets',
    tagIds: ['back', 'shoulders', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'upper-body',
    localImage: TEMPLATE_IMAGES['upper-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '0086',
        exerciseName: 'Barbell Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0086.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0086.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '0150',
        exerciseName: 'Close Grip Lat Pull Down',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0150.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0150.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0289',
        exerciseName: 'Dumbbell Bench Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0289.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0289.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '0334',
        exerciseName: 'Lat & Front Raise Superset',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '0313',
        exerciseName: 'Hammer Curls',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0313.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0313.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '0060',
        exerciseName: 'Skull Crushers',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0060.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0060.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // AT-HOME (5 templates)
  // ===================================================================
  {
    id: 'preset-home-hiit',
    name: 'Home HIIT',
    description: 'High-intensity bodyweight workout you can do at home',
    tagIds: ['cardio', 'full-body'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 25,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '1160',
        exerciseName: 'Burpees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1160.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1160.png?v=1770098903217',
        muscle: 'Full Body',
        sets: s3(10, 10, 8),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0514',
        exerciseName: 'Jump Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0514.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0514.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0630',
        exerciseName: 'Mountain Climbers',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0630.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 25, 25),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0662',
        exerciseName: 'Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(15, 12, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '3636',
        exerciseName: 'High Knees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 30, 25),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-lower',
    name: 'Home Lower Body',
    description: 'Bodyweight lower body workout for legs and glutes at home',
    tagIds: ['legs', 'glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Bodyweight Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(20, 15, 15),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '3013',
        exerciseName: 'Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3013.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3013.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0381',
        exerciseName: 'Reverse Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0381.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: 'donkey-kick',
        exerciseName: 'Donkey Kicks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-e4f7a9b0-db8d-476f-a23e-90a0c283f3d2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0624',
        exerciseName: 'Wall Sit',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0624.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0624.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-upper',
    name: 'Home Upper Body',
    description: 'No-equipment upper body workout using bodyweight exercises',
    tagIds: ['chest', 'back', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0662',
        exerciseName: 'Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0283',
        exerciseName: 'Diamond Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0283.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0283.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(10, 8, 8),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: '3662',
        exerciseName: 'Pike Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3662.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 8, 8),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: '0803',
        exerciseName: 'Superman',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0803.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0803.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 12, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0812',
        exerciseName: 'Tricep Dips (Chair)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0812.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0812.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-glutes',
    name: 'Home Glutes',
    description: 'At-home glute workout with no equipment needed',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '3013',
        exerciseName: 'Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3013.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3013.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '3645',
        exerciseName: 'Single-Leg Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3645.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3645.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: 'fire-hydrant',
        exerciseName: 'Fire Hydrants',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-b5ecb214-f351-4d88-8759-11c0e93ca0f2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: 'donkey-kick',
        exerciseName: 'Donkey Kicks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-e4f7a9b0-db8d-476f-a23e-90a0c283f3d2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '3142',
        exerciseName: 'Sumo Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3142.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3142.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-core',
    name: 'Home Core',
    description: 'At-home core workout with zero equipment',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0274',
        exerciseName: 'Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0274.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0274.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 15, 15),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0972',
        exerciseName: 'Bicycle Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0972.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0972.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0620',
        exerciseName: 'Leg Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0620.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0620.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0276',
        exerciseName: 'Dead Bugs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 12, 10),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // TRAVEL (5 templates)
  // ===================================================================
  {
    id: 'preset-travel-quick',
    name: 'Quick Hotel Room',
    description: 'Fast full-body workout for small hotel room spaces',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 15,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    localImage: TEMPLATE_IMAGES['home-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Bodyweight Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0662',
        exerciseName: 'Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '3013',
        exerciseName: 'Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3013.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3013.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-morning',
    name: 'Morning Wake-Up',
    description: 'Quick morning routine to start your day while traveling',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 15,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    localImage: TEMPLATE_IMAGES['home-7'],
    exercises: [
      {
        id: '1',
        exerciseId: '3636',
        exerciseName: 'Jumping Jacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 25, 25),
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: '3533',
        exerciseName: 'Bodyweight Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 20,
      },
      {
        id: '3',
        exerciseId: '0662',
        exerciseName: 'Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 8, 8),
        restTimerSeconds: 20,
      },
      {
        id: '4',
        exerciseId: 'bird-dog',
        exerciseName: 'Bird Dogs',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0276.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0276.png',
        muscle: 'Core',
        sets: s3(10, 10, 8),
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-stretch',
    name: 'Travel Stretch',
    description: 'Mobility and stretching routine for after long travel days',
    tagIds: ['full-body'],
    tagColor: colors.workout.rest,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    localImage: TEMPLATE_IMAGES['full-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '1365',
        exerciseName: 'Cat-Cow Stretch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1365.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1365.png?v=1770098903217',
        muscle: 'Full Body',
        sets: s3(10, 10, 10),
        restTimerSeconds: 15,
      },
      {
        id: '2',
        exerciseId: 'hip-flexor-stretch',
        exerciseName: "World's Greatest Stretch",
        muscle: 'Full Body',
        sets: s3(8, 8, 6),
        restTimerSeconds: 15,
      },
      {
        id: '3',
        exerciseId: 'hip-flexor-stretch',
        exerciseName: 'Hip Flexor Stretch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1564.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1564.png',
        muscle: 'Legs',
        sets: s3(30, 30, 30),
        restTimerSeconds: 15,
      },
      {
        id: '4',
        exerciseId: 'spine-stretch',
        exerciseName: 'Thoracic Rotation',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1365.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1365.png',
        muscle: 'Back',
        sets: s3(10, 10, 8),
        restTimerSeconds: 15,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-circuit',
    name: 'Travel Circuit',
    description: 'Fast-paced bodyweight circuit to maintain fitness on the go',
    tagIds: ['full-body', 'cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 20,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'travel',
    localImage: TEMPLATE_IMAGES['full-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '1160',
        exerciseName: 'Burpees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1160.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1160.png?v=1770098903217',
        muscle: 'Full Body',
        sets: s3(10, 8, 8),
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: '0381',
        exerciseName: 'Reverse Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0381.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 20,
      },
      {
        id: '3',
        exerciseId: '0662',
        exerciseName: 'Push-Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 20,
      },
      {
        id: '4',
        exerciseId: '0630',
        exerciseName: 'Mountain Climbers',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0630.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 20, 16),
        restTimerSeconds: 20,
      },
      {
        id: '5',
        exerciseId: '0803',
        exerciseName: 'Superman Hold',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0803.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0803.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-quick-core',
    name: 'Quick Core',
    description: 'Quick 10-minute core blaster for travel days',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 10,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    localImage: TEMPLATE_IMAGES['full-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '0464',
        exerciseName: 'Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0464.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0464.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 15,
      },
      {
        id: '2',
        exerciseId: '0274',
        exerciseName: 'Crunches',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0274.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0274.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 15,
      },
      {
        id: '3',
        exerciseId: '0620',
        exerciseName: 'Leg Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0620.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0620.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 15,
      },
      {
        id: '4',
        exerciseId: '0687',
        exerciseName: 'Russian Twists',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0687.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0687.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 15,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // CARDIO (5 templates)
  // ===================================================================
  {
    id: 'preset-cardio-hiit',
    name: 'HIIT Cardio',
    description: 'High-intensity interval training for maximum calorie burn',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 25,
    difficulty: 'Advanced',
    equipment: 'No Equipment',
    category: 'cardio',
    localImage: TEMPLATE_IMAGES['cardio-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '1160',
        exerciseName: 'Burpees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1160.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1160.png?v=1770098903217',
        muscle: 'Full Body',
        sets: s3(10, 10, 8),
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: '3636',
        exerciseName: 'High Knees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 30, 25),
        restTimerSeconds: 20,
      },
      {
        id: '3',
        exerciseId: '0514',
        exerciseName: 'Jump Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0514.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0514.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 20,
      },
      {
        id: '4',
        exerciseId: '0630',
        exerciseName: 'Mountain Climbers',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0630.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 25, 25),
        restTimerSeconds: 20,
      },
      {
        id: '5',
        exerciseId: '0514',
        exerciseName: 'Tuck Jumps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0514.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0514.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 8, 8),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-steady',
    name: 'Steady State',
    description: 'Low-intensity steady-state cardio for endurance',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'cardio',
    localImage: TEMPLATE_IMAGES['cardio-2'],
    exercises: [
      {
        id: '1',
        exerciseId: 'run-on-spot',
        exerciseName: 'Marching in Place',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0624.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0624.png',
        muscle: 'Cardio',
        sets: s3(60, 60, 60),
        restTimerSeconds: 15,
      },
      {
        id: '2',
        exerciseId: 'dumbbell-step-up',
        exerciseName: 'Step Touch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png',
        muscle: 'Cardio',
        sets: s3(40, 40, 30),
        restTimerSeconds: 15,
      },
      {
        id: '3',
        exerciseId: '0336',
        exerciseName: 'Walking Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 15,
      },
      {
        id: '4',
        exerciseId: '3636',
        exerciseName: 'Jumping Jacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 25, 25),
        restTimerSeconds: 15,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-tabata',
    name: 'Tabata',
    description: 'Classic Tabata-style intervals for fast results',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 20,
    difficulty: 'Advanced',
    equipment: 'No Equipment',
    category: 'cardio',
    localImage: TEMPLATE_IMAGES['cardio-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '1160',
        exerciseName: 'Burpees (20s on/10s off)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1160.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1160.png?v=1770098903217',
        muscle: 'Full Body',
        sets: s3(8, 8, 8),
        restTimerSeconds: 10,
      },
      {
        id: '2',
        exerciseId: '3636',
        exerciseName: 'High Knees (20s on/10s off)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(20, 20, 20),
        restTimerSeconds: 10,
      },
      {
        id: '3',
        exerciseId: '0514',
        exerciseName: 'Jump Squats (20s on/10s off)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0514.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0514.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 10),
        restTimerSeconds: 10,
      },
      {
        id: '4',
        exerciseId: '0662',
        exerciseName: 'Push-Ups (20s on/10s off)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(8, 8, 8),
        restTimerSeconds: 10,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-dance',
    name: 'Dance Cardio',
    description: 'Fun dance-inspired cardio movements to get your heart pumping',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'cardio',
    localImage: TEMPLATE_IMAGES['cardio-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '3636',
        exerciseName: 'Jumping Jacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 25, 25),
        restTimerSeconds: 15,
      },
      {
        id: '2',
        exerciseId: 'high-knees',
        exerciseName: 'Lateral Shuffles',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png',
        muscle: 'Cardio',
        sets: s3(20, 16, 16),
        restTimerSeconds: 15,
      },
      {
        id: '3',
        exerciseId: '3636',
        exerciseName: 'High Knees',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 25, 25),
        restTimerSeconds: 15,
      },
      {
        id: '4',
        exerciseId: '3361',
        exerciseName: 'Skater Hops',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3361.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3361.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(16, 14, 14),
        restTimerSeconds: 15,
      },
      {
        id: '5',
        exerciseId: 'high-knees',
        exerciseName: 'Grapevine',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3636.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3636.png',
        muscle: 'Cardio',
        sets: s3(20, 16, 16),
        restTimerSeconds: 15,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-jump-rope',
    name: 'Jump Rope',
    description: 'Jump rope cardio workout with bodyweight intervals',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 20,
    difficulty: 'Intermediate',
    equipment: 'Home',
    category: 'cardio',
    localImage: TEMPLATE_IMAGES['cardio-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '2612',
        exerciseName: 'Jump Rope (Basic)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2612.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2612.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(60, 60, 45),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '2612',
        exerciseName: 'Jump Rope (High Knees)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2612.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2612.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(30, 25, 25),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '2612',
        exerciseName: 'Double Unders',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2612.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2612.png?v=1770098903217',
        muscle: 'Cardio',
        sets: s3(15, 12, 10),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: '3533',
        exerciseName: 'Bodyweight Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // ===================================================================
  // NO EQUIPMENT (8 templates)
  // ===================================================================
  {
    id: 'preset-rehab-full-body',
    name: 'Full Body (No Equipment)',
    description: 'Full body workout with zero equipment needed',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['full-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0624',
        exerciseName: 'Wall Sits',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0624.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0624.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(30, 30, 45),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0336',
        exerciseName: 'Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0662',
        exerciseName: 'Push Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0814',
        exerciseName: 'Tricep Dips',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0814.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0814.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: '3239',
        exerciseName: 'Kneeling Plank Tap Shoulders',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3239.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3239.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '7',
        exerciseId: '1775',
        exerciseName: 'Side Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-lower-body',
    name: 'Lower Body (No Equipment)',
    description: 'Bodyweight lower body workout at home',
    tagIds: ['legs', 'glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['full-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '3533',
        exerciseName: 'Pulse Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(20, 15, 15),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0336',
        exerciseName: 'Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0605',
        exerciseName: 'Single Leg Calf Raises',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '3645',
        exerciseName: 'Single Leg Bridges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3645.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3645.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: '1775',
        exerciseName: 'Side Plank',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 30,
      },
      {
        id: '7',
        exerciseId: 'fire-hydrant',
        exerciseName: 'Fire Hydrants',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-b5ecb214-f351-4d88-8759-11c0e93ca0f2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-upper-bw',
    name: 'Upper Body (No Equipment)',
    description: 'Bodyweight upper body workout at home',
    tagIds: ['chest', 'back', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['full-3'],
    exercises: [
      {
        id: '1',
        exerciseId: 'superman',
        exerciseName: 'T Prone',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0803.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0803.png',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'superman',
        exerciseName: 'Y Prone',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0803.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0803.png',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0803',
        exerciseName: 'Superman',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0803.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0803.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0814',
        exerciseName: 'Tricep Dips',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0814.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0814.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0662',
        exerciseName: 'Push Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '6',
        exerciseId: 'dumbbell-lateral-raise',
        exerciseName: 'Arm Circles',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png',
        muscle: 'Shoulders',
        sets: s3(20, 20, 15),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-upper-db',
    name: 'Upper Body (Light DBs)',
    description: 'Light dumbbell upper body workout',
    tagIds: ['chest', 'back', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'Home',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['full-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '0405',
        exerciseName: 'Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0405.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0405.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: '0333',
        exerciseName: 'Tricep Kickback',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0333.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0333.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 3, 4, 4),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: '0310',
        exerciseName: 'Front Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0310.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0310.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 3, 4, 4),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: '0334',
        exerciseName: 'Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 3, 4, 4),
        restTimerSeconds: 45,
      },
      {
        id: '5',
        exerciseId: '0027',
        exerciseName: 'Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0027.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0027.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 5, 6, 6),
        restTimerSeconds: 45,
      },
      {
        id: '6',
        exerciseId: '2292',
        exerciseName: 'Bent Over Reverse Flies',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2292.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2292.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 3, 4, 4),
        restTimerSeconds: 45,
      },
      {
        id: '7',
        exerciseId: '0285',
        exerciseName: 'Bicep Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0285.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0285.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-lower-db',
    name: 'Lower Body (DBs)',
    description: 'Dumbbell lower body workout for home',
    tagIds: ['legs', 'glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'Home',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['extra-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: '1409',
        exerciseName: 'Single Leg Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: '0431',
        exerciseName: 'Step Ups',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 6, 8, 8),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: '0605',
        exerciseName: 'Single Leg Calf Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0586',
        exerciseName: 'Hamstring Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0586.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0586.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-glutes-bands',
    name: 'Glutes (Bands)',
    description: 'Resistance band glute workout at home',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'Home',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['extra-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '3533',
        exerciseName: 'Banded Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '1409',
        exerciseName: 'Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '3006',
        exerciseName: 'Crab Walk',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3006.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3006.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: 'fire-hydrant',
        exerciseName: 'Fire Hydrant',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-b5ecb214-f351-4d88-8759-11c0e93ca0f2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '1775',
        exerciseName: 'Side Plank with Clam',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-glutes-db',
    name: 'Glutes (DBs)',
    description: 'Dumbbell glute workout for home training',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Home',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['extra-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '3142',
        exerciseName: 'Sumo Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3142.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3142.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: '1757',
        exerciseName: 'Single Leg Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1757.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1757.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 6, 8, 8),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: '0336',
        exerciseName: 'Lunges',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 6, 8, 8),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: '1409',
        exerciseName: 'Hip Thrust (Single Leg)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0544',
        exerciseName: 'Cossack Squats',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0544.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0544.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 8, 8),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-rehab-upper-bands',
    name: 'Upper Body (Bands)',
    description: 'Resistance band upper body workout',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'Home',
    category: 'rehab',
    localImage: TEMPLATE_IMAGES['cardio-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '0405',
        exerciseName: 'Shoulder Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0405.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0405.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: '0333',
        exerciseName: 'Tricep Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0333.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0333.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: '0285',
        exerciseName: 'Bicep Curls',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0285.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0285.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '4',
        exerciseId: '0334',
        exerciseName: 'Lateral Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
      {
        id: '5',
        exerciseId: '0289',
        exerciseName: 'Dumbbell Bench Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0289.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0289.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
];
