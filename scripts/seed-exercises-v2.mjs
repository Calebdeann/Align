// Seed script using free-exercise-db (GitHub hosted images, no auth required)
// https://github.com/yuhonas/free-exercise-db

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Base URL for images
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// Curated exercises for women-focused workouts
// Format: { name, muscle_group, equipment, imageFolder }
const EXERCISES = [
  // GLUTES (30 exercises)
  { name: 'Barbell Hip Thrust', muscle_group: 'glutes', equipment: 'barbell', imageFolder: 'Barbell_Hip_Thrust' },
  { name: 'Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Glute_Bridge' },
  { name: 'Single Leg Glute Bridge', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Single_Leg_Glute_Kickback_-_Kneeling' },
  { name: 'Cable Kickback', muscle_group: 'glutes', equipment: 'cable', imageFolder: 'Cable_Hip_Adduction' },
  { name: 'Sumo Deadlift', muscle_group: 'glutes', equipment: 'barbell', imageFolder: 'Sumo_Deadlift' },
  { name: 'Romanian Deadlift', muscle_group: 'glutes', equipment: 'barbell', imageFolder: 'Romanian_Deadlift_With_Dumbbells' },
  { name: 'Dumbbell Romanian Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Romanian_Deadlift_With_Dumbbells' },
  { name: 'Curtsy Lunge', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Dumbbell_Lunges_Walking' },
  { name: 'Step Up', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Dumbbell_Step_Ups' },
  { name: 'Dumbbell Step Up', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Dumbbell_Step_Ups' },
  { name: 'Cable Pull Through', muscle_group: 'glutes', equipment: 'cable', imageFolder: 'Cable_Hip_Adduction' },
  { name: 'Fire Hydrant', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'All_Fours_Squad_Stretch' },
  { name: 'Donkey Kick', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Single_Leg_Glute_Kickback_-_Kneeling' },
  { name: 'Frog Pump', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Glute_Bridge' },
  { name: 'Good Morning', muscle_group: 'glutes', equipment: 'barbell', imageFolder: 'Good_Morning' },
  { name: 'Kettlebell Swing', muscle_group: 'glutes', equipment: 'kettlebell', imageFolder: 'Kettlebell_One-Legged_Deadlift' },
  { name: 'Bulgarian Split Squat', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Dumbbell_Rear_Lunge' },
  { name: 'Single Leg Deadlift', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Kettlebell_One-Legged_Deadlift' },
  { name: 'Hip Abduction Machine', muscle_group: 'glutes', equipment: 'machine', imageFolder: 'Thigh_Abductor' },
  { name: 'Cable Hip Abduction', muscle_group: 'glutes', equipment: 'cable', imageFolder: 'Thigh_Abductor' },
  { name: 'Banded Clamshell', muscle_group: 'glutes', equipment: 'bands', imageFolder: 'All_Fours_Squad_Stretch' },
  { name: 'Banded Glute Bridge', muscle_group: 'glutes', equipment: 'bands', imageFolder: 'Glute_Bridge' },
  { name: 'Banded Side Walk', muscle_group: 'glutes', equipment: 'bands', imageFolder: 'Side_Lunge_Stretch' },
  { name: 'Smith Machine Hip Thrust', muscle_group: 'glutes', equipment: 'machine', imageFolder: 'Barbell_Hip_Thrust' },
  { name: 'Reverse Lunge', muscle_group: 'glutes', equipment: 'body weight', imageFolder: 'Dumbbell_Rear_Lunge' },
  { name: 'Dumbbell Reverse Lunge', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Dumbbell_Rear_Lunge' },
  { name: 'Goblet Squat', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Goblet_Squat' },
  { name: 'Sumo Squat', muscle_group: 'glutes', equipment: 'dumbbell', imageFolder: 'Dumbbell_Sumo_Squat' },
  { name: 'Kickback Machine', muscle_group: 'glutes', equipment: 'machine', imageFolder: 'Single_Leg_Glute_Kickback_-_Kneeling' },
  { name: 'Glute Ham Raise', muscle_group: 'glutes', equipment: 'machine', imageFolder: 'Floor_Glute-Ham_Raise' },

  // QUADS (25 exercises)
  { name: 'Barbell Squat', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Front Squat', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Leg Press', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Leg_Press' },
  { name: 'Leg Extension', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Leg_Extensions' },
  { name: 'Walking Lunge', muscle_group: 'quads', equipment: 'dumbbell', imageFolder: 'Dumbbell_Lunges_Walking' },
  { name: 'Dumbbell Lunge', muscle_group: 'quads', equipment: 'dumbbell', imageFolder: 'Dumbbell_Lunge' },
  { name: 'Bodyweight Squat', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Bodyweight_Squat' },
  { name: 'Hack Squat', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Barbell_Hack_Squat' },
  { name: 'Smith Machine Squat', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Sissy Squat', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Bodyweight_Squat' },
  { name: 'Box Squat', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Narrow Stance Leg Press', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Leg_Press' },
  { name: 'Wall Sit', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Bodyweight_Squat' },
  { name: 'Split Squat', muscle_group: 'quads', equipment: 'dumbbell', imageFolder: 'Dumbbell_Rear_Lunge' },
  { name: 'Pistol Squat', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Pistol_Squat' },
  { name: 'Jump Squat', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Freehand_Jump_Squat' },
  { name: 'Dumbbell Squat', muscle_group: 'quads', equipment: 'dumbbell', imageFolder: 'Dumbbell_Squat' },
  { name: 'Pendulum Squat', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Barbell_Full_Squat' },
  { name: 'V Squat Machine', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Lunges', muscle_group: 'quads', equipment: 'body weight', imageFolder: 'Dumbbell_Lunge' },
  { name: 'Barbell Lunge', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Lunge' },
  { name: 'Side Lunge', muscle_group: 'quads', equipment: 'dumbbell', imageFolder: 'Dumbbell_Side_Lunge' },
  { name: 'Pause Squat', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Tempo Squat', muscle_group: 'quads', equipment: 'barbell', imageFolder: 'Barbell_Full_Squat' },
  { name: 'Single Leg Press', muscle_group: 'quads', equipment: 'machine', imageFolder: 'Leg_Press' },

  // HAMSTRINGS (15 exercises)
  { name: 'Lying Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', imageFolder: 'Lying_Leg_Curls' },
  { name: 'Seated Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', imageFolder: 'Seated_Leg_Curl' },
  { name: 'Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'barbell', imageFolder: 'Stiff-Legged_Dumbbell_Deadlift' },
  { name: 'Nordic Curl', muscle_group: 'hamstrings', equipment: 'body weight', imageFolder: 'Floor_Glute-Ham_Raise' },
  { name: 'Standing Leg Curl', muscle_group: 'hamstrings', equipment: 'machine', imageFolder: 'Standing_Leg_Curl' },
  { name: 'Dumbbell Stiff Leg Deadlift', muscle_group: 'hamstrings', equipment: 'dumbbell', imageFolder: 'Stiff-Legged_Dumbbell_Deadlift' },
  { name: 'Swiss Ball Leg Curl', muscle_group: 'hamstrings', equipment: 'exercise ball', imageFolder: 'Lying_Leg_Curls' },
  { name: 'Slider Leg Curl', muscle_group: 'hamstrings', equipment: 'body weight', imageFolder: 'Lying_Leg_Curls' },
  { name: 'Cable Leg Curl', muscle_group: 'hamstrings', equipment: 'cable', imageFolder: 'Lying_Leg_Curls' },
  { name: 'Barbell Deadlift', muscle_group: 'hamstrings', equipment: 'barbell', imageFolder: 'Barbell_Deadlift' },
  { name: 'Trap Bar Deadlift', muscle_group: 'hamstrings', equipment: 'barbell', imageFolder: 'Barbell_Deadlift' },
  { name: 'Dumbbell Deadlift', muscle_group: 'hamstrings', equipment: 'dumbbell', imageFolder: 'Romanian_Deadlift_With_Dumbbells' },
  { name: 'Cable Romanian Deadlift', muscle_group: 'hamstrings', equipment: 'cable', imageFolder: 'Romanian_Deadlift_With_Dumbbells' },
  { name: 'Banded Leg Curl', muscle_group: 'hamstrings', equipment: 'bands', imageFolder: 'Lying_Leg_Curls' },
  { name: 'Reverse Hyperextension', muscle_group: 'hamstrings', equipment: 'machine', imageFolder: 'Hyperextensions_Back_Extensions' },

  // CALVES (8 exercises)
  { name: 'Standing Calf Raise', muscle_group: 'calves', equipment: 'machine', imageFolder: 'Standing_Calf_Raises' },
  { name: 'Seated Calf Raise', muscle_group: 'calves', equipment: 'machine', imageFolder: 'Seated_Calf_Raise' },
  { name: 'Leg Press Calf Raise', muscle_group: 'calves', equipment: 'machine', imageFolder: 'Calf_Press_On_The_Leg_Press_Machine' },
  { name: 'Dumbbell Calf Raise', muscle_group: 'calves', equipment: 'dumbbell', imageFolder: 'Dumbbell_Calf_Raise' },
  { name: 'Smith Machine Calf Raise', muscle_group: 'calves', equipment: 'machine', imageFolder: 'Smith_Machine_Calf_Raise' },
  { name: 'Donkey Calf Raise', muscle_group: 'calves', equipment: 'machine', imageFolder: 'Donkey_Calf_Raises' },
  { name: 'Single Leg Calf Raise', muscle_group: 'calves', equipment: 'body weight', imageFolder: 'Standing_Calf_Raises' },
  { name: 'Bodyweight Calf Raise', muscle_group: 'calves', equipment: 'body weight', imageFolder: 'Standing_Calf_Raises' },

  // BACK (25 exercises)
  { name: 'Lat Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Wide-Grip_Lat_Pulldown' },
  { name: 'Pull Up', muscle_group: 'lats', equipment: 'body weight', imageFolder: 'Pullups' },
  { name: 'Chin Up', muscle_group: 'lats', equipment: 'body weight', imageFolder: 'Chin-Up' },
  { name: 'Barbell Row', muscle_group: 'upper back', equipment: 'barbell', imageFolder: 'Bent_Over_Barbell_Row' },
  { name: 'Dumbbell Row', muscle_group: 'upper back', equipment: 'dumbbell', imageFolder: 'One-Arm_Dumbbell_Row' },
  { name: 'Seated Cable Row', muscle_group: 'upper back', equipment: 'cable', imageFolder: 'Seated_Cable_Rows' },
  { name: 'T-Bar Row', muscle_group: 'upper back', equipment: 'barbell', imageFolder: 'Lying_T-Bar_Row' },
  { name: 'Face Pull', muscle_group: 'upper back', equipment: 'cable', imageFolder: 'Face_Pull' },
  { name: 'Straight Arm Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Straight-Arm_Pulldown' },
  { name: 'Single Arm Lat Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Wide-Grip_Lat_Pulldown' },
  { name: 'Close Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Close-Grip_Front_Lat_Pulldown' },
  { name: 'Inverted Row', muscle_group: 'upper back', equipment: 'body weight', imageFolder: 'Inverted_Row' },
  { name: 'Chest Supported Row', muscle_group: 'upper back', equipment: 'dumbbell', imageFolder: 'Incline_Dumbbell_Row' },
  { name: 'Meadows Row', muscle_group: 'upper back', equipment: 'barbell', imageFolder: 'Bent_Over_Barbell_Row' },
  { name: 'Pendlay Row', muscle_group: 'upper back', equipment: 'barbell', imageFolder: 'Bent_Over_Barbell_Row' },
  { name: 'Machine Row', muscle_group: 'upper back', equipment: 'machine', imageFolder: 'Machine_Seated_Row' },
  { name: 'Cable Row', muscle_group: 'upper back', equipment: 'cable', imageFolder: 'Seated_Cable_Rows' },
  { name: 'Neutral Grip Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Close-Grip_Front_Lat_Pulldown' },
  { name: 'Wide Grip Lat Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Wide-Grip_Lat_Pulldown' },
  { name: 'Behind Neck Lat Pulldown', muscle_group: 'lats', equipment: 'cable', imageFolder: 'Wide-Grip_Lat_Pulldown' },
  { name: 'Assisted Pull Up', muscle_group: 'lats', equipment: 'machine', imageFolder: 'Pullups' },
  { name: 'Back Extension', muscle_group: 'lower back', equipment: 'body weight', imageFolder: 'Hyperextensions_Back_Extensions' },
  { name: 'Hyperextension', muscle_group: 'lower back', equipment: 'machine', imageFolder: 'Hyperextensions_Back_Extensions' },
  { name: 'Superman', muscle_group: 'lower back', equipment: 'body weight', imageFolder: 'Superman' },
  { name: 'Rack Pull', muscle_group: 'lower back', equipment: 'barbell', imageFolder: 'Barbell_Deadlift' },

  // CHEST (20 exercises)
  { name: 'Barbell Bench Press', muscle_group: 'chest', equipment: 'barbell', imageFolder: 'Barbell_Bench_Press_-_Medium_Grip' },
  { name: 'Dumbbell Bench Press', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Dumbbell_Bench_Press' },
  { name: 'Incline Barbell Bench Press', muscle_group: 'chest', equipment: 'barbell', imageFolder: 'Barbell_Incline_Bench_Press_-_Medium_Grip' },
  { name: 'Incline Dumbbell Press', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Incline_Dumbbell_Press' },
  { name: 'Push Up', muscle_group: 'chest', equipment: 'body weight', imageFolder: 'Pushups' },
  { name: 'Cable Fly', muscle_group: 'chest', equipment: 'cable', imageFolder: 'Cable_Crossover' },
  { name: 'Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Dumbbell_Flyes' },
  { name: 'Pec Deck', muscle_group: 'chest', equipment: 'machine', imageFolder: 'Butterfly' },
  { name: 'Chest Press Machine', muscle_group: 'chest', equipment: 'machine', imageFolder: 'Machine_Bench_Press' },
  { name: 'Decline Bench Press', muscle_group: 'chest', equipment: 'barbell', imageFolder: 'Decline_Barbell_Bench_Press' },
  { name: 'Incline Cable Fly', muscle_group: 'chest', equipment: 'cable', imageFolder: 'Cable_Crossover' },
  { name: 'Decline Dumbbell Press', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Decline_Dumbbell_Bench_Press' },
  { name: 'Wide Push Up', muscle_group: 'chest', equipment: 'body weight', imageFolder: 'Wide-Grip_Push-Up' },
  { name: 'Diamond Push Up', muscle_group: 'chest', equipment: 'body weight', imageFolder: 'Pushups' },
  { name: 'Incline Push Up', muscle_group: 'chest', equipment: 'body weight', imageFolder: 'Pushups' },
  { name: 'Decline Push Up', muscle_group: 'chest', equipment: 'body weight', imageFolder: 'Decline_Push-Up' },
  { name: 'Smith Machine Bench Press', muscle_group: 'chest', equipment: 'machine', imageFolder: 'Smith_Machine_Bench_Press' },
  { name: 'Landmine Press', muscle_group: 'chest', equipment: 'barbell', imageFolder: 'Dumbbell_Bench_Press' },
  { name: 'Svend Press', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Dumbbell_Bench_Press' },
  { name: 'Incline Dumbbell Fly', muscle_group: 'chest', equipment: 'dumbbell', imageFolder: 'Incline_Dumbbell_Flyes' },

  // SHOULDERS (20 exercises)
  { name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', imageFolder: 'Standing_Military_Press' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Dumbbell_Shoulder_Press' },
  { name: 'Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Side_Lateral_Raise' },
  { name: 'Front Raise', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Front_Dumbbell_Raise' },
  { name: 'Rear Delt Fly', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Dumbbell_Lying_Rear_Delt_Row' },
  { name: 'Cable Lateral Raise', muscle_group: 'shoulders', equipment: 'cable', imageFolder: 'Side_Lateral_Raise' },
  { name: 'Arnold Press', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Arnold_Dumbbell_Press' },
  { name: 'Upright Row', muscle_group: 'shoulders', equipment: 'barbell', imageFolder: 'Upright_Barbell_Row' },
  { name: 'Reverse Pec Deck', muscle_group: 'shoulders', equipment: 'machine', imageFolder: 'Reverse_Machine_Flyes' },
  { name: 'Machine Shoulder Press', muscle_group: 'shoulders', equipment: 'machine', imageFolder: 'Machine_Shoulder_Military_Press' },
  { name: 'Cable Front Raise', muscle_group: 'shoulders', equipment: 'cable', imageFolder: 'Front_Dumbbell_Raise' },
  { name: 'Cable Rear Delt Fly', muscle_group: 'shoulders', equipment: 'cable', imageFolder: 'Dumbbell_Lying_Rear_Delt_Row' },
  { name: 'Bent Over Rear Delt Fly', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Dumbbell_Lying_Rear_Delt_Row' },
  { name: 'Dumbbell Upright Row', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Upright_Barbell_Row' },
  { name: 'Plate Front Raise', muscle_group: 'shoulders', equipment: 'other', imageFolder: 'Front_Plate_Raise' },
  { name: 'Seated Dumbbell Press', muscle_group: 'shoulders', equipment: 'dumbbell', imageFolder: 'Seated_Dumbbell_Press' },
  { name: 'Smith Machine Shoulder Press', muscle_group: 'shoulders', equipment: 'machine', imageFolder: 'Standing_Military_Press' },
  { name: 'Barbell Front Raise', muscle_group: 'shoulders', equipment: 'barbell', imageFolder: 'Front_Dumbbell_Raise' },
  { name: 'Shrugs', muscle_group: 'traps', equipment: 'dumbbell', imageFolder: 'Dumbbell_Shrug' },
  { name: 'Barbell Shrug', muscle_group: 'traps', equipment: 'barbell', imageFolder: 'Barbell_Shrug' },

  // BICEPS (15 exercises)
  { name: 'Barbell Curl', muscle_group: 'biceps', equipment: 'barbell', imageFolder: 'Barbell_Curl' },
  { name: 'Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Dumbbell_Bicep_Curl' },
  { name: 'Hammer Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Hammer_Curls' },
  { name: 'Preacher Curl', muscle_group: 'biceps', equipment: 'barbell', imageFolder: 'Preacher_Curl' },
  { name: 'Cable Curl', muscle_group: 'biceps', equipment: 'cable', imageFolder: 'Cable_Hammer_Curls_-_Rope_Attachment' },
  { name: 'Incline Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Incline_Dumbbell_Curl' },
  { name: 'Concentration Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Concentration_Curls' },
  { name: 'EZ Bar Curl', muscle_group: 'biceps', equipment: 'barbell', imageFolder: 'Barbell_Curl' },
  { name: 'Cable Hammer Curl', muscle_group: 'biceps', equipment: 'cable', imageFolder: 'Cable_Hammer_Curls_-_Rope_Attachment' },
  { name: 'Spider Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Dumbbell_Bicep_Curl' },
  { name: 'Machine Curl', muscle_group: 'biceps', equipment: 'machine', imageFolder: 'Machine_Bicep_Curl' },
  { name: 'Reverse Curl', muscle_group: 'biceps', equipment: 'barbell', imageFolder: 'Reverse_Barbell_Curl' },
  { name: 'Drag Curl', muscle_group: 'biceps', equipment: 'barbell', imageFolder: 'Barbell_Curl' },
  { name: 'Dumbbell Preacher Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Dumbbell_Preacher_Curl' },
  { name: 'Alternating Dumbbell Curl', muscle_group: 'biceps', equipment: 'dumbbell', imageFolder: 'Alternate_Dumbbell_Curl' },

  // TRICEPS (15 exercises)
  { name: 'Tricep Pushdown', muscle_group: 'triceps', equipment: 'cable', imageFolder: 'Triceps_Pushdown' },
  { name: 'Rope Tricep Extension', muscle_group: 'triceps', equipment: 'cable', imageFolder: 'Triceps_Pushdown_-_Rope_Attachment' },
  { name: 'Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'dumbbell', imageFolder: 'Dumbbell_One-Arm_Triceps_Extension' },
  { name: 'Skull Crusher', muscle_group: 'triceps', equipment: 'barbell', imageFolder: 'Lying_Triceps_Press' },
  { name: 'Close Grip Bench Press', muscle_group: 'triceps', equipment: 'barbell', imageFolder: 'Close-Grip_Barbell_Bench_Press' },
  { name: 'Dips', muscle_group: 'triceps', equipment: 'body weight', imageFolder: 'Dips_-_Triceps_Version' },
  { name: 'Tricep Kickback', muscle_group: 'triceps', equipment: 'dumbbell', imageFolder: 'Tricep_Dumbbell_Kickback' },
  { name: 'Cable Overhead Tricep Extension', muscle_group: 'triceps', equipment: 'cable', imageFolder: 'Cable_One_Arm_Tricep_Extension' },
  { name: 'Diamond Push Up', muscle_group: 'triceps', equipment: 'body weight', imageFolder: 'Pushups' },
  { name: 'Bench Dip', muscle_group: 'triceps', equipment: 'body weight', imageFolder: 'Bench_Dips' },
  { name: 'EZ Bar Skull Crusher', muscle_group: 'triceps', equipment: 'barbell', imageFolder: 'Lying_Triceps_Press' },
  { name: 'Single Arm Tricep Pushdown', muscle_group: 'triceps', equipment: 'cable', imageFolder: 'Reverse_Grip_Triceps_Pushdown' },
  { name: 'Machine Tricep Extension', muscle_group: 'triceps', equipment: 'machine', imageFolder: 'Triceps_Pushdown' },
  { name: 'Dumbbell Skull Crusher', muscle_group: 'triceps', equipment: 'dumbbell', imageFolder: 'Lying_Dumbbell_Tricep_Extension' },
  { name: 'Overhead Cable Tricep Extension', muscle_group: 'triceps', equipment: 'cable', imageFolder: 'Cable_One_Arm_Tricep_Extension' },

  // ABS/CORE (20 exercises)
  { name: 'Plank', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Plank' },
  { name: 'Crunch', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Crunches' },
  { name: 'Leg Raise', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Flat_Bench_Lying_Leg_Raise' },
  { name: 'Russian Twist', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Russian_Twist' },
  { name: 'Bicycle Crunch', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Air_Bike' },
  { name: 'Mountain Climber', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Cross-Body_Crunch' },
  { name: 'Cable Crunch', muscle_group: 'abs', equipment: 'cable', imageFolder: 'Cable_Crunch' },
  { name: 'Hanging Leg Raise', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Hanging_Leg_Raise' },
  { name: 'Ab Wheel Rollout', muscle_group: 'abs', equipment: 'other', imageFolder: 'Ab_Roller' },
  { name: 'Dead Bug', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Dead_Bug' },
  { name: 'Bird Dog', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Bird_Dog' },
  { name: 'Reverse Crunch', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Reverse_Crunch' },
  { name: 'Side Plank', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Side_Bridge' },
  { name: 'Toe Touch', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Toe_Touchers' },
  { name: 'Decline Crunch', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Decline_Crunch' },
  { name: 'Cable Woodchop', muscle_group: 'abs', equipment: 'cable', imageFolder: 'Cable_Woodchoppers' },
  { name: 'Pallof Press', muscle_group: 'abs', equipment: 'cable', imageFolder: 'Cable_Crunch' },
  { name: 'V-Up', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Jackknife_Sit-Up' },
  { name: 'Knee Raise', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Hanging_Leg_Raise' },
  { name: 'Flutter Kick', muscle_group: 'abs', equipment: 'body weight', imageFolder: 'Flutter_Kicks' },
];

async function seed() {
  console.log(`Seeding ${EXERCISES.length} exercises...`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of EXERCISES) {
    const imageUrl = `${IMAGE_BASE}/${exercise.imageFolder}/0.jpg`;

    const insertData = {
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: [exercise.equipment],
      image_url: imageUrl
    };

    // Try to upsert based on name
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exercise.name)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('exercises')
        .update(insertData)
        .eq('id', existing.id);

      if (error) {
        console.error(`Failed to update ${exercise.name}:`, error.message);
        failed++;
      } else {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase.from('exercises').insert(insertData);

      if (error) {
        console.error(`Failed to insert ${exercise.name}:`, error.message);
        failed++;
      } else {
        inserted++;
      }
    }
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${inserted + updated}`);
}

seed().catch(console.error);
