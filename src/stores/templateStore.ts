import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ImageSourcePropType } from 'react-native';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';
import { WorkoutImage } from './workoutStore';
import { colors } from '@/constants/theme';

import {
  saveUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  getUserTemplates,
} from '@/services/api/templates';

// Template set structure
export interface TemplateSet {
  setNumber: number;
  targetWeight?: number; // kg
  targetReps?: number;
}

// Template exercise structure
export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  sets: TemplateSet[];
  notes?: string;
  restTimerSeconds: number;
}

// Main template structure
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  image?: WorkoutImage;
  localImage?: ImageSourcePropType; // For preset templates with bundled images
  tagIds: string[]; // Multiple tags (e.g., ["bicep", "back"])
  tagColor: string; // Primary color for card display
  estimatedDuration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string; // 'Gym', 'Home', 'No Equipment'
  category?: 'core' | 'glutes' | 'lower-body' | 'pull' | 'push' | 'upper-body'; // For explore filter categories
  exercises: TemplateExercise[];
  isPreset: boolean; // true for explore library, false for user-created
  createdAt: string;
  userId?: string; // null for preset templates
  folderId?: string; // Folder this template belongs to (null = unfiled)
}

// Folder structure for organizing templates
export interface TemplateFolder {
  id: string;
  name: string;
  createdAt: string;
  isCollapsed: boolean; // Whether folder is collapsed in UI
}

// Template input for creating/updating
export type TemplateInput = Omit<WorkoutTemplate, 'id' | 'createdAt' | 'isPreset'>;

interface TemplateStore {
  // User's saved templates
  templates: WorkoutTemplate[];

  // Preset templates (explore library)
  presetTemplates: WorkoutTemplate[];

  // Folders for organizing templates
  folders: TemplateFolder[];

  // Loading state for sync
  isSyncing: boolean;
  lastSyncError: string | null;

  // Actions
  addTemplate: (template: WorkoutTemplate) => void;
  removeTemplate: (id: string) => void;
  createTemplate: (input: TemplateInput) => WorkoutTemplate;
  updateTemplate: (id: string, updates: Partial<TemplateInput>) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  getTemplatesForUser: (userId: string | null) => WorkoutTemplate[];
  isTemplateSaved: (presetId: string, userId: string | null) => boolean;
  updateTemplateFromWorkout: (templateId: string, exercises: TemplateExercise[]) => void;
  reorderTemplates: (reorderedTemplates: WorkoutTemplate[]) => void;

  // Folder actions
  createFolder: (name: string) => TemplateFolder;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderCollapsed: (folderId: string) => void;
  moveTemplateToFolder: (templateId: string, folderId: string | null) => void;
  reorderFolders: (reorderedFolders: TemplateFolder[]) => void;

  // Sync actions for backend persistence
  syncTemplatesFromBackend: (userId: string) => Promise<void>;
  saveTemplateToBackend: (userId: string, template: WorkoutTemplate) => Promise<boolean>;
  deleteTemplateFromBackend: (templateId: string) => Promise<boolean>;
}

// Generate a simple unique ID
const generateId = () => `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default folder ID - this folder cannot be deleted
export const DEFAULT_FOLDER_ID = 'my-templates';
export const DEFAULT_FOLDER_NAME = 'My Templates';

// Category images for preset templates
const CATEGORY_IMAGES = {
  core: require('../../assets/Images/ABS-CORE/IMG_4464.JPG'),
  glutes: require('../../assets/Images/GLUTES/IMG_4472.JPG'),
  lowerBody: require('../../assets/Images/LOWER BODY/IMG_4484.JPG'),
  pull: require('../../assets/Images/BACK-PULL/IMG_4451.JPG'),
  push: require('../../assets/Images/UPPER BODY/IMG_4492.JPG'),
  upperBody: require('../../assets/Images/UPPER BODY/IMG_4493.JPG'),
} as const;

// Preset templates for the explore library - organized by 6 categories
const PRESET_TEMPLATES: WorkoutTemplate[] = [
  // ===== CORE (8 workouts) =====
  {
    id: 'preset-core-1',
    name: 'Machines',
    description: 'Machine-based core workout targeting all abdominal muscles',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 35,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    category: 'core',
    localImage: CATEGORY_IMAGES.core,
    exercises: [
      {
        id: '1',
        exerciseId: 'cable-crunches-kneeling',
        exerciseName: 'Cable Crunches (Kneeling)',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetWeight: 20, targetReps: 15 },
          { setNumber: 2, targetWeight: 25, targetReps: 12 },
          { setNumber: 3, targetWeight: 25, targetReps: 12 },
        ],
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'pallof-press',
        exerciseName: 'Pallof Press',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetWeight: 10, targetReps: 12 },
          { setNumber: 2, targetWeight: 12, targetReps: 10 },
          { setNumber: 3, targetWeight: 12, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
      {
        id: '3',
        exerciseId: 'cable-rotations',
        exerciseName: 'Cable Rotations',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetWeight: 10, targetReps: 12 },
          { setNumber: 2, targetWeight: 12, targetReps: 10 },
          { setNumber: 3, targetWeight: 12, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
      {
        id: '4',
        exerciseId: 'decline-sit-ups',
        exerciseName: 'Decline Sit Ups',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 12 },
          { setNumber: 3, targetReps: 12 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-core-2',
    name: 'Dumbbells',
    description: 'Build a strong back and defined biceps',
    tagIds: ['back', 'arms'],
    tagColor: colors.workout.back,
    estimatedDuration: 75,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    localImage: CATEGORY_IMAGES.pull,
    exercises: [
      {
        id: '1',
        exerciseId: 'lat-pulldown',
        exerciseName: 'Lat Pulldown',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetWeight: 30, targetReps: 12 },
          { setNumber: 2, targetWeight: 35, targetReps: 10 },
          { setNumber: 3, targetWeight: 40, targetReps: 8 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'seated-row',
        exerciseName: 'Seated Row (Cable)',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetWeight: 25, targetReps: 12 },
          { setNumber: 2, targetWeight: 30, targetReps: 10 },
          { setNumber: 3, targetWeight: 30, targetReps: 10 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '3',
        exerciseId: 'bicep-curl-dumbbell',
        exerciseName: 'Bicep Curl (Dumbbell)',
        muscle: 'Arms',
        sets: [
          { setNumber: 1, targetWeight: 8, targetReps: 12 },
          { setNumber: 2, targetWeight: 10, targetReps: 10 },
          { setNumber: 3, targetWeight: 10, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-abs',
    name: 'Abs',
    description: 'Core strengthening workout for defined abs',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    localImage: CATEGORY_IMAGES.core,
    exercises: [
      {
        id: '1',
        exerciseId: 'plank',
        exerciseName: 'Plank',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 60 },
          { setNumber: 2, targetReps: 60 },
          { setNumber: 3, targetReps: 60 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'crunch',
        exerciseName: 'Crunch',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '3',
        exerciseId: 'leg-raise',
        exerciseName: 'Leg Raise',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
          { setNumber: 3, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  // Additional main templates (shown when "Show 10 Workouts" is clicked)
  {
    id: 'preset-chest-triceps',
    name: 'Chest & Triceps',
    description: 'Push day workout targeting chest and triceps',
    tagIds: ['chest', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 60,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        muscle: 'Chest',
        sets: [
          { setNumber: 1, targetWeight: 40, targetReps: 12 },
          { setNumber: 2, targetWeight: 50, targetReps: 10 },
          { setNumber: 3, targetWeight: 50, targetReps: 8 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'tricep-pushdown',
        exerciseName: 'Tricep Pushdown',
        muscle: 'Arms',
        sets: [
          { setNumber: 1, targetWeight: 15, targetReps: 12 },
          { setNumber: 2, targetWeight: 20, targetReps: 10 },
          { setNumber: 3, targetWeight: 20, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-shoulders',
    name: 'Shoulder Sculpt',
    description: 'Build defined, strong shoulders',
    tagIds: ['shoulders'],
    tagColor: colors.workout.shoulders,
    estimatedDuration: 45,
    difficulty: 'Beginner',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'shoulder-press',
        exerciseName: 'Shoulder Press (Dumbbell)',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetWeight: 8, targetReps: 12 },
          { setNumber: 2, targetWeight: 10, targetReps: 10 },
          { setNumber: 3, targetWeight: 10, targetReps: 10 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'lateral-raise',
        exerciseName: 'Lateral Raise',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetWeight: 5, targetReps: 15 },
          { setNumber: 2, targetWeight: 6, targetReps: 12 },
          { setNumber: 3, targetWeight: 6, targetReps: 12 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-leg-day',
    name: 'Leg Day',
    description: 'Complete lower body workout',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 70,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'squat',
        exerciseName: 'Barbell Squat',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetWeight: 40, targetReps: 12 },
          { setNumber: 2, targetWeight: 50, targetReps: 10 },
          { setNumber: 3, targetWeight: 60, targetReps: 8 },
        ],
        restTimerSeconds: 120,
      },
      {
        id: '2',
        exerciseId: 'leg-press',
        exerciseName: 'Leg Press',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetWeight: 80, targetReps: 12 },
          { setNumber: 2, targetWeight: 100, targetReps: 10 },
          { setNumber: 3, targetWeight: 100, targetReps: 10 },
        ],
        restTimerSeconds: 90,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-full-body',
    name: 'Full Body Blast',
    description: 'Hit every muscle group in one session',
    tagIds: ['fullBody'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 90,
    difficulty: 'Advanced',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'deadlift',
        exerciseName: 'Deadlift',
        muscle: 'Full Body',
        sets: [
          { setNumber: 1, targetWeight: 60, targetReps: 10 },
          { setNumber: 2, targetWeight: 70, targetReps: 8 },
          { setNumber: 3, targetWeight: 80, targetReps: 6 },
        ],
        restTimerSeconds: 120,
      },
      {
        id: '2',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        muscle: 'Chest',
        sets: [
          { setNumber: 1, targetWeight: 40, targetReps: 10 },
          { setNumber: 2, targetWeight: 50, targetReps: 8 },
        ],
        restTimerSeconds: 90,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-upper-body',
    name: 'Upper Body',
    description: 'Complete upper body strength workout',
    tagIds: ['chest', 'back', 'shoulders'],
    tagColor: colors.workout.chest,
    estimatedDuration: 65,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'incline-press',
        exerciseName: 'Incline Bench Press',
        muscle: 'Chest',
        sets: [
          { setNumber: 1, targetWeight: 30, targetReps: 12 },
          { setNumber: 2, targetWeight: 35, targetReps: 10 },
          { setNumber: 3, targetWeight: 35, targetReps: 10 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'row',
        exerciseName: 'Dumbbell Row',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetWeight: 15, targetReps: 12 },
          { setNumber: 2, targetWeight: 18, targetReps: 10 },
          { setNumber: 3, targetWeight: 18, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-booty-builder',
    name: 'Booty Builder',
    description: 'Focus on glute activation and growth',
    tagIds: ['glutes', 'legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 55,
    difficulty: 'Beginner',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'glute-bridge',
        exerciseName: 'Glute Bridge',
        muscle: 'Glutes',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
        ],
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: 'romanian-deadlift',
        exerciseName: 'Romanian Deadlift',
        muscle: 'Glutes',
        sets: [
          { setNumber: 1, targetWeight: 20, targetReps: 12 },
          { setNumber: 2, targetWeight: 25, targetReps: 10 },
          { setNumber: 3, targetWeight: 25, targetReps: 10 },
        ],
        restTimerSeconds: 90,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-arm-day',
    name: 'Arm Day',
    description: 'Biceps and triceps focused workout',
    tagIds: ['arms'],
    tagColor: colors.workout.arms,
    estimatedDuration: 40,
    difficulty: 'Beginner',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'bicep-curl',
        exerciseName: 'Bicep Curl',
        muscle: 'Arms',
        sets: [
          { setNumber: 1, targetWeight: 8, targetReps: 12 },
          { setNumber: 2, targetWeight: 10, targetReps: 10 },
          { setNumber: 3, targetWeight: 10, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'tricep-dip',
        exerciseName: 'Tricep Dip',
        muscle: 'Arms',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-power-lower',
    name: 'Power Lower Body',
    description: 'Build explosive leg strength',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 50,
    difficulty: 'Advanced',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'box-jump',
        exerciseName: 'Box Jump',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 8 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'lunge',
        exerciseName: 'Walking Lunge',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetWeight: 10, targetReps: 12 },
          { setNumber: 2, targetWeight: 12, targetReps: 10 },
          { setNumber: 3, targetWeight: 12, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-back-strength',
    name: 'Back Strength',
    description: 'Build a strong, defined back',
    tagIds: ['back'],
    tagColor: colors.workout.back,
    estimatedDuration: 55,
    difficulty: 'Intermediate',
    equipment: 'Gym',
    exercises: [
      {
        id: '1',
        exerciseId: 'pull-up',
        exerciseName: 'Pull Up',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetReps: 8 },
          { setNumber: 2, targetReps: 8 },
          { setNumber: 3, targetReps: 6 },
        ],
        restTimerSeconds: 90,
      },
      {
        id: '2',
        exerciseId: 'face-pull',
        exerciseName: 'Face Pull',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetWeight: 15, targetReps: 15 },
          { setNumber: 2, targetWeight: 18, targetReps: 12 },
          { setNumber: 3, targetWeight: 18, targetReps: 12 },
        ],
        restTimerSeconds: 60,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-core-stability',
    name: 'Core Stability',
    description: 'Build core strength and stability',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    exercises: [
      {
        id: '1',
        exerciseId: 'dead-bug',
        exerciseName: 'Dead Bug',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 16 },
          { setNumber: 2, targetReps: 16 },
          { setNumber: 3, targetReps: 16 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'bird-dog',
        exerciseName: 'Bird Dog',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
          { setNumber: 3, targetReps: 12 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // AT HOME category templates (5 workouts)
  {
    id: 'preset-home-hiit',
    name: 'Home HIIT',
    description: 'High intensity workout with no equipment',
    tagIds: ['fullBody'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 25,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'at-home',
    exercises: [
      {
        id: '1',
        exerciseId: 'burpee',
        exerciseName: 'Burpees',
        muscle: 'Full Body',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'mountain-climber',
        exerciseName: 'Mountain Climbers',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
          { setNumber: 3, targetReps: 30 },
        ],
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-lower',
    name: 'Home Lower Body',
    description: 'Bodyweight leg workout at home',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    exercises: [
      {
        id: '1',
        exerciseId: 'squat-bodyweight',
        exerciseName: 'Bodyweight Squat',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
          { setNumber: 3, targetReps: 15 },
        ],
        restTimerSeconds: 45,
      },
      {
        id: '2',
        exerciseId: 'lunge-bodyweight',
        exerciseName: 'Alternating Lunge',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
        ],
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-upper',
    name: 'Home Upper Body',
    description: 'Bodyweight upper body workout',
    tagIds: ['chest', 'arms'],
    tagColor: colors.workout.chest,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    exercises: [
      {
        id: '1',
        exerciseId: 'push-up',
        exerciseName: 'Push Up',
        muscle: 'Chest',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 60,
      },
      {
        id: '2',
        exerciseId: 'tricep-dip-chair',
        exerciseName: 'Chair Tricep Dip',
        muscle: 'Arms',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-glutes',
    name: 'Home Glute Workout',
    description: 'Activate and tone your glutes at home',
    tagIds: ['glutes'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    exercises: [
      {
        id: '1',
        exerciseId: 'glute-bridge-bw',
        exerciseName: 'Glute Bridge',
        muscle: 'Glutes',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'donkey-kick',
        exerciseName: 'Donkey Kick',
        muscle: 'Glutes',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
          { setNumber: 3, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-home-core',
    name: 'Home Core Blast',
    description: 'No equipment core workout',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'at-home',
    exercises: [
      {
        id: '1',
        exerciseId: 'plank-bw',
        exerciseName: 'Plank',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 45 },
          { setNumber: 2, targetReps: 45 },
          { setNumber: 3, targetReps: 45 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'bicycle-crunch',
        exerciseName: 'Bicycle Crunch',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // TRAVEL category templates (5 workouts)
  {
    id: 'preset-travel-quick',
    name: 'Hotel Room Workout',
    description: 'Quick workout for hotel rooms',
    tagIds: ['fullBody'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    exercises: [
      {
        id: '1',
        exerciseId: 'jumping-jack',
        exerciseName: 'Jumping Jacks',
        muscle: 'Full Body',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'squat-jump',
        exerciseName: 'Squat Jump',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
        ],
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-morning',
    name: 'Morning Energizer',
    description: 'Wake up routine for travelers',
    tagIds: ['fullBody'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 15,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    exercises: [
      {
        id: '1',
        exerciseId: 'high-knee',
        exerciseName: 'High Knees',
        muscle: 'Cardio',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
        ],
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: 'arm-circle',
        exerciseName: 'Arm Circles',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
        ],
        restTimerSeconds: 15,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-stretch',
    name: 'Travel Stretch',
    description: 'Relieve travel stiffness',
    tagIds: ['fullBody'],
    tagColor: colors.workout.rest,
    estimatedDuration: 15,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    exercises: [
      {
        id: '1',
        exerciseId: 'standing-stretch',
        exerciseName: 'Standing Side Stretch',
        muscle: 'Full Body',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
        ],
        restTimerSeconds: 10,
      },
      {
        id: '2',
        exerciseId: 'neck-roll',
        exerciseName: 'Neck Roll',
        muscle: 'Neck',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
        ],
        restTimerSeconds: 10,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-circuit',
    name: 'Travel Circuit',
    description: 'Full body circuit - no equipment needed',
    tagIds: ['fullBody'],
    tagColor: colors.workout.fullBody,
    estimatedDuration: 25,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'travel',
    exercises: [
      {
        id: '1',
        exerciseId: 'push-up-travel',
        exerciseName: 'Push Up',
        muscle: 'Chest',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'squat-travel',
        exerciseName: 'Air Squat',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
          { setNumber: 3, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-travel-quick-core',
    name: 'Quick Travel Core',
    description: 'Core workout anywhere',
    tagIds: ['core'],
    tagColor: colors.workout.core,
    estimatedDuration: 10,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'travel',
    exercises: [
      {
        id: '1',
        exerciseId: 'sit-up',
        exerciseName: 'Sit Up',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'russian-twist',
        exerciseName: 'Russian Twist',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // CARDIO category templates (5 workouts)
  {
    id: 'preset-cardio-hiit',
    name: 'HIIT Cardio',
    description: 'High intensity interval training',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 30,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        exerciseId: 'sprint-in-place',
        exerciseName: 'Sprint in Place',
        muscle: 'Cardio',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
          { setNumber: 3, targetReps: 30 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'burpee-cardio',
        exerciseName: 'Burpees',
        muscle: 'Full Body',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
          { setNumber: 3, targetReps: 10 },
        ],
        restTimerSeconds: 45,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-steady',
    name: 'Steady State Cardio',
    description: 'Low intensity steady state workout',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 40,
    difficulty: 'Beginner',
    equipment: 'Gym',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        exerciseId: 'treadmill-walk',
        exerciseName: 'Treadmill Walk (incline)',
        muscle: 'Cardio',
        sets: [{ setNumber: 1, targetReps: 20 }],
        restTimerSeconds: 0,
      },
      {
        id: '2',
        exerciseId: 'elliptical',
        exerciseName: 'Elliptical',
        muscle: 'Cardio',
        sets: [{ setNumber: 1, targetReps: 15 }],
        restTimerSeconds: 0,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-tabata',
    name: 'Tabata Training',
    description: '4-minute intense intervals',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 20,
    difficulty: 'Advanced',
    equipment: 'No Equipment',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        exerciseId: 'jump-squat',
        exerciseName: 'Jump Squat',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
          { setNumber: 3, targetReps: 20 },
          { setNumber: 4, targetReps: 20 },
        ],
        restTimerSeconds: 10,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-dance',
    name: 'Dance Cardio',
    description: 'Fun cardio workout with dance moves',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 30,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        exerciseId: 'high-knee-march',
        exerciseName: 'High Knee March',
        muscle: 'Cardio',
        sets: [
          { setNumber: 1, targetReps: 60 },
          { setNumber: 2, targetReps: 60 },
        ],
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: 'grapevine',
        exerciseName: 'Grapevine Steps',
        muscle: 'Cardio',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
        ],
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-cardio-jump-rope',
    name: 'Jump Rope Workout',
    description: 'Cardio workout with jump rope',
    tagIds: ['cardio'],
    tagColor: colors.workout.cardio,
    estimatedDuration: 25,
    difficulty: 'Intermediate',
    equipment: 'No Equipment',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        exerciseId: 'jump-rope',
        exerciseName: 'Jump Rope',
        muscle: 'Cardio',
        sets: [
          { setNumber: 1, targetReps: 100 },
          { setNumber: 2, targetReps: 100 },
          { setNumber: 3, targetReps: 100 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },

  // REHAB category templates (5 workouts)
  {
    id: 'preset-rehab-shoulder',
    name: 'Shoulder Rehab',
    description: 'Gentle shoulder rehabilitation exercises',
    tagIds: ['shoulders'],
    tagColor: colors.workout.shoulders,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    exercises: [
      {
        id: '1',
        exerciseId: 'pendulum-swing',
        exerciseName: 'Pendulum Swing',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetReps: 20 },
          { setNumber: 2, targetReps: 20 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'external-rotation',
        exerciseName: 'External Rotation',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-rehab-knee',
    name: 'Knee Rehab',
    description: 'Gentle knee rehabilitation exercises',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 25,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    exercises: [
      {
        id: '1',
        exerciseId: 'leg-extension-seated',
        exerciseName: 'Seated Leg Extension',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'heel-slide',
        exerciseName: 'Heel Slide',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
        ],
        restTimerSeconds: 30,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-rehab-back',
    name: 'Lower Back Rehab',
    description: 'Gentle exercises for lower back pain',
    tagIds: ['back'],
    tagColor: colors.workout.back,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    exercises: [
      {
        id: '1',
        exerciseId: 'cat-cow',
        exerciseName: 'Cat-Cow Stretch',
        muscle: 'Back',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
        ],
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: 'pelvic-tilt',
        exerciseName: 'Pelvic Tilt',
        muscle: 'Core',
        sets: [
          { setNumber: 1, targetReps: 15 },
          { setNumber: 2, targetReps: 15 },
        ],
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-rehab-hip',
    name: 'Hip Mobility',
    description: 'Improve hip flexibility and reduce pain',
    tagIds: ['legs'],
    tagColor: colors.workout.legs,
    estimatedDuration: 20,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    exercises: [
      {
        id: '1',
        exerciseId: 'hip-circle',
        exerciseName: 'Hip Circles',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
        ],
        restTimerSeconds: 20,
      },
      {
        id: '2',
        exerciseId: 'pigeon-stretch',
        exerciseName: 'Pigeon Stretch',
        muscle: 'Legs',
        sets: [
          { setNumber: 1, targetReps: 30 },
          { setNumber: 2, targetReps: 30 },
        ],
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-rehab-posture',
    name: 'Posture Correction',
    description: 'Exercises to improve posture',
    tagIds: ['back', 'shoulders'],
    tagColor: colors.workout.back,
    estimatedDuration: 15,
    difficulty: 'Beginner',
    equipment: 'No Equipment',
    category: 'rehab',
    exercises: [
      {
        id: '1',
        exerciseId: 'wall-angel',
        exerciseName: 'Wall Angel',
        muscle: 'Shoulders',
        sets: [
          { setNumber: 1, targetReps: 10 },
          { setNumber: 2, targetReps: 10 },
        ],
        restTimerSeconds: 30,
      },
      {
        id: '2',
        exerciseId: 'chin-tuck',
        exerciseName: 'Chin Tuck',
        muscle: 'Neck',
        sets: [
          { setNumber: 1, targetReps: 12 },
          { setNumber: 2, targetReps: 12 },
        ],
        restTimerSeconds: 20,
      },
    ],
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
];

// Generate folder ID
const generateFolderId = () => `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      presetTemplates: PRESET_TEMPLATES,
      folders: [],
      isSyncing: false,
      lastSyncError: null,

      // Add a preset template to user's library (local only - no backend sync for presets)
      addTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates, { ...template, isPreset: false }],
        }));
      },

      // Remove template from user's library (also removes from backend)
      removeTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
        // If template has a userId, it was synced to backend - delete from there too
        if (template?.userId) {
          deleteUserTemplate(id).catch((err) => {
            console.error('Failed to delete template from backend:', err);
          });
        }
      },

      // Create a new user template (saves to backend if userId provided)
      createTemplate: (input) => {
        const state = get();

        // Auto-create "My Templates" folder if it doesn't exist and this is first template
        let folders = state.folders;
        const hasDefaultFolder = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
        if (!hasDefaultFolder) {
          const defaultFolder: TemplateFolder = {
            id: DEFAULT_FOLDER_ID,
            name: DEFAULT_FOLDER_NAME,
            createdAt: new Date().toISOString(),
            isCollapsed: false,
          };
          folders = [defaultFolder, ...folders];
        }

        // If no folderId specified, put in default "My Templates" folder
        const folderId = input.folderId || DEFAULT_FOLDER_ID;

        const newTemplate: WorkoutTemplate = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isPreset: false,
          folderId,
        };
        set({
          templates: [...state.templates, newTemplate],
          folders,
        });

        // Save to backend if userId is provided
        if (input.userId) {
          saveUserTemplate(input.userId, input)
            .then((backendId) => {
              if (backendId) {
                // Update local template with backend ID
                set((state) => ({
                  templates: state.templates.map((t) =>
                    t.id === newTemplate.id ? { ...t, id: backendId } : t
                  ),
                }));
              }
            })
            .catch((err) => {
              console.error('Failed to save template to backend:', err);
            });
        }

        return newTemplate;
      },

      // Update an existing template (also updates backend)
      updateTemplate: (id, updates) => {
        const template = get().templates.find((t) => t.id === id);
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        // Update on backend if template was synced
        if (template?.userId) {
          updateUserTemplate(id, updates, updates.exercises).catch((err) => {
            console.error('Failed to update template on backend:', err);
          });
        }
      },

      // Get template by ID (checks both user and preset templates)
      getTemplateById: (id) => {
        const { templates, presetTemplates } = get();
        return templates.find((t) => t.id === id) || presetTemplates.find((t) => t.id === id);
      },

      // Get all templates belonging to a specific user
      getTemplatesForUser: (userId) => {
        const { templates } = get();
        if (!userId) return [];
        return templates.filter((t) => t.userId === userId);
      },

      // Check if a preset template is saved in user's library
      isTemplateSaved: (presetId, userId) => {
        const { templates } = get();
        // Check if any user template was created from this preset by this user
        return templates.some(
          (t) =>
            t.userId === userId &&
            (t.id === presetId ||
              t.name === get().presetTemplates.find((p) => p.id === presetId)?.name)
        );
      },

      // Update template exercises from completed workout (also syncs to backend)
      updateTemplateFromWorkout: (templateId, exercises) => {
        const template = get().templates.find((t) => t.id === templateId);
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== templateId) return t;
            return {
              ...t,
              exercises: exercises,
            };
          }),
        }));

        // Update on backend if template was synced
        if (template?.userId) {
          updateUserTemplate(templateId, {}, exercises).catch((err) => {
            console.error('Failed to update template exercises on backend:', err);
          });
        }
      },

      // Reorder templates (for drag-and-drop reordering)
      reorderTemplates: (reorderedTemplates) => {
        set({ templates: reorderedTemplates });
      },

      // Create a new folder
      createFolder: (name) => {
        const newFolder: TemplateFolder = {
          id: generateFolderId(),
          name,
          createdAt: new Date().toISOString(),
          isCollapsed: false,
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder;
      },

      // Rename a folder
      renameFolder: (folderId, newName) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === folderId ? { ...f, name: newName } : f)),
        }));
      },

      // Delete a folder (templates in folder become unfiled)
      // Note: The default "My Templates" folder cannot be deleted
      deleteFolder: (folderId) => {
        // Protect the default folder from deletion
        if (folderId === DEFAULT_FOLDER_ID) {
          console.warn('Cannot delete the default "My Templates" folder');
          return;
        }
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          templates: state.templates.map((t) =>
            t.folderId === folderId ? { ...t, folderId: DEFAULT_FOLDER_ID } : t
          ),
        }));
      },

      // Toggle folder collapsed state
      toggleFolderCollapsed: (folderId) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f
          ),
        }));
      },

      // Move template to a folder (or unfiled if folderId is null)
      moveTemplateToFolder: (templateId, folderId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, folderId: folderId || undefined } : t
          ),
        }));
      },

      // Reorder folders (for drag-and-drop reordering)
      reorderFolders: (reorderedFolders) => {
        set({ folders: reorderedFolders });
      },

      // Sync templates from backend (fetch user's templates from Supabase)
      syncTemplatesFromBackend: async (userId) => {
        set({ isSyncing: true, lastSyncError: null });
        try {
          const backendTemplates = await getUserTemplates(userId);
          if (backendTemplates.length > 0) {
            // Merge backend templates with local (backend takes precedence)
            set((state) => {
              const localOnlyTemplates = state.templates.filter(
                (local) => !backendTemplates.some((backend) => backend.id === local.id)
              );
              return {
                templates: [...backendTemplates, ...localOnlyTemplates],
                isSyncing: false,
              };
            });
          } else {
            set({ isSyncing: false });
          }
        } catch (error: any) {
          console.error('Failed to sync templates from backend:', error);
          set({ isSyncing: false, lastSyncError: error?.message || 'Sync failed' });
        }
      },

      // Save a specific template to backend
      saveTemplateToBackend: async (userId, template) => {
        try {
          const backendId = await saveUserTemplate(userId, template);
          if (backendId) {
            // Update local template with backend ID and userId
            set((state) => ({
              templates: state.templates.map((t) =>
                t.id === template.id ? { ...t, id: backendId, userId } : t
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to save template to backend:', error);
          return false;
        }
      },

      // Delete template from backend
      deleteTemplateFromBackend: async (templateId) => {
        try {
          const success = await deleteUserTemplate(templateId);
          if (success) {
            set((state) => ({
              templates: state.templates.filter((t) => t.id !== templateId),
            }));
          }
          return success;
        } catch (error) {
          console.error('Failed to delete template from backend:', error);
          return false;
        }
      },
    }),
    {
      name: 'template-store',
      storage: createJSONStorage(() => createUserNamespacedStorage('template-store')),
      // Only persist user templates and folders, not preset templates (they're hardcoded)
      partialize: (state) => ({
        templates: state.templates,
        folders: state.folders,
      }),
    }
  )
);

// Helper to calculate total sets in a template
export function getTemplateTotalSets(template: WorkoutTemplate): number {
  return template.exercises.reduce((total, ex) => total + ex.sets.length, 0);
}

// Helper to format duration for display
export function formatTemplateDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
