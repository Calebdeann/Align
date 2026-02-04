/**
 * Seed custom exercises that are missing from ExerciseDB into Supabase.
 *
 * These are popular exercises (especially for women's training) that
 * ExerciseDB doesn't include, such as hip thrust variants, fire hydrants,
 * clamshells, face pulls, etc.
 *
 * Prerequisites:
 *   1. .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/seed-custom-exercises.mjs             (insert exercises)
 *   node scripts/seed-custom-exercises.mjs --dry-run   (preview only)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ---------- .env ----------
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// ---------- Custom Exercises ----------

const CUSTOM_EXERCISES = [
  // ===== GLUTES & HIP THRUSTS (13) =====
  {
    name: 'barbell hip thrust',
    muscle_group: 'glutes',
    equipment: ['barbell'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Sit on the ground with your upper back against a bench, knees bent, feet flat on the floor.',
      'Roll a loaded barbell over your hips. Use a pad for comfort.',
      'Drive through your heels, squeezing your glutes to lift your hips until your body forms a straight line from shoulders to knees.',
      'Hold the top position for a moment, squeezing your glutes.',
      'Lower your hips back down with control and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'machine hip thrust',
    muscle_group: 'glutes',
    equipment: ['machine'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Set up on the hip thrust machine with your upper back against the pad and feet flat on the platform.',
      'Adjust the resistance pad so it sits across your hips.',
      'Drive through your heels and squeeze your glutes to extend your hips fully.',
      'Hold the top position briefly, then lower with control.',
      'Repeat for the desired number of reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'dumbbell hip thrust',
    muscle_group: 'glutes',
    equipment: ['dumbbell'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Sit on the ground with your upper back against a bench, knees bent, feet flat on the floor.',
      'Place a dumbbell on your hips, holding it in place with both hands.',
      'Drive through your heels and squeeze your glutes to lift your hips until your body is in a straight line.',
      'Pause at the top, then lower back down with control.',
      'Repeat for the desired number of reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'smith machine hip thrust',
    muscle_group: 'glutes',
    equipment: ['smith machine'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Position a bench perpendicular to the Smith machine. Sit with your upper back against the bench.',
      'Unrack the bar so it rests across your hips. Use a pad for comfort.',
      'Drive through your heels, extending your hips until your body forms a straight line from shoulders to knees.',
      'Squeeze your glutes at the top, then lower under control.',
      'Repeat for the desired number of reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'single leg hip thrust',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Sit on the ground with your upper back against a bench. Extend one leg straight out in front of you.',
      'Plant the other foot firmly on the ground, knee bent at about 90 degrees.',
      'Drive through the planted heel, squeezing your glute to lift your hips until your body forms a straight line.',
      'Hold at the top, keeping the extended leg in line with your torso.',
      'Lower with control and repeat. Switch sides after completing all reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'banded hip thrust',
    muscle_group: 'glutes',
    equipment: ['bands'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Loop a resistance band just above your knees. Sit with your upper back against a bench.',
      'Place your feet flat on the floor, hip-width apart.',
      'Drive through your heels while pushing your knees outward against the band.',
      'Squeeze your glutes at the top, holding briefly.',
      'Lower back down with control and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'b stance hip thrust',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings', 'quads'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Sit with your upper back against a bench. Place one foot flat on the floor (working leg).',
      'Stagger the other foot slightly forward, resting on its heel as a kickstand for balance.',
      'Drive through the working heel, squeezing your glute to lift your hips.',
      'Most of the effort should come from the working leg. The kickstand leg provides stability only.',
      'Lower with control and repeat. Switch sides after completing all reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'bulgarian split squat',
    muscle_group: 'quads',
    equipment: ['body weight'],
    target_muscles: ['quads'],
    secondary_muscles: ['glutes', 'hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Stand about two feet in front of a bench. Place the top of one foot on the bench behind you.',
      'Keep your torso upright, core engaged.',
      'Lower your back knee toward the floor by bending your front leg until your front thigh is about parallel to the ground.',
      'Drive through your front heel to return to the starting position.',
      'Complete all reps on one side before switching legs.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'fire hydrant',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['abductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Start on all fours with hands under shoulders and knees under hips.',
      'Keeping your knee bent at 90 degrees, lift one leg out to the side.',
      'Raise your knee to hip height without rotating your torso.',
      'Squeeze your glute at the top, then lower back to the starting position.',
      'Complete all reps on one side, then switch.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'clamshell',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['abductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Lie on your side with knees bent at about 45 degrees, feet together, head resting on your lower arm.',
      'Keep your feet touching as you rotate your top knee upward, opening your legs like a clamshell.',
      'Squeeze your glute at the top of the movement.',
      'Lower your knee back down slowly with control.',
      'Complete all reps on one side, then switch.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'donkey kick',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Start on all fours with hands under shoulders and knees under hips.',
      'Keep your right knee bent at 90 degrees as you lift your leg behind you.',
      'Press your foot toward the ceiling, squeezing your glute at the top.',
      'Keep your core engaged and avoid arching your lower back.',
      'Lower with control and repeat. Switch sides after completing all reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'frog pump',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['adductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Lie on your back with the soles of your feet together, knees falling open to the sides (butterfly position).',
      'Keep your feet close to your glutes.',
      'Drive through your heels, squeezing your glutes to lift your hips off the ground.',
      'Hold at the top for a moment, fully contracting your glutes.',
      'Lower your hips back to the floor and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'kas glute bridge',
    muscle_group: 'glutes',
    equipment: ['barbell'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Set up as you would for a barbell hip thrust with your upper back on a bench.',
      'Start at the top position with hips fully extended.',
      'Lower your hips only about one-third of the way down (a short range of motion).',
      'Drive back up, squeezing your glutes hard at the top.',
      'This shortened range of motion keeps constant tension on the glutes.',
    ],
    exercise_type: 'strength',
  },

  // ===== LEGS (5) =====
  {
    name: 'curtsy lunge',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['quads', 'adductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Stand with feet hip-width apart.',
      'Step one foot behind and across your body, as if performing a curtsy.',
      'Bend both knees, lowering until your front thigh is parallel to the floor.',
      'Drive through the front heel to return to standing.',
      'Repeat on the other side, alternating legs.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'nordic curl',
    muscle_group: 'hamstrings',
    equipment: ['body weight'],
    target_muscles: ['hamstrings'],
    secondary_muscles: ['glutes', 'calves'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Kneel on a pad with your ankles secured under a fixed surface or held by a partner.',
      'Keep your body in a straight line from knees to head, arms ready to catch yourself.',
      'Slowly lower your body toward the ground by extending at the knees, resisting gravity with your hamstrings.',
      'Lower as far as you can control, then use your hands to push off the ground to assist on the way back up.',
      'As you get stronger, reduce how much you push off with your hands.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'box squat',
    muscle_group: 'quads',
    equipment: ['barbell'],
    target_muscles: ['quads'],
    secondary_muscles: ['glutes', 'hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Set up a box or bench behind you at about knee height. Position a barbell on your upper back.',
      'Stand with feet shoulder-width apart, toes slightly turned out.',
      'Sit back and down, controlling the descent until you are sitting on the box.',
      'Pause briefly on the box without relaxing completely, keeping your core tight.',
      'Drive through your feet to stand back up explosively.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'pendulum squat',
    muscle_group: 'quads',
    equipment: ['machine'],
    target_muscles: ['quads'],
    secondary_muscles: ['glutes', 'hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Position yourself in the pendulum squat machine with your back against the pad and shoulders under the shoulder pads.',
      'Place your feet on the platform at about shoulder width.',
      'Release the safety and lower yourself by bending your knees.',
      'Descend until your thighs are parallel to the platform or slightly below.',
      'Drive through your feet to return to the starting position.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'belt squat',
    muscle_group: 'quads',
    equipment: ['machine'],
    target_muscles: ['quads'],
    secondary_muscles: ['glutes', 'hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Attach the belt around your hips and clip it to the machine or loading pin.',
      'Stand on the platforms with feet shoulder-width apart.',
      'Brace your core and squat down by bending your knees and pushing your hips back.',
      'Lower until your thighs are at or below parallel.',
      'Drive through your feet to return to standing. This exercise loads the legs without stressing the spine.',
    ],
    exercise_type: 'strength',
  },

  // ===== BACK & SHOULDERS (7) =====
  {
    name: 'face pull',
    muscle_group: 'shoulders',
    equipment: ['cable'],
    target_muscles: ['delts'],
    secondary_muscles: ['traps', 'upper back'],
    body_parts: ['shoulders'],
    instructions_array: [
      'Set a cable machine with a rope attachment at upper chest to face height.',
      'Grab the rope with both hands, palms facing each other, and step back to create tension.',
      'Pull the rope toward your face, separating the ends of the rope as you pull.',
      'Squeeze your rear delts and upper back at the end of the movement. Your hands should end up beside your ears.',
      'Slowly return to the starting position and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'band face pull',
    muscle_group: 'shoulders',
    equipment: ['bands'],
    target_muscles: ['delts'],
    secondary_muscles: ['traps', 'upper back'],
    body_parts: ['shoulders'],
    instructions_array: [
      'Anchor a resistance band at face height on a sturdy object.',
      'Grab both ends of the band with palms facing each other and step back to create tension.',
      'Pull the band toward your face, flaring your elbows high and wide.',
      'Squeeze your rear delts and upper back, holding for a moment.',
      'Return to the start position with control and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'band pull apart',
    muscle_group: 'shoulders',
    equipment: ['bands'],
    target_muscles: ['delts'],
    secondary_muscles: ['traps', 'upper back'],
    body_parts: ['shoulders'],
    instructions_array: [
      'Hold a resistance band in front of you at shoulder height with both hands, arms straight.',
      'Pull the band apart by squeezing your shoulder blades together, moving your hands outward.',
      'Continue until the band touches your chest and your arms are fully extended to the sides.',
      'Slowly return to the starting position with control.',
      'Keep your arms straight throughout the movement.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'landmine press',
    muscle_group: 'shoulders',
    equipment: ['barbell'],
    target_muscles: ['delts'],
    secondary_muscles: ['pectorals', 'triceps'],
    body_parts: ['shoulders'],
    instructions_array: [
      'Place one end of a barbell in a landmine attachment or securely in a corner.',
      'Stand facing the barbell, holding the free end at shoulder height with one or both hands.',
      'Press the barbell up and slightly forward until your arm is fully extended.',
      'Lower the barbell back to shoulder height with control.',
      'Complete all reps on one side before switching if using one arm.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'meadows row',
    muscle_group: 'lats',
    equipment: ['barbell'],
    target_muscles: ['lats'],
    secondary_muscles: ['biceps', 'traps', 'upper back'],
    body_parts: ['back'],
    instructions_array: [
      'Set up a barbell in a landmine attachment. Stand perpendicular to the bar.',
      'Stagger your stance with the foot nearest the bar behind you.',
      'Grip the end of the bar with an overhand grip using the hand farthest from the bar.',
      'Row the bar up toward your hip, leading with your elbow.',
      'Lower with control and repeat. Switch sides after completing all reps.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'chest supported row',
    muscle_group: 'upper back',
    equipment: ['dumbbell'],
    target_muscles: ['upper back'],
    secondary_muscles: ['lats', 'biceps', 'traps'],
    body_parts: ['back'],
    instructions_array: [
      'Set an incline bench to about 30-45 degrees. Lie face down on the bench with a dumbbell in each hand.',
      'Let your arms hang straight down toward the floor.',
      'Row both dumbbells up toward your hips, squeezing your shoulder blades together.',
      'Pause at the top, then lower the weights with control.',
      'The chest support removes momentum and isolates the back muscles.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'seal row',
    muscle_group: 'upper back',
    equipment: ['barbell'],
    target_muscles: ['upper back'],
    secondary_muscles: ['lats', 'biceps', 'traps'],
    body_parts: ['back'],
    instructions_array: [
      'Lie face down on a raised bench with a barbell or dumbbells on the floor below you.',
      'Reach down and grip the weight with both hands.',
      'Row the weight up toward the underside of the bench, squeezing your shoulder blades together.',
      'Pause briefly, then lower with control.',
      'Keep your chest flat on the bench throughout the movement to prevent momentum.',
    ],
    exercise_type: 'strength',
  },

  // ===== CHEST (2) =====
  {
    name: 'cable fly',
    muscle_group: 'chest',
    equipment: ['cable'],
    target_muscles: ['pectorals'],
    secondary_muscles: ['delts'],
    body_parts: ['chest'],
    instructions_array: [
      'Set both cable pulleys to shoulder height with single grip handles.',
      'Stand in the center, grab a handle in each hand, and step forward slightly for tension.',
      'With a slight bend in your elbows, bring your hands together in front of your chest in a hugging motion.',
      'Squeeze your chest at the peak contraction.',
      'Slowly open your arms back to the starting position and repeat.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'svend press',
    muscle_group: 'chest',
    equipment: ['body weight'],
    target_muscles: ['pectorals'],
    secondary_muscles: ['delts', 'triceps'],
    body_parts: ['chest'],
    instructions_array: [
      'Hold a weight plate between your palms at chest level, pressing your hands together.',
      'Extend your arms straight out in front of you while continuing to squeeze the plate.',
      'Focus on contracting your chest muscles throughout the movement.',
      'Bring the plate back to your chest with control.',
      'Keep constant inward pressure on the plate to maintain chest engagement.',
    ],
    exercise_type: 'strength',
  },

  // ===== ARMS (1) =====
  {
    name: 'bayesian curl',
    muscle_group: 'biceps',
    equipment: ['cable'],
    target_muscles: ['biceps'],
    secondary_muscles: ['forearms'],
    body_parts: ['upper arms'],
    instructions_array: [
      'Set a cable pulley to the lowest position with a single handle.',
      'Stand facing away from the machine, holding the handle with one hand behind you.',
      'Step forward until you feel tension, with your arm extended behind your body.',
      'Curl the handle forward by bending your elbow, keeping your upper arm stationary behind you.',
      'Squeeze at the top, then lower with control. The stretched starting position increases muscle activation.',
    ],
    exercise_type: 'strength',
  },

  // ===== CORE (4) =====
  {
    name: 'cable wood chop',
    muscle_group: 'abs',
    equipment: ['cable'],
    target_muscles: ['abs'],
    secondary_muscles: ['obliques'],
    body_parts: ['waist'],
    instructions_array: [
      'Set a cable machine to the highest position with a single handle or rope.',
      'Stand sideways to the machine, feet shoulder-width apart. Grab the handle with both hands.',
      'Pull the cable diagonally across your body from high to low, rotating your torso.',
      'Control the movement back to the starting position.',
      'Complete all reps on one side, then switch. Focus on rotating through your core, not pulling with your arms.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'hollow hold',
    muscle_group: 'abs',
    equipment: ['body weight'],
    target_muscles: ['abs'],
    secondary_muscles: ['hip flexors'],
    body_parts: ['waist'],
    instructions_array: [
      'Lie flat on your back with arms extended overhead and legs straight.',
      'Press your lower back into the floor by engaging your core.',
      'Lift your arms, head, shoulder blades, and legs a few inches off the ground.',
      'Hold this "hollow" position, keeping your lower back pressed down.',
      'Hold for the prescribed duration. If too difficult, bend your knees or bring arms to your sides.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'dragon flag',
    muscle_group: 'abs',
    equipment: ['body weight'],
    target_muscles: ['abs'],
    secondary_muscles: ['hip flexors', 'obliques'],
    body_parts: ['waist'],
    instructions_array: [
      'Lie on a bench and grip the edges behind your head for support.',
      'Lift your entire body off the bench (keeping only your upper back and shoulders in contact) so your body forms a straight line pointing upward.',
      'Slowly lower your body as one rigid unit toward the bench, maintaining a straight line.',
      'Stop just before touching the bench, then lift back up using your core.',
      'This is an advanced exercise. Start with bent knees or partial range of motion if needed.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'pallof press',
    muscle_group: 'abs',
    equipment: ['cable'],
    target_muscles: ['abs'],
    secondary_muscles: ['obliques'],
    body_parts: ['waist'],
    instructions_array: [
      'Set a cable machine at chest height with a D-handle. Stand sideways to the machine.',
      'Hold the handle with both hands at your chest, feet shoulder-width apart.',
      'Press the handle straight out in front of you, resisting the rotation pull from the cable.',
      'Hold the extended position for a moment, then bring the handle back to your chest.',
      'Complete all reps facing one direction, then switch sides. Keep your hips and shoulders square throughout.',
    ],
    exercise_type: 'strength',
  },

  // ===== WOMEN'S TRENDING (4) =====
  {
    name: 'ankle weight kickback',
    muscle_group: 'glutes',
    equipment: ['body weight'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Strap an ankle weight to one ankle. Stand holding a stable surface for balance.',
      'Keeping your standing leg slightly bent, kick the weighted leg straight back.',
      'Squeeze your glute at the top of the movement. Avoid arching your lower back.',
      'Lower the leg back down with control.',
      'Complete all reps on one side, then switch. Can also be done on all fours.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'glute kickback machine',
    muscle_group: 'glutes',
    equipment: ['machine'],
    target_muscles: ['glutes'],
    secondary_muscles: ['hamstrings'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Adjust the machine and stand on the platform with one foot. Place the other foot against the kickback pad.',
      'Hold the handles for stability and lean slightly forward.',
      'Press the pad backward by extending your hip, squeezing your glute at full extension.',
      'Return to the starting position with control.',
      'Complete all reps on one side, then switch.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'cable hip abduction',
    muscle_group: 'glutes',
    equipment: ['cable'],
    target_muscles: ['glutes'],
    secondary_muscles: ['abductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Attach an ankle cuff to a low cable pulley. Strap the cuff to the ankle farthest from the machine.',
      'Stand sideways to the machine, holding it for balance.',
      'Keeping your leg straight, lift it out to the side against the cable resistance.',
      'Squeeze your outer glute at the top, then lower with control.',
      'Complete all reps on one side, then switch.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'hip abduction machine',
    muscle_group: 'glutes',
    equipment: ['machine'],
    target_muscles: ['glutes'],
    secondary_muscles: ['abductors'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Sit in the hip abduction machine with your back flat against the pad.',
      'Place the outsides of your knees or thighs against the pads.',
      'Push your legs apart against the resistance, squeezing your outer glutes.',
      'Hold the open position briefly for a peak contraction.',
      'Slowly bring your legs back together with control and repeat.',
    ],
    exercise_type: 'strength',
  },

  // ===== COMPOUND (3) =====
  {
    name: 'sled push',
    muscle_group: 'quads',
    equipment: ['body weight'],
    target_muscles: ['quads'],
    secondary_muscles: ['glutes', 'hamstrings', 'calves'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Load the sled with the desired weight. Position yourself behind the sled with hands on the high or low handles.',
      'Lean forward at about a 45-degree angle, keeping your core braced.',
      'Drive forward by pushing through the balls of your feet, taking powerful steps.',
      'Keep your back flat and maintain a steady forward lean throughout.',
      'Push the sled for the prescribed distance or time.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'sled pull',
    muscle_group: 'hamstrings',
    equipment: ['body weight'],
    target_muscles: ['hamstrings'],
    secondary_muscles: ['glutes', 'quads', 'upper back'],
    body_parts: ['upper legs'],
    instructions_array: [
      'Attach a strap or rope to a loaded sled. Face the sled and grip the handles or rope.',
      'Walk backward, pulling the sled toward you with each step.',
      'Keep your arms extended or row the rope hand over hand.',
      'Stay low with knees bent and core braced.',
      'Continue for the prescribed distance or time.',
    ],
    exercise_type: 'strength',
  },
  {
    name: 'battle ropes',
    muscle_group: 'shoulders',
    equipment: ['body weight'],
    target_muscles: ['delts'],
    secondary_muscles: ['abs', 'biceps', 'forearms'],
    body_parts: ['shoulders'],
    instructions_array: [
      'Anchor a heavy rope at its center point. Stand facing the anchor, holding one end in each hand.',
      'Bend your knees slightly and brace your core.',
      'Alternate raising and lowering each arm rapidly to create waves in the rope.',
      'Keep the waves consistent and powerful. Maintain an athletic stance throughout.',
      'Continue for the prescribed time. Variations include double waves, slams, and circles.',
    ],
    exercise_type: 'cardio',
  },
];

// ---------- Helpers ----------

async function getExistingNames() {
  const url = `${SUPABASE_URL}/rest/v1/exercises?select=name`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Range: '0-1999',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch existing exercises: ${res.status}`);
  const data = await res.json();
  return new Set(data.map((e) => e.name.toLowerCase()));
}

async function insertExercise(exercise) {
  const url = `${SUPABASE_URL}/rest/v1/exercises`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(exercise),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed for "${exercise.name}": ${res.status} ${text}`);
  }
}

// ---------- Main ----------

console.log(DRY_RUN ? '=== DRY RUN ===' : '=== SEEDING CUSTOM EXERCISES ===');
console.log(`Supabase: ${SUPABASE_URL}`);
console.log(`Exercises to seed: ${CUSTOM_EXERCISES.length}\n`);

const existingNames = await getExistingNames();
console.log(`Existing exercises in DB: ${existingNames.size}\n`);

const toInsert = CUSTOM_EXERCISES.filter((e) => !existingNames.has(e.name.toLowerCase()));
const alreadyExist = CUSTOM_EXERCISES.filter((e) => existingNames.has(e.name.toLowerCase()));

if (alreadyExist.length > 0) {
  console.log(`Already in DB (skipping ${alreadyExist.length}):`);
  alreadyExist.forEach((e) => console.log(`  - ${e.name}`));
  console.log();
}

console.log(`To insert: ${toInsert.length} exercises\n`);

if (DRY_RUN) {
  console.log('Would insert:');
  toInsert.forEach((e) => console.log(`  - ${e.name} [${e.muscle_group}] (${e.equipment.join(', ')})`));
  process.exit(0);
}

const BATCH_SIZE = 5;
let inserted = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
  const batch = toInsert.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map((exercise) => insertExercise(exercise))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      inserted++;
    } else {
      failed++;
      failures.push(result.reason.message);
      console.error(`  FAIL: ${result.reason.message}`);
    }
  }

  const total = Math.min(i + BATCH_SIZE, toInsert.length);
  console.log(`Progress: ${total}/${toInsert.length} (inserted: ${inserted}, failed: ${failed})`);
}

console.log('\n=== Done ===');
console.log(`Inserted: ${inserted}`);
console.log(`Skipped (already exist): ${alreadyExist.length}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}
