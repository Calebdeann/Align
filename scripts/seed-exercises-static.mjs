/**
 * Seed script with pre-fetched exercise data (no API calls needed)
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
  { name: 'Barbell Hip Thrust', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-hipthrust-front.mp4' },
  { name: 'Dumbbell Hip Thrust', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-hipthrust-front.mp4' },
  { name: 'Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-glutebridge-front.mp4' },
  { name: 'Single Leg Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-singlelgglutebrdg-front.mp4' },
  { name: 'Cable Kickback', muscle_group: 'glutes', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-kickback-side.mp4' },
  { name: 'Romanian Deadlift', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-romaniandeadlift-front.mp4' },
  { name: 'Dumbbell Romanian Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-romaniandeadlift-front.mp4' },
  { name: 'Single Leg Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-singlelegdeadlift-front.mp4' },
  { name: 'Sumo Deadlift', muscle_group: 'glutes', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-sumodeadlift-front.mp4' },
  { name: 'Kettlebell Swing', muscle_group: 'glutes', equipment: 'kettlebell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-kettlebell-swing-front.mp4' },
  { name: 'Fire Hydrant', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-firehydrant-side.mp4' },
  { name: 'Donkey Kick', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-donkeykick-side.mp4' },
  { name: 'Clamshell', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-clamshell-side.mp4' },
  { name: 'Step Up', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-stepup-side.mp4' },
  { name: 'Dumbbell Step Up', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-stepup-side.mp4' },
  { name: 'Reverse Lunge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-reverselunge-front.mp4' },
  { name: 'Curtsy Lunge', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-curtsylunge-front.mp4' },
  { name: 'Bulgarian Split Squat', muscle_group: 'glutes', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-bulgariansplitsquat-side.mp4' },
  { name: 'Dumbbell Bulgarian Split Squat', muscle_group: 'glutes', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-bulgariansplitsquat-side.mp4' },
  { name: 'Hip Abductor Machine', muscle_group: 'glutes', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-hipabductor-front.mp4' },

  // QUADS
  { name: 'Barbell Squat', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-squat-front.mp4' },
  { name: 'Goblet Squat', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-gobletsquat-front.mp4' },
  { name: 'Dumbbell Squat', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-squat-front.mp4' },
  { name: 'Front Squat', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-frontsquat-front.mp4' },
  { name: 'Leg Press', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-legpress-side.mp4' },
  { name: 'Hack Squat', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-hacksquat-side.mp4' },
  { name: 'Smith Machine Squat', muscle_group: 'quads', equipment: 'smith machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-smith-squat-front.mp4' },
  { name: 'Leg Extension', muscle_group: 'quads', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-legextension-side.mp4' },
  { name: 'Walking Lunge', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-walkinglunge-front.mp4' },
  { name: 'Dumbbell Lunge', muscle_group: 'quads', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-lunge-front.mp4' },
  { name: 'Barbell Lunge', muscle_group: 'quads', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-lunge-front.mp4' },
  { name: 'Split Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-splitsquat-side.mp4' },
  { name: 'Wall Sit', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-wallsit-side.mp4' },
  { name: 'Bodyweight Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-squat-front.mp4' },
  { name: 'Jump Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-jumpsquat-front.mp4' },
  { name: 'Pistol Squat', muscle_group: 'quads', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pistolsquat-side.mp4' },

  // HAMSTRINGS
  { name: 'Lying Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-lyinglegcurl-side.mp4' },
  { name: 'Seated Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-seatedlegcurl-side.mp4' },
  { name: 'Standing Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-standinglegcurl-side.mp4' },
  { name: 'Nordic Curl', muscle_group: 'hamstrings', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-nordiccurl-side.mp4' },
  { name: 'Good Morning', muscle_group: 'hamstrings', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-goodmorning-side.mp4' },
  { name: 'Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-stifflegdeadlift-front.mp4' },
  { name: 'Dumbbell Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-stifflegdeadlift-front.mp4' },

  // BACK
  { name: 'Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-latpulldown-front.mp4' },
  { name: 'Wide Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-widegriplatpulldown-front.mp4' },
  { name: 'Close Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-closegriplatpulldown-front.mp4' },
  { name: 'Pull Up', muscle_group: 'lats', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pullup-front.mp4' },
  { name: 'Assisted Pull Up', muscle_group: 'lats', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-assistedpullup-front.mp4' },
  { name: 'Chin Up', muscle_group: 'lats', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-chinup-front.mp4' },
  { name: 'Barbell Row', muscle_group: 'upper back', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bentoverrow-side.mp4' },
  { name: 'Dumbbell Row', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-row-side.mp4' },
  { name: 'Single Arm Dumbbell Row', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-singlearmrow-side.mp4' },
  { name: 'Seated Cable Row', muscle_group: 'upper back', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-seatedrow-side.mp4' },
  { name: 'T-Bar Row', muscle_group: 'upper back', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-tbarrow-side.mp4' },
  { name: 'Face Pull', muscle_group: 'upper back', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-facepull-front.mp4' },
  { name: 'Reverse Fly', muscle_group: 'upper back', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-reversefly-side.mp4' },
  { name: 'Straight Arm Pulldown', muscle_group: 'lats', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-straightarmpulldown-side.mp4' },
  { name: 'Inverted Row', muscle_group: 'upper back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-invertedrow-side.mp4' },
  { name: 'Hyperextension', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-hyperextension-side.mp4' },
  { name: 'Back Extension', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-backextension-side.mp4' },
  { name: 'Superman', muscle_group: 'lower back', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-superman-side.mp4' },

  // CHEST
  { name: 'Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-benchpress-front.mp4' },
  { name: 'Dumbbell Bench Press', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-benchpress-front.mp4' },
  { name: 'Incline Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-inclinebenchpress-front.mp4' },
  { name: 'Incline Dumbbell Press', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-inclinebenchpress-front.mp4' },
  { name: 'Decline Bench Press', muscle_group: 'chest', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-declinebenchpress-front.mp4' },
  { name: 'Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pushup-side.mp4' },
  { name: 'Wide Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-widepushup-side.mp4' },
  { name: 'Diamond Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-diamondpushup-side.mp4' },
  { name: 'Knee Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-kneepushup-side.mp4' },
  { name: 'Incline Push Up', muscle_group: 'chest', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-inclinepushup-side.mp4' },
  { name: 'Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-fly-front.mp4' },
  { name: 'Incline Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-inclinefly-front.mp4' },
  { name: 'Cable Fly', muscle_group: 'chest', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-fly-front.mp4' },
  { name: 'Cable Crossover', muscle_group: 'chest', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-crossover-front.mp4' },
  { name: 'Machine Chest Press', muscle_group: 'chest', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-chestpress-front.mp4' },
  { name: 'Pec Deck Fly', muscle_group: 'chest', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-pecdeck-front.mp4' },

  // SHOULDERS
  { name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-overheadpress-front.mp4' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-shoulderpress-front.mp4' },
  { name: 'Seated Dumbbell Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-seatedshoulderpress-front.mp4' },
  { name: 'Arnold Press', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-arnoldpress-front.mp4' },
  { name: 'Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-lateralraise-front.mp4' },
  { name: 'Cable Lateral Raise', muscle_group: 'shoulders', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-lateralraise-front.mp4' },
  { name: 'Front Raise', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-frontraise-front.mp4' },
  { name: 'Upright Row', muscle_group: 'shoulders', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-uprightrow-front.mp4' },
  { name: 'Rear Delt Fly', muscle_group: 'shoulders', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-reardeltfly-side.mp4' },
  { name: 'Reverse Pec Deck', muscle_group: 'shoulders', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-reversepecdeck-side.mp4' },
  { name: 'Machine Shoulder Press', muscle_group: 'shoulders', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-shoulderpress-front.mp4' },
  { name: 'Pike Push Up', muscle_group: 'shoulders', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pikepushup-side.mp4' },
  { name: 'Barbell Shrug', muscle_group: 'traps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-shrug-front.mp4' },
  { name: 'Dumbbell Shrug', muscle_group: 'traps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-shrug-front.mp4' },

  // BICEPS
  { name: 'Barbell Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-curl-front.mp4' },
  { name: 'Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-curl-front.mp4' },
  { name: 'Hammer Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-hammercurl-front.mp4' },
  { name: 'Concentration Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-concentrationcurl-front.mp4' },
  { name: 'Preacher Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-preachercurl-front.mp4' },
  { name: 'Cable Curl', muscle_group: 'biceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-curl-front.mp4' },
  { name: 'Incline Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-inclinecurl-side.mp4' },
  { name: 'EZ Bar Curl', muscle_group: 'biceps', equipment: 'ez barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-ezbar-curl-front.mp4' },
  { name: 'Spider Curl', muscle_group: 'biceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-spidercurl-side.mp4' },
  { name: 'Reverse Curl', muscle_group: 'biceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-reversecurl-front.mp4' },

  // TRICEPS
  { name: 'Tricep Pushdown', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-pushdown-front.mp4' },
  { name: 'Rope Pushdown', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-ropepushdown-front.mp4' },
  { name: 'Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-overheadtricepextension-front.mp4' },
  { name: 'Cable Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-overheadtricepextension-side.mp4' },
  { name: 'Skull Crusher', muscle_group: 'triceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-skullcrusher-side.mp4' },
  { name: 'Dumbbell Skull Crusher', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-skullcrusher-side.mp4' },
  { name: 'Tricep Dip', muscle_group: 'triceps', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-tricepdip-side.mp4' },
  { name: 'Bench Dip', muscle_group: 'triceps', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-benchdip-side.mp4' },
  { name: 'Close Grip Bench Press', muscle_group: 'triceps', equipment: 'barbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-closegripbenchpress-front.mp4' },
  { name: 'Tricep Kickback', muscle_group: 'triceps', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-kickback-side.mp4' },

  // CORE/ABS
  { name: 'Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-crunch-front.mp4' },
  { name: 'Bicycle Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-bicyclecrunch-front.mp4' },
  { name: 'Reverse Crunch', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-reversecrunch-front.mp4' },
  { name: 'Cable Crunch', muscle_group: 'abs', equipment: 'cable', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-cable-crunch-side.mp4' },
  { name: 'Plank', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-plank-side.mp4' },
  { name: 'Side Plank', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-sideplank-front.mp4' },
  { name: 'Mountain Climber', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-mountainclimber-side.mp4' },
  { name: 'Leg Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-lyinglegraise-side.mp4' },
  { name: 'Hanging Leg Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-hanginglegraise-front.mp4' },
  { name: 'Hanging Knee Raise', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-hangingkneeraise-front.mp4' },
  { name: 'Russian Twist', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-russiantwist-front.mp4' },
  { name: 'Dead Bug', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-deadbug-side.mp4' },
  { name: 'Bird Dog', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-birddog-side.mp4' },
  { name: 'Ab Wheel Rollout', muscle_group: 'abs', equipment: 'wheel roller', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-abroller-rollout-side.mp4' },
  { name: 'Flutter Kick', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-flutterkick-side.mp4' },
  { name: 'V Up', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-vup-side.mp4' },
  { name: 'Sit Up', muscle_group: 'abs', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-situp-side.mp4' },

  // CALVES
  { name: 'Standing Calf Raise', muscle_group: 'calves', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-standingcalfraise-side.mp4' },
  { name: 'Seated Calf Raise', muscle_group: 'calves', equipment: 'machine', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-seatedcalfraise-side.mp4' },
  { name: 'Dumbbell Calf Raise', muscle_group: 'calves', equipment: 'dumbbell', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-calfraise-side.mp4' },
  { name: 'Bodyweight Calf Raise', muscle_group: 'calves', equipment: 'body weight', image_url: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-calfraise-side.mp4' },
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
