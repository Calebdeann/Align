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
  'full-body': require('../../assets/images/fullbody.jpg'),
  cardio: require('../../assets/images/CardioMain.jpg'),
  rehab: require('../../assets/images/RehabMain.jpg'),
};

// 50 preset templates across 9 categories
export const PRESET_TEMPLATES: WorkoutTemplate[] = [
  // ===================================================================
  // CORE (5 templates)
  // ===================================================================
  {
    id: 'preset-core-machines',
    name: 'Machines',
    description:
      'Not sure what to do when it comes to core? Try these machine exercises at your gym to build sculpted abs.',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '17538922-0fce-4403-be34-4c69678388ec',
        exerciseName: 'Ab Crunch (Cable)',
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
        exerciseId: '0bf2b34a-88f1-4656-a099-51908069372a',
        exerciseName: 'Pallof Press (Cable)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Core',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '386aa2d2-91da-45a5-9840-4f60f9eafa67',
        exerciseName: 'Rotations (Cable)',
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
        exerciseId: 'b5044dfe-4a54-4cae-8f55-0df653604dc6',
        exerciseName: 'Decline Crunch',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0277.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0277.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'a6377122-2b0f-4925-85bb-ae53ad0c86ad',
        exerciseName: 'Hanging Knee Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1764.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1764.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-weighted',
    name: 'Weighted',
    description: 'Challenge yourself with these weighted exercises to build a strong core.',
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
        exerciseId: '06b042e3-0c9a-47b9-bb8e-283163c2bad1',
        exerciseName: 'Side Bend (Dumbbell)',
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
        exerciseId: '676f4195-49aa-47c6-8a9e-f400511b2251',
        exerciseName: 'Otis Up (Weighted)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0641.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0641.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10, 5, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '3fb3bf08-9c0f-4be9-b5b9-b83edac397df',
        exerciseName: 'Farmers Walk',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2133.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2133.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(40, 40, 30, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '78eef81e-b954-42e6-91bd-cede0c5ca52f',
        exerciseName: 'Plank (Weighted)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2135.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2135.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 45),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'd7220730-2757-44a8-b5a9-11f137e3e527',
        exerciseName: 'Russian Twist (Weighted)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0846.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0846.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16, 5, 8, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-mat',
    name: 'Mat',
    description: 'No equipment? No worries. Try these mat exercises for a slow burn.',
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
        exerciseId: 'b57d3bdc-ef4a-476b-8ee6-4066fc242c49',
        exerciseName: 'Dead Bug',
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
        exerciseId: '9c6c7759-b121-44fe-9272-4a88b3cae0c2',
        exerciseName: 'Heel Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0006.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0006.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: 'a6f8f58a-c212-4600-941d-34356f8d625a',
        exerciseName: 'Reverse Crunch',
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
        exerciseId: '4ab742ec-c1cc-425c-8790-1f90028dc049',
        exerciseName: 'Lying Leg Raise',
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
        exerciseId: '8cceeb36-68ef-4b16-91f1-3c28f23ea12f',
        exerciseName: 'Bicycle Crunch Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0003.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0003.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 16, 16),
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-mix',
    name: 'Mix',
    description: 'This workout targets all the core muscles as well as your endurance.',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-4'],
    exercises: [
      {
        id: '1',
        exerciseId: 'a6377122-2b0f-4925-85bb-ae53ad0c86ad',
        exerciseName: 'Hanging Knee Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1764.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1764.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'e97b7908-e155-4146-9d23-3909126b0748',
        exerciseName: 'Side Plank Hip Adduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 45,
      },
      {
        id: '3',
        exerciseId: 'abdda6ff-db89-44a9-990e-795cff6aa753',
        exerciseName: 'Mountain Climber',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0630.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 25, 25),
        restTimerSeconds: 45,
      },
      {
        id: '4',
        exerciseId: 'c285569c-c46e-4045-870b-7cc58b01451f',
        exerciseName: 'Ab Wheel Rollout',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0857.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0857.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '9c6c7759-b121-44fe-9272-4a88b3cae0c2',
        exerciseName: 'Heel Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0006.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0006.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(20, 15, 15),
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-core-advanced',
    name: 'Advanced',
    description: "Don't do this workout unless you want a 6 pack!",
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Advanced',
    equipment: 'Gym',
    category: 'core',
    localImage: TEMPLATE_IMAGES['core-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '17538922-0fce-4403-be34-4c69678388ec',
        exerciseName: 'Ab Crunch (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0175.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0175.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '5ae06504-e548-43f4-8a64-fa1dc1a55fa5',
        exerciseName: 'Dragon Flag',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Core',
        sets: s3(8, 6, 6),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'f406d02d-e3fb-4dd4-aa79-ca73175b5d35',
        exerciseName: 'Hanging Straight Leg Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0475.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0475.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '78eef81e-b954-42e6-91bd-cede0c5ca52f',
        exerciseName: 'Plank (Weighted)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2135.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2135.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(45, 45, 60),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'e97b7908-e155-4146-9d23-3909126b0748',
        exerciseName: 'Side Plank Hip Adduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1775.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1775.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(30, 30, 30),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // GLUTES (4 templates)
  // ===================================================================
  {
    id: 'preset-glutes-1',
    name: 'Go-to Glute Day',
    description:
      'This glute workout is the holy grail of building juicy glutes, with a mix of compound and isolated movements you will be feeling this one tomorrow.',
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
        exerciseId: '00c9ee8c-a973-4a2d-8eca-91837dfed338',
        exerciseName: 'Hip Thrust (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0058.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0058.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '5d4573e0-a25c-4bf9-991d-8343f01d7217',
        exerciseName: 'Bulgarian Split Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0410.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0410.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '2e7a3fdc-efef-4116-80e9-fe7257b71a69',
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
        exerciseId: '76bf9bf5-ed0e-4ec1-8d88-34f03c01f459',
        exerciseName: 'Standing Cable Glute Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0228.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0228.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '46a3dec5-f0ae-4fa5-ab69-f10e4c0c3395',
        exerciseName: 'Back Extension (Hyperextension)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0489.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0489.png?v=1770098903217',
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
    name: 'Booty Builder',
    description: 'Build a booty with this workout targeting your glute muscles.',
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
        exerciseId: '7e191973-3359-4dfb-9eb2-9c553bdf9c04',
        exerciseName: 'Hip Thrust (Machine)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 40, 50, 50),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '03e58cbd-ee1d-48fd-a4d3-a2db05a0e30e',
        exerciseName: 'Sumo Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2808.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2808.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 10, 12, 14),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'aba3b5c8-5f82-4ac9-942f-92acd7577895',
        exerciseName: 'Deficit Reverse Lunge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0077.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0077.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '27e69924-475a-499d-9ffb-beccba1685d7',
        exerciseName: 'Good Morning (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0044.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0044.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '80b95c04-cb24-461e-adcc-3ef5254d0b63',
        exerciseName: 'Seated Hip Abduction (Machine)',
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
    name: 'Dumbbells',
    description:
      'All you have are dumbbells? Try this dumbbell glute workout to get those glute gains.',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 40,
    difficulty: 'Intermediate',
    equipment: 'Dumbbells',
    category: 'glutes',
    localImage: TEMPLATE_IMAGES['glutes-3'],
    exercises: [
      {
        id: '1',
        exerciseId: 'd385dce0-f84a-4f25-8d97-1d29c65518b3',
        exerciseName: 'Single Leg Hip Thrust (Dumbbell)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Glutes',
        sets: s3(10, 10, 8),
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: '5d4573e0-a25c-4bf9-991d-8343f01d7217',
        exerciseName: 'Bulgarian Split Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0410.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0410.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '673ee56a-12a8-4290-b416-3469d593aaef',
        exerciseName: 'Romanian Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1459.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1459.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '03e58cbd-ee1d-48fd-a4d3-a2db05a0e30e',
        exerciseName: 'Sumo Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2808.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2808.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'd2d89037-92d2-448c-9eec-15de502b4968',
        exerciseName: 'Step Up (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0431.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0431.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-glutes-4',
    name: 'Single Leg Exercises',
    description:
      'Feel like one glute is stronger than the other? Want to work your smaller stabilising glute muscles? Try these single leg exercises for a burn like no other.',
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
        exerciseId: 'd2d89037-92d2-448c-9eec-15de502b4968',
        exerciseName: 'Step Up (Dumbbell)',
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
        exerciseId: '047cdc7c-f19b-4251-9197-f542148584a3',
        exerciseName: 'Single Leg Romanian Deadlift (Dumbbell)',
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
        exerciseId: '5d4573e0-a25c-4bf9-991d-8343f01d7217',
        exerciseName: 'Bulgarian Split Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0410.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0410.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '76bf9bf5-ed0e-4ec1-8d88-34f03c01f459',
        exerciseName: 'Standing Cable Glute Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0228.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0228.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '26e2f90a-6a78-4d9c-b884-04f3e445c3c9',
        exerciseName: 'Single Leg Press (Horizontal Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2611.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2611.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(10, 10, 8, 30, 35, 35),
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
    name: 'All Rounder',
    description:
      'An all rounder workout targeting all main muscle groups in one session! Great if you can only come to the gym a few times per week.',
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
        exerciseId: '6ec6b967-27de-446b-85ec-c548f2e2d5ce',
        exerciseName: 'Back Squat (Barbell)',
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
        exerciseId: '95941d00-6f33-4ae3-883c-15da344547fd',
        exerciseName: 'Deadlift (Barbell)',
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
        exerciseId: '4c843074-68bb-4d9d-b873-e74fd03d816b',
        exerciseName: 'Lying Leg Curl (Machine)',
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
        exerciseId: '05437c99-9ec0-4d5a-be4e-144d05c89b1d',
        exerciseName: 'Leg Extension (Machine)',
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
        exerciseId: 'f32bbb98-2239-4d9f-bb7a-ce79e7fc26bc',
        exerciseName: 'Standing Calf Raise (Smith Machine)',
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
    name: 'Compound Workout',
    description:
      'This workout is filled with compound movements so you can make the most out of every exercise.',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 55,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'lower-body',
    localImage: TEMPLATE_IMAGES['lower-2'],
    exercises: [
      {
        id: '1',
        exerciseId: 'cf218ded-e1ab-4ed8-b800-c2178edf3a5d',
        exerciseName: 'Leg Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0740.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0740.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 60, 70, 80),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '975dd0d0-a78f-4253-a4d4-797cc6a5c666',
        exerciseName: 'Lunge (Dumbbell)',
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
        exerciseId: '23750359-97a3-4b24-8769-70a86b60dcaa',
        exerciseName: 'Pendulum Squat (Machine)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 30),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'd2d89037-92d2-448c-9eec-15de502b4968',
        exerciseName: 'Step Up (Dumbbell)',
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
        exerciseId: '369e0e19-1e5e-487d-b2ef-4b68e7a75747',
        exerciseName: 'Standing Calf Raise (Machine)',
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
        exerciseId: '2e7a3fdc-efef-4116-80e9-fe7257b71a69',
        exerciseName: 'Romanian Deadlift (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0085.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0085.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 30, 35, 40),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-lower-3',
    name: 'Lower Body Machines',
    description:
      'Try this machine workout for heavy resistance to build your strength and improve your bone density.',
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
        exerciseId: 'a70dcd0e-5fc1-45a2-ac31-827cbd06eddf',
        exerciseName: 'Hack Squat',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0741.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0741.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 30, 40, 40),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '5883552b-4a8d-47c3-a17d-bd6ace1433e3',
        exerciseName: 'Hack Calf Raise',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1383.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1383.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '6ec537ed-80fc-49e5-a40a-7cebb51f868e',
        exerciseName: 'Single Leg Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1425.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1425.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8, 30, 35, 35),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '05437c99-9ec0-4d5a-be4e-144d05c89b1d',
        exerciseName: 'Leg Extension (Machine)',
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
        exerciseId: '3b04b961-384e-418d-a1aa-b5067e30e2c4',
        exerciseName: 'Seated Leg Curl (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0599.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0599.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-lower-quad-calf',
    name: 'Quads and Calves',
    description: 'For those who prefer to hit quads and calves together, this one is for you!',
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
        exerciseId: '0123cb79-cbcf-4f39-bdd4-e615d7b5fe82',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 12, 14, 16),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'cf218ded-e1ab-4ed8-b800-c2178edf3a5d',
        exerciseName: 'Leg Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0740.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0740.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 60, 70, 80),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '975dd0d0-a78f-4253-a4d4-797cc6a5c666',
        exerciseName: 'Lunge (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '05437c99-9ec0-4d5a-be4e-144d05c89b1d',
        exerciseName: 'Leg Extension (Machine)',
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
        exerciseId: '5e3c9a7b-7ad3-434b-acc1-94388fcb53a8',
        exerciseName: 'Standing Calf Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0417.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0417.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '7a6a3b7e-0086-4906-a71e-3a77f55cd0ba',
        exerciseName: 'Seated Calf Raise (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0594.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0594.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 12, 20, 25, 25),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // PULL (4 templates)
  // ===================================================================
  {
    id: 'preset-pull-1',
    name: 'Pull Day',
    description: 'A classic back and bicep workout to help build that hourglass figure.',
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
        exerciseId: '139796b1-7fff-461d-9761-2c01d6287203',
        exerciseName: 'Wide-Grip Lat Pulldown (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0197.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0197.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '1b2046e8-9295-4ba3-907e-8d73e5459b27',
        exerciseName: 'Single Arm Row (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0377.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0377.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 12, 14, 14),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '7ae9c6c4-f8f4-4042-89ce-14ab109fb5a0',
        exerciseName: 'Standing Face Pull',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0203.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0203.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '3e88b04e-661e-4753-8988-cf46c00669b1',
        exerciseName: 'Bicep Curl (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0031.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0031.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'f9e0dade-1fd6-4118-b2ce-0884f354db39',
        exerciseName: 'Hammer Curl (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0312.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0312.png?v=1770098903217',
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
    name: 'Pull and Curl',
    description: 'This program is curated to help build the strongest back.',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '1d370c8e-7aa9-409e-916d-ba5f71cdeb14',
        exerciseName: 'Assisted Chin Up (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0572.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0572.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '33398017-fafb-4e0f-b16b-461fb3d7fb94',
        exerciseName: 'Seated Row (Cable)',
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
        exerciseId: 'ab394c3e-8526-47ca-8695-35f3ecdf4b18',
        exerciseName: 'Iso Lateral High Row (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1356.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1356.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '4e829531-8615-44a6-9a43-0030c138a9a8',
        exerciseName: 'Straight Arm Pulldown (Rope)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0237.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0237.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'e9c20799-9523-4f21-9c40-13c9bb5b8ec5',
        exerciseName: 'Alternating Bicep Curl (Dumbbell)',
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
        exerciseId: 'd95982ee-60b4-4355-9111-d5940a8aef86',
        exerciseName: 'Bicep Curl (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1630.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1630.png?v=1770098903217',
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
    name: 'Back and Bicep Builder',
    description: 'Warning! Doing these exercises will result in a sexy back.',
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
        exerciseId: 'ea632678-6146-40ad-b2f4-2a26ef69395a',
        exerciseName: 'Lat Pulldown (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0579.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0579.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 25, 30, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '90756a63-64a7-4c4f-b835-d566f38c6aaf',
        exerciseName: 'Assisted Pull Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0017.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0017.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '525122f5-c4cb-4a48-b1ea-1f2ac5b20cfa',
        exerciseName: 'Single Arm Lat Pulldown',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0007.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0007.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '325eed73-6baa-446e-9805-e9bb70739042',
        exerciseName: 'Kneeling Face Pull (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0167.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0167.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'd46d40b5-ea0b-4b52-91d7-f8e8f402243d',
        exerciseName: 'Incline Hammer Curl (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0320.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0320.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '32df4dc4-3c51-4906-8cf5-a8b92ba8f205',
        exerciseName: 'Drag Curl',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0038.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0038.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-pull-4',
    name: 'Short Back and Bi Workout',
    description: 'A quick 40 minute workout to help you build your back and bicep muscles.',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 40,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'pull',
    localImage: TEMPLATE_IMAGES['pull-4'],
    exercises: [
      {
        id: '1',
        exerciseId: '378714b4-4dfd-4529-910c-dd4c588da531',
        exerciseName: 'Band-Assisted Pull Up',
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
        exerciseId: 'c90a0e70-ad97-49f9-a297-4d8fdd1cbe6d',
        exerciseName: 'Iso Lateral Row (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0571.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0571.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'e65ab7fe-4cf1-4f38-9d8b-d95d379211e8',
        exerciseName: 'Landmine Bent Over Row',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0574.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0574.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '53f04ddf-7133-4135-b4e6-066910ae536e',
        exerciseName: 'Seated Reverse Fly (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0602.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0602.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'ba23901a-f639-44fd-b462-a033419bf628',
        exerciseName: 'Preacher Curl (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0070.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0070.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: 'c3a2f820-0165-42aa-aaf2-6f27dba8f83c',
        exerciseName: 'Cross Body Hammer Curl (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1657.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1657.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 6, 8, 8),
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
    name: 'Push Day',
    description: 'A mix of push exercises to tone up your arms.',
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
        exerciseId: '21083802-e752-4d38-abdb-bc48b092c14f',
        exerciseName: 'Standing Military Press (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1457.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1457.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'b3bca5a4-7591-4d60-8bcb-85dceb57fb14',
        exerciseName: 'Lateral to Front Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0335.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0335.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '822ef0fb-5bab-4ef9-8be9-ba4a3a3b2a75',
        exerciseName: 'Chest Fly (Dumbbell)',
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
        exerciseId: '9c39c6cc-d646-48a6-99f2-2c347f2221b7',
        exerciseName: 'Triceps Pushdown',
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
        exerciseId: 'd5d180b8-de36-4ac9-82b1-12ab3255d6ec',
        exerciseName: 'Tricep Kickback (Dumbbell)',
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
    name: 'Boulder Shoulders',
    description: 'Push workout with a focus on shoulders and triceps.',
    tagIds: ['shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-2'],
    exercises: [
      {
        id: '1',
        exerciseId: 'eb200ebc-2d57-4acc-85fb-6edc7f01f4c9',
        exerciseName: 'Shoulder Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0587.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0587.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '92897ec2-c22d-45bd-83bb-3cfdd35f419c',
        exerciseName: 'Lateral Raise (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0584.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0584.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '5ef11525-d2e2-4b67-9d36-5375a2a4d63e',
        exerciseName: 'Incline Front Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0325.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0325.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '53f04ddf-7133-4135-b4e6-066910ae536e',
        exerciseName: 'Seated Reverse Fly (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0602.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0602.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(15, 12, 12, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '19842cc1-5cb8-443e-a7f3-0d2f21b0fb5a',
        exerciseName: 'Overhead Triceps Extension (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0194.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0194.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 10, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: 'a95b17be-875a-444b-83a1-d2d44a97bf21',
        exerciseName: 'Single Arm Triceps Pushdown (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1723.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1723.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 8, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-push-3',
    name: 'Shoulders, Chest and Tris',
    description: 'All the main push movements in one workout, guaranteed to make you work.',
    tagIds: ['chest', 'shoulders', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 50,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'push',
    localImage: TEMPLATE_IMAGES['push-3'],
    exercises: [
      {
        id: '1',
        exerciseId: 'e162bef8-8b6f-4f28-9729-1536cccbaea7',
        exerciseName: 'Single Arm Lateral Raise (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0192.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0192.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'bc57a92a-9b5a-414b-a4f9-4861de313629',
        exerciseName: 'Seated Shoulder Press (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0290.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0290.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 8, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'e0be5338-4906-4576-afa6-30223645e1f5',
        exerciseName: 'Bench Press (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0025.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0025.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 10, 8, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '1d101c97-2473-4398-934f-9ff45a50f575',
        exerciseName: 'Seated Lateral Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2317.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2317.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '822ef0fb-5bab-4ef9-8be9-ba4a3a3b2a75',
        exerciseName: 'Chest Fly (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0308.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0308.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10, 20, 25, 25),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '8cbef202-37fa-4bd5-a4b5-cd587aebda02',
        exerciseName: 'Assisted Triceps Dip',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0019.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0019.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(10, 10, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-push-4',
    name: 'Machine Push',
    description: 'Majority done on machines for stability and heavy resistance.',
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
        exerciseId: 'b23ce66a-27f4-4876-8430-4888737b80bc',
        exerciseName: 'Chest Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0577.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0577.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10, 20, 25, 30),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'eb200ebc-2d57-4acc-85fb-6edc7f01f4c9',
        exerciseName: 'Shoulder Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0587.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0587.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 10, 8, 15, 20, 20),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'b3bca5a4-7591-4d60-8bcb-85dceb57fb14',
        exerciseName: 'Lateral to Front Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0335.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0335.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 12, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'afac1002-6d79-4974-9482-9a9e36c1f04e',
        exerciseName: 'Seated Tricep Push',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0591.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0591.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 15, 18, 18),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '4bcffd37-b1f3-4b37-b0ce-89592533b8fe',
        exerciseName: 'Single Arm Tricep Extension (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0423.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0423.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10, 4, 5, 5),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // AT-HOME (8 templates)
  // ===================================================================

  // --- No Equipment (3) ---
  {
    id: 'preset-home-fullbody-bw',
    name: 'Full Body (No Equipment)',
    description: 'Full Body, No Equipment Necessary.',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-1'],
    exercises: [
      {
        id: '1',
        exerciseId: 'd8d8fa85-43bb-4192-ba96-de3ca0097ce7',
        exerciseName: 'Squat (Bodyweight)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'de20d9cc-ef42-4b2f-8e9a-2de225033dd3',
        exerciseName: 'Wall Sit',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0624.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0624.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '975dd0d0-a78f-4253-a4d4-797cc6a5c666',
        exerciseName: 'Lunge (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'ef2d9442-d333-4a56-9674-c06eedfb5d23',
        exerciseName: 'Push Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '126e61bd-3af3-4f57-8a8a-9a6fd0a31593',
        exerciseName: 'Floor Triceps Dip',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0815.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0815.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '88d5ee25-4081-4e60-8796-c13cdf475d75',
        exerciseName: 'Shoulder Taps',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3699.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3699.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '7',
        exerciseId: 'cde15e95-9f32-4c85-856e-58366d807230',
        exerciseName: 'Side Plank Hip Abduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1774.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1774.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-lower-bw',
    name: 'Lower Body (No Equipment)',
    description:
      "Lower Body Workout. Whether you are at home, don't have time to run to the gym or are travelling, this program will make sure you can still get those leg gains.",
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
        exerciseId: 'd8d8fa85-43bb-4192-ba96-de3ca0097ce7',
        exerciseName: 'Squat (Bodyweight)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 15),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '975dd0d0-a78f-4253-a4d4-797cc6a5c666',
        exerciseName: 'Lunge (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 15),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '369e0e19-1e5e-487d-b2ef-4b68e7a75747',
        exerciseName: 'Standing Calf Raise (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 15, 15),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '55a94cf9-759f-42b7-8bb7-4bdc645cefd3',
        exerciseName: 'Single Leg Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3645.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3645.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 15, 15),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '7ef559f3-bd3f-4960-a480-bdda1bc881bb',
        exerciseName: 'Fire Hydrants',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0980.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-b5ecb214-f351-4d88-8759-11c0e93ca0f2.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 15, 15),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-upper-bw',
    name: 'Upper Body (No Equipment)',
    description: 'Upper body burn with purely body weight.',
    tagIds: ['chest', 'arms'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '48c38f2b-bc27-4051-bedf-2b9b1d5f1bdf',
        exerciseName: 'Body Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0137.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0137.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '126e61bd-3af3-4f57-8a8a-9a6fd0a31593',
        exerciseName: 'Floor Triceps Dip',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0815.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0815.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'ef2d9442-d333-4a56-9674-c06eedfb5d23',
        exerciseName: 'Push Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0662.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0662.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'b91aaaa3-2592-4141-9148-accff258b624',
        exerciseName: 'Scapular Push Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3021.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3021.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '04838f11-d657-4d6c-ba9f-8bd0a8194d84',
        exerciseName: 'Side Push Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0717.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0717.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // --- Dumbbells (3) ---
  {
    id: 'preset-home-upper-db',
    name: 'Upper Body (Dumbbells)',
    description: 'Upper Body workout with dumbbells only.',
    tagIds: ['shoulders', 'arms', 'back'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Dumbbells',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-4'],
    exercises: [
      {
        id: '1',
        exerciseId: 'bc57a92a-9b5a-414b-a4f9-4861de313629',
        exerciseName: 'Seated Shoulder Press (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0290.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0290.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'd5d180b8-de36-4ac9-82b1-12ab3255d6ec',
        exerciseName: 'Tricep Kickback (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0333.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0333.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '0e007117-b83e-4796-88c2-e5a854482495',
        exerciseName: 'Front Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0310.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0310.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '3a333f7e-0dcb-4d31-a343-910f3b770112',
        exerciseName: 'Lateral Raise (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0334.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0334.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '1b2046e8-9295-4ba3-907e-8d73e5459b27',
        exerciseName: 'Single Arm Row (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0377.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0377.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '117d202d-618c-4727-913b-8e2f39210b05',
        exerciseName: 'Chest Supported Reverse Fly (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0326.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0326.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '7',
        exerciseId: '4dfb32ea-bdcd-4a61-b738-010d23f768f8',
        exerciseName: 'Standing Bicep Curl (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0416.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0416.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-lower-db',
    name: 'Lower Body (Dumbbells)',
    description: 'Lower body workout with dumbbells only.',
    tagIds: ['legs', 'glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Dumbbells',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-5'],
    exercises: [
      {
        id: '1',
        exerciseId: '0123cb79-cbcf-4f39-bdd4-e615d7b5fe82',
        exerciseName: 'Goblet Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1760.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1760.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'd385dce0-f84a-4f25-8d97-1d29c65518b3',
        exerciseName: 'Single Leg Hip Thrust (Dumbbell)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '975dd0d0-a78f-4253-a4d4-797cc6a5c666',
        exerciseName: 'Lunge (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0336.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0336.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '369e0e19-1e5e-487d-b2ef-4b68e7a75747',
        exerciseName: 'Standing Calf Raise (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0605.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0605.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '673ee56a-12a8-4290-b416-3469d593aaef',
        exerciseName: 'Romanian Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1459.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1459.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-glutes-db',
    name: 'Glutes (Dumbbells)',
    description: 'Glute workout with dumbbells only.',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Intermediate',
    equipment: 'Dumbbells',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-6'],
    exercises: [
      {
        id: '1',
        exerciseId: '03e58cbd-ee1d-48fd-a4d3-a2db05a0e30e',
        exerciseName: 'Sumo Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/2808.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/2808.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '673ee56a-12a8-4290-b416-3469d593aaef',
        exerciseName: 'Romanian Deadlift (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1459.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1459.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '61684449-ed56-43fb-8f57-0744766cf0c9',
        exerciseName: 'Reverse Lunge (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0381.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/custom-61684449-ed56-43fb-8f57-0744766cf0c9.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'd385dce0-f84a-4f25-8d97-1d29c65518b3',
        exerciseName: 'Single Leg Hip Thrust (Dumbbell)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // --- Bands (1) ---
  {
    id: 'preset-home-upper-bands',
    name: 'Upper Body (Bands)',
    description: 'Upper body workout with resistance bands only.',
    tagIds: ['back', 'shoulders', 'chest'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'Resistance Band',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-7'],
    exercises: [
      {
        id: '1',
        exerciseId: '9bc374ff-8991-44ea-81b0-84f31d98cd99',
        exerciseName: 'Reverse Grip Lat Pulldown (Band)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1013.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1013.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '840b0452-442a-438a-90e9-3461a914c709',
        exerciseName: 'Band Pullaparts',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0993.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0993.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'b268a917-f7bd-48a1-9e9e-3edaaf7f1ff6',
        exerciseName: 'Front Raise (Band)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0978.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0978.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'd91074d3-b5db-488b-97d2-f35bfbd51580',
        exerciseName: 'Lateral Raise (Band)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0977.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0977.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: 'be9c0820-cbd1-46cc-bf10-6ae858cba1c9',
        exerciseName: 'Chest Press (Band)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1254.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1254.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // --- Glutes No Equipment (1) ---
  {
    id: 'preset-home-glutes-bw',
    name: 'Glutes (No Equipment)',
    description: 'Glute Bridge and Hinge Home Exercise Workout.',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    localImage: TEMPLATE_IMAGES['home-4'],
    exercises: [
      {
        id: '1',
        exerciseId: 'd8d8fa85-43bb-4192-ba96-de3ca0097ce7',
        exerciseName: 'Squat (Bodyweight)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3533.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3533.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '5d4573e0-a25c-4bf9-991d-8343f01d7217',
        exerciseName: 'Bulgarian Split Squat (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0410.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0410.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'cde15e95-9f32-4c85-856e-58366d807230',
        exerciseName: 'Side Plank Hip Abduction',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1774.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1774.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'd1a92a03-afb0-48d0-a3ad-a532a90742a5',
        exerciseName: 'Elevated Glute Bridge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3523.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3523.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '56d7c017-5972-4526-9732-f455b18a6e10',
        exerciseName: 'Single Leg Hip Thrust',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1409.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1409.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // ===================================================================
  // FULL BODY (5 templates)
  // ===================================================================
  {
    id: 'preset-fullbody-blast',
    name: 'Full Body Blast',
    description:
      "Perfect for when you're short on time but still want to build strength throughout your whole body.",
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'full-body',
    localImage: TEMPLATE_IMAGES['full-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '6e96966c-40a2-45bd-a622-115b4b3b28b7',
        exerciseName: 'Sumo Deadlift (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0117.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0117.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8),
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: '378714b4-4dfd-4529-910c-dd4c588da531',
        exerciseName: 'Band-Assisted Pull Up',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0970.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0970.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(8, 8, 6),
        restTimerSeconds: 90,
      },
      {
        id: '3',
        exerciseId: '7e191973-3359-4dfb-9eb2-9c553bdf9c04',
        exerciseName: 'Hip Thrust (Machine)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Glutes',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '17538922-0fce-4403-be34-4c69678388ec',
        exerciseName: 'Ab Crunch (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0175.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0175.png?v=1770098903217',
        muscle: 'Core',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '4c843074-68bb-4d9d-b873-e74fd03d816b',
        exerciseName: 'Lying Leg Curl (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0586.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0586.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: 'b23ce66a-27f4-4876-8430-4888737b80bc',
        exerciseName: 'Chest Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0577.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0577.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-fullbody-burn',
    name: 'Full Body Burn',
    description: 'Destroy your whole body in one single workout.',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 40,
    difficulty: 'Advanced',
    equipment: 'Gym',
    category: 'full-body',
    localImage: TEMPLATE_IMAGES['full-2'],
    exercises: [
      {
        id: '1',
        exerciseId: '4dd4e46a-eedd-47d9-8beb-6a51a9f89731',
        exerciseName: 'Reverse Grip Lat Pulldown (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0245.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0245.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '21083802-e752-4d38-abdb-bc48b092c14f',
        exerciseName: 'Standing Military Press (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1457.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1457.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(10, 8, 8),
        restTimerSeconds: 90,
      },
      {
        id: '3',
        exerciseId: '95941d00-6f33-4ae3-883c-15da344547fd',
        exerciseName: 'Deadlift (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0032.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0032.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(8, 8, 6),
        restTimerSeconds: 120,
      },
      {
        id: '4',
        exerciseId: 'cf218ded-e1ab-4ed8-b800-c2178edf3a5d',
        exerciseName: 'Leg Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0740.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0740.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 90,
      },
      {
        id: '5',
        exerciseId: '46a3dec5-f0ae-4fa5-ab69-f10e4c0c3395',
        exerciseName: 'Back Extension (Hyperextension)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0489.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0489.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '4bcffd37-b1f3-4b37-b0ce-89592533b8fe',
        exerciseName: 'Seated Tricep Overhead Extension (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0423.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0423.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
        supersetId: 1,
      },
      {
        id: '7',
        exerciseId: '4dfb32ea-bdcd-4a61-b738-010d23f768f8',
        exerciseName: 'Bicep Curl (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0416.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0416.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
        supersetId: 1,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-fullbody-bang',
    name: 'Bang for your Buck',
    description:
      'Every exercise works multiple muscle groups in one, so you get the most bang for your buck.',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'full-body',
    localImage: TEMPLATE_IMAGES['full-3'],
    exercises: [
      {
        id: '1',
        exerciseId: '9ece3060-9a71-49ec-8f4d-544f191ed47c',
        exerciseName: 'Clean and Jerk (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0028.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0028.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(6, 5, 5),
        restTimerSeconds: 120,
      },
      {
        id: '2',
        exerciseId: '45707207-a861-4f56-bbe6-2f2dd69ca007',
        exerciseName: 'Pendlay Row (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3017.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3017.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(10, 8, 8),
        restTimerSeconds: 90,
      },
      {
        id: '3',
        exerciseId: 'e0dca4ea-c58d-4b24-94bd-d1f9c7e0c9b3',
        exerciseName: 'Walking Lunge',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1460.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1460.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 12, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '1d370c8e-7aa9-409e-916d-ba5f71cdeb14',
        exerciseName: 'Assisted Chin Up (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0572.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0572.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(8, 8, 6),
        restTimerSeconds: 90,
      },
      {
        id: '5',
        exerciseId: '05687117-781b-4178-8116-0e2ef4e522b7',
        exerciseName: 'Standing Hammer Curl and Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/3560.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/3560.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(10, 10, 8),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-fullbody-balanced',
    name: 'Full Body',
    description: 'A nice balance of upper, lower and core exercises.',
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'full-body',
    localImage: TEMPLATE_IMAGES['full-4'],
    exercises: [
      {
        id: '1',
        exerciseId: 'a4cbc11e-8671-4d9c-b8ed-3c61b07de8ba',
        exerciseName: 'Front Squat (Smith Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1433.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1433.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(10, 10, 8),
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: '98c2c8e2-c78b-4f55-af4a-1050edc40506',
        exerciseName: 'Calf Raise on Leg Press',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/1385.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/1385.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '4c843074-68bb-4d9d-b873-e74fd03d816b',
        exerciseName: 'Lying Leg Curl (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0586.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0586.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '6a8b5e00-b8f4-45c1-ae04-09abd5b6bf3a',
        exerciseName: 'Bench Press (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0289.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0289.png?v=1770098903217',
        muscle: 'Chest',
        sets: s3(10, 10, 8),
        restTimerSeconds: 90,
      },
      {
        id: '5',
        exerciseId: 'eb200ebc-2d57-4acc-85fb-6edc7f01f4c9',
        exerciseName: 'Shoulder Press (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0587.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0587.png?v=1770098903217',
        muscle: 'Shoulders',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: 'd5d180b8-de36-4ac9-82b1-12ab3255d6ec',
        exerciseName: 'Tricep Kickback (Dumbbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0333.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0333.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 12, 10),
        restTimerSeconds: 60,
      },
      {
        id: '7',
        exerciseId: '0bf2b34a-88f1-4656-a099-51908069372a',
        exerciseName: 'Pallof Press (Cable)',
        gifUrl: null,
        thumbnailUrl: null,
        muscle: 'Core',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'preset-fullbody-accessory',
    name: 'Accessory Movements',
    description:
      "Let's work those isolated muscle groups that maybe didn't get as much attention during our other workouts.",
    tagIds: ['full-body'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'Gym',
    category: 'full-body',
    localImage: TEMPLATE_IMAGES['extra-1'],
    exercises: [
      {
        id: '1',
        exerciseId: '05437c99-9ec0-4d5a-be4e-144d05c89b1d',
        exerciseName: 'Leg Extension (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0585.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0585.png?v=1770098903217',
        muscle: 'Legs',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: '80b95c04-cb24-461e-adcc-3ef5254d0b63',
        exerciseName: 'Seated Hip Abduction (Machine)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0597.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0597.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(15, 12, 12),
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: '76bf9bf5-ed0e-4ec1-8d88-34f03c01f459',
        exerciseName: 'Standing Cable Glute Kickbacks',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0228.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0228.png?v=1770098903217',
        muscle: 'Glutes',
        sets: s3(12, 12, 10),
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: '33398017-fafb-4e0f-b16b-461fb3d7fb94',
        exerciseName: 'Seated Row (Cable)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0861.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0861.png?v=1770098903217',
        muscle: 'Back',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '5',
        exerciseId: '3e88b04e-661e-4753-8988-cf46c00669b1',
        exerciseName: 'Bicep Curl (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0031.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0031.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
      },
      {
        id: '6',
        exerciseId: '8cbef202-37fa-4bd5-a4b5-cd587aebda02',
        exerciseName: 'Assisted Triceps Dip',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0019.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0019.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(10, 10, 8),
        restTimerSeconds: 60,
        supersetId: 1,
      },
      {
        id: '7',
        exerciseId: 'f79078c1-c5b2-4415-96d3-081341c92142',
        exerciseName: 'Skullcrusher (Barbell)',
        gifUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-gifs/0060.gif',
        thumbnailUrl:
          'https://dngpsabyqsuunajtotci.supabase.co/storage/v1/object/public/exercise-thumbnails/0060.png?v=1770098903217',
        muscle: 'Arms',
        sets: s3(12, 10, 10),
        restTimerSeconds: 60,
        supersetId: 1,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
];
