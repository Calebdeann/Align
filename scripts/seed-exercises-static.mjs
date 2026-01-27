/**
 * DEPRECATED: Legacy seed script using MuscleWiki URLs.
 * Use migrate-exercisedb-premium.mjs with Ascend API/ExerciseDB data instead.
 *
 * Run with: node scripts/seed-exercises-static.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Pre-built exercise data with MuscleWiki video URLs
// Videos are hosted on MuscleWiki's CDN permanently
const EXERCISES = [
  // GLUTES
  { name: 'Barbell Hip Thrust', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-hipthrust-front.mp4' },
  { name: 'Dumbbell Hip Thrust', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-hipthrust-front.mp4' },
  { name: 'Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-glutebridge-front.mp4' },
  { name: 'Single Leg Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-singlelgglutebrdg-front.mp4' },
  { name: 'Cable Kickback', muscle_group: 'glutes', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-kickback-side.mp4' },
  { name: 'Romanian Deadlift', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-romaniandeadlift-front.mp4' },
  { name: 'Dumbbell Romanian Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-romaniandeadlift-front.mp4' },
  { name: 'Single Leg Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-singlelegdeadlift-front.mp4' },
  { name: 'Sumo Deadlift', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-sumodeadlift-front.mp4' },
  { name: 'Kettlebell Swing', muscle_group: 'glutes', equipment: 'kettlebell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-kettlebell-swing-front.mp4' },
  { name: 'Fire Hydrant', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-firehydrant-side.mp4' },
  { name: 'Donkey Kick', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-donkeykick-side.mp4' },
  { name: 'Clamshell', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-clamshell-side.mp4' },
  { name: 'Step Up', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-stepup-side.mp4' },
  { name: 'Dumbbell Step Up', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-stepup-side.mp4' },
  { name: 'Reverse Lunge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-reverselunge-front.mp4' },
  { name: 'Curtsy Lunge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-curtsylunge-front.mp4' },
  { name: 'Bulgarian Split Squat', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-bulgariansplitsquat-side.mp4' },
  { name: 'Dumbbell Bulgarian Split Squat', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-bulgariansplitsquat-side.mp4' },
  { name: 'Hip Abductor Machine', muscle_group: 'glutes', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-hipabductor-front.mp4' },

  // QUADS
  { name: 'Barbell Squat', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-squat-front.mp4' },
  { name: 'Goblet Squat', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-gobletsquat-front.mp4' },
  { name: 'Dumbbell Squat', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-squat-front.mp4' },
  { name: 'Front Squat', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-frontsquat-front.mp4' },
  { name: 'Leg Press', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-legpress-side.mp4' },
  { name: 'Hack Squat', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-hacksquat-side.mp4' },
  { name: 'Smith Machine Squat', muscle_group: 'quads', equipment: 'smith machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-smith-squat-front.mp4' },
  { name: 'Leg Extension', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-legextension-side.mp4' },
  { name: 'Walking Lunge', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-walkinglunge-front.mp4' },
  { name: 'Dumbbell Lunge', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-lunge-front.mp4' },
  { name: 'Barbell Lunge', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-lunge-front.mp4' },
  { name: 'Split Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-splitsquat-side.mp4' },
  { name: 'Wall Sit', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-wallsit-side.mp4' },
  { name: 'Bodyweight Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-squat-front.mp4' },
  { name: 'Jump Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-jumpsquat-front.mp4' },
  { name: 'Pistol Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-pistolsquat-side.mp4' },

  // HAMSTRINGS
  { name: 'Lying Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-lyinglegcurl-side.mp4' },
  { name: 'Seated Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-seatedlegcurl-side.mp4' },
  { name: 'Standing Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-standinglegcurl-side.mp4' },
  { name: 'Nordic Curl', muscle_group: 'hamstrings', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-nordiccurl-side.mp4' },
  { name: 'Good Morning', muscle_group: 'hamstrings', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-goodmorning-side.mp4' },
  { name: 'Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-stifflegdeadlift-front.mp4' },
  { name: 'Dumbbell Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-stifflegdeadlift-front.mp4' },

  // BACK
  { name: 'Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-latpulldown-front.mp4' },
  { name: 'Wide Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-widegriplatpulldown-front.mp4' },
  { name: 'Close Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-closegriplatpulldown-front.mp4' },
  { name: 'Pull Up', muscle_group: 'lats', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-pullup-front.mp4' },
  { name: 'Assisted Pull Up', muscle_group: 'lats', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-assistedpullup-front.mp4' },
  { name: 'Chin Up', muscle_group: 'lats', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-chinup-front.mp4' },
  { name: 'Barbell Row', muscle_group: 'upper back', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-bentoverrow-side.mp4' },
  { name: 'Dumbbell Row', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-row-side.mp4' },
  { name: 'Single Arm Dumbbell Row', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-singlearmrow-side.mp4' },
  { name: 'Seated Cable Row', muscle_group: 'upper back', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-seatedrow-side.mp4' },
  { name: 'T-Bar Row', muscle_group: 'upper back', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-tbarrow-side.mp4' },
  { name: 'Face Pull', muscle_group: 'upper back', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-facepull-front.mp4' },
  { name: 'Reverse Fly', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-reversefly-side.mp4' },
  { name: 'Straight Arm Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-straightarmpulldown-side.mp4' },
  { name: 'Inverted Row', muscle_group: 'upper back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-invertedrow-side.mp4' },
  { name: 'Hyperextension', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-hyperextension-side.mp4' },
  { name: 'Back Extension', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-backextension-side.mp4' },
  { name: 'Superman', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-superman-side.mp4' },

  // CHEST
  { name: 'Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-benchpress-front.mp4' },
  { name: 'Dumbbell Bench Press', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-benchpress-front.mp4' },
  { name: 'Incline Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-inclinebenchpress-front.mp4' },
  { name: 'Incline Dumbbell Press', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-inclinebenchpress-front.mp4' },
  { name: 'Decline Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-declinebenchpress-front.mp4' },
  { name: 'Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-pushup-side.mp4' },
  { name: 'Wide Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-widepushup-side.mp4' },
  { name: 'Diamond Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-diamondpushup-side.mp4' },
  { name: 'Knee Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-kneepushup-side.mp4' },
  { name: 'Incline Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-inclinepushup-side.mp4' },
  { name: 'Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-fly-front.mp4' },
  { name: 'Incline Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-inclinefly-front.mp4' },
  { name: 'Cable Fly', muscle_group: 'chest', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-fly-front.mp4' },
  { name: 'Cable Crossover', muscle_group: 'chest', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-crossover-front.mp4' },
  { name: 'Machine Chest Press', muscle_group: 'chest', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-chestpress-front.mp4' },
  { name: 'Pec Deck Fly', muscle_group: 'chest', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-pecdeck-front.mp4' },

  // SHOULDERS
  { name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-overheadpress-front.mp4' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-shoulderpress-front.mp4' },
  { name: 'Seated Dumbbell Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-seatedshoulderpress-front.mp4' },
  { name: 'Arnold Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-arnoldpress-front.mp4' },
  { name: 'Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-lateralraise-front.mp4' },
  { name: 'Cable Lateral Raise', muscle_group: 'shoulders', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-lateralraise-front.mp4' },
  { name: 'Front Raise', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-frontraise-front.mp4' },
  { name: 'Upright Row', muscle_group: 'shoulders', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-uprightrow-front.mp4' },
  { name: 'Rear Delt Fly', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-reardeltfly-side.mp4' },
  { name: 'Reverse Pec Deck', muscle_group: 'shoulders', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-reversepecdeck-side.mp4' },
  { name: 'Machine Shoulder Press', muscle_group: 'shoulders', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-shoulderpress-front.mp4' },
  { name: 'Pike Push Up', muscle_group: 'shoulders', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-pikepushup-side.mp4' },
  { name: 'Barbell Shrug', muscle_group: 'traps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-shrug-front.mp4' },
  { name: 'Dumbbell Shrug', muscle_group: 'traps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-shrug-front.mp4' },

  // BICEPS
  { name: 'Barbell Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-curl-front.mp4' },
  { name: 'Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-curl-front.mp4' },
  { name: 'Hammer Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-hammercurl-front.mp4' },
  { name: 'Concentration Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-concentrationcurl-front.mp4' },
  { name: 'Preacher Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-preachercurl-front.mp4' },
  { name: 'Cable Curl', muscle_group: 'biceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-curl-front.mp4' },
  { name: 'Incline Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-inclinecurl-side.mp4' },
  { name: 'EZ Bar Curl', muscle_group: 'biceps', equipment: 'ez barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-ezbar-curl-front.mp4' },
  { name: 'Spider Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-spidercurl-side.mp4' },
  { name: 'Reverse Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-reversecurl-front.mp4' },

  // TRICEPS
  { name: 'Tricep Pushdown', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-pushdown-front.mp4' },
  { name: 'Rope Pushdown', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-ropepushdown-front.mp4' },
  { name: 'Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-overheadtricepextension-front.mp4' },
  { name: 'Cable Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-overheadtricepextension-side.mp4' },
  { name: 'Skull Crusher', muscle_group: 'triceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-skullcrusher-side.mp4' },
  { name: 'Dumbbell Skull Crusher', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-skullcrusher-side.mp4' },
  { name: 'Tricep Dip', muscle_group: 'triceps', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-tricepdip-side.mp4' },
  { name: 'Bench Dip', muscle_group: 'triceps', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-benchdip-side.mp4' },
  { name: 'Close Grip Bench Press', muscle_group: 'triceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-barbell-closegripbenchpress-front.mp4' },
  { name: 'Tricep Kickback', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-kickback-side.mp4' },

  // CORE/ABS
  { name: 'Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-crunch-front.mp4' },
  { name: 'Bicycle Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-bicyclecrunch-front.mp4' },
  { name: 'Reverse Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-reversecrunch-front.mp4' },
  { name: 'Cable Crunch', muscle_group: 'abs', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-cable-crunch-side.mp4' },
  { name: 'Plank', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-plank-side.mp4' },
  { name: 'Side Plank', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-sideplank-front.mp4' },
  { name: 'Mountain Climber', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-mountainclimber-side.mp4' },
  { name: 'Leg Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-lyinglegraise-side.mp4' },
  { name: 'Hanging Leg Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-hanginglegraise-front.mp4' },
  { name: 'Hanging Knee Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-hangingkneeraise-front.mp4' },
  { name: 'Russian Twist', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-russiantwist-front.mp4' },
  { name: 'Dead Bug', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-deadbug-side.mp4' },
  { name: 'Bird Dog', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-birddog-side.mp4' },
  { name: 'Ab Wheel Rollout', muscle_group: 'abs', equipment: 'wheel roller', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-abroller-rollout-side.mp4' },
  { name: 'Flutter Kick', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-flutterkick-side.mp4' },
  { name: 'V Up', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-vup-side.mp4' },
  { name: 'Sit Up', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-situp-side.mp4' },

  // CALVES
  { name: 'Standing Calf Raise', muscle_group: 'calves', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-standingcalfraise-side.mp4' },
  { name: 'Seated Calf Raise', muscle_group: 'calves', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-machine-seatedcalfraise-side.mp4' },
  { name: 'Dumbbell Calf Raise', muscle_group: 'calves', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-dumbbell-calfraise-side.mp4' },
  { name: 'Bodyweight Calf Raise', muscle_group: 'calves', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/female-bodyweight-calfraise-side.mp4' },
];

async function seedExercises() {
  console.log(`\nSeeding ${EXERCISES.length} exercises...\n`);

  // Don't delete existing - just upsert
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of EXERCISES) {
    // Check if exercise already exists
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', exercise.name)
      .single();

    // Convert equipment to array format for Postgres
    const insertData = {
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: [exercise.equipment], // Wrap in array
      image_url: exercise.image_url
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('exercises')
        .update({
          muscle_group: exercise.muscle_group,
          equipment: [exercise.equipment], // Wrap in array
          image_url: exercise.image_url
        })
        .eq('id', existing.id);

      if (error) {
        console.log(`Failed to update ${exercise.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`Updated: ${exercise.name}`);
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('exercises')
        .insert(insertData);

      if (error) {
        console.log(`Failed to insert ${exercise.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`Inserted: ${exercise.name}`);
        inserted++;
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${EXERCISES.length}`);
}

seedExercises().catch(console.error);
