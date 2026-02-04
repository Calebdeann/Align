/**
 * Populate display_name and keywords (search aliases) for the top 200 exercises.
 *
 * Usage:
 *   node scripts/populate-exercise-names.mjs --preview   # Output JSON for review
 *   node scripts/populate-exercise-names.mjs --apply      # Push to Supabase
 *
 * The display_name is the human-friendly name shown in the UI.
 * The keywords are search aliases so users can find exercises with common terms.
 *
 * Exercises are matched by exercise_db_id (the ExerciseDB numeric ID).
 */

// ---------- Config ----------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dngpsabyqsuunajtotci.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  // Try loading from .env
  const { readFileSync } = await import('fs');
  const { resolve } = await import('path');
  try {
    const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = match[1].trim();
    }
  } catch {}
}

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as environment variable.');
  process.exit(1);
}

// ---------- Exercise Name Mappings ----------
// Format: exercise_db_id → { displayName, keywords }
// Prioritized for women's fitness: glutes/legs first, then upper body, then core

const EXERCISE_MAPPINGS = {
  // ===== GLUTES & LEGS (60) =====
  '1409': {
    displayName: 'Barbell Glute Bridge',
    keywords: ['hip thrust', 'barbell hip thrust', 'glute thrust', 'barbell glute bridge', 'bridge']
  },
  '3236': {
    displayName: 'Banded Hip Thrust (Kneeling)',
    keywords: ['hip thrust', 'banded hip thrust', 'kneeling hip thrust', 'resistance band hip thrust']
  },
  '0085': {
    displayName: 'Romanian Deadlift (Barbell)',
    keywords: ['rdl', 'romanian deadlift', 'barbell rdl', 'stiff leg deadlift', 'hamstring deadlift']
  },
  '0032': {
    displayName: 'Deadlift (Barbell)',
    keywords: ['deadlift', 'barbell deadlift', 'conventional deadlift']
  },
  '0117': {
    displayName: 'Sumo Deadlift (Barbell)',
    keywords: ['sumo deadlift', 'barbell sumo deadlift', 'wide stance deadlift']
  },
  '1756': {
    displayName: 'Single Leg Deadlift (Barbell)',
    keywords: ['single leg deadlift', 'one leg deadlift', 'barbell single leg rdl']
  },
  '0043': {
    displayName: 'Barbell Squat',
    keywords: ['squat', 'back squat', 'barbell squat', 'full squat', 'barbell back squat']
  },
  '1436': {
    displayName: 'High Bar Squat (Barbell)',
    keywords: ['high bar squat', 'barbell high bar squat', 'back squat']
  },
  '1435': {
    displayName: 'Low Bar Squat (Barbell)',
    keywords: ['low bar squat', 'barbell low bar squat', 'powerlifting squat']
  },
  '0042': {
    displayName: 'Front Squat (Barbell)',
    keywords: ['front squat', 'barbell front squat']
  },
  '0046': {
    displayName: 'Hack Squat (Barbell)',
    keywords: ['hack squat', 'barbell hack squat']
  },
  '0770': {
    displayName: 'Smith Machine Squat',
    keywords: ['smith squat', 'smith machine squat', 'machine squat']
  },
  '0755': {
    displayName: 'Smith Machine Hack Squat',
    keywords: ['smith hack squat', 'smith machine hack squat', 'hack squat']
  },
  '0053': {
    displayName: 'Jump Squat (Barbell)',
    keywords: ['jump squat', 'barbell jump squat', 'squat jump']
  },
  '3769': {
    displayName: 'Curtsy Squat',
    keywords: ['curtsy squat', 'curtsey squat', 'crossover squat', 'curtsy lunge']
  },
  '0054': {
    displayName: 'Barbell Lunge',
    keywords: ['lunge', 'barbell lunge', 'forward lunge', 'walking lunge']
  },
  '0078': {
    displayName: 'Reverse Lunge (Barbell)',
    keywords: ['reverse lunge', 'barbell reverse lunge', 'backward lunge', 'rear lunge']
  },
  '1410': {
    displayName: 'Lateral Lunge (Barbell)',
    keywords: ['lateral lunge', 'side lunge', 'barbell side lunge']
  },
  '0769': {
    displayName: 'Smith Machine Sprint Lunge',
    keywords: ['smith lunge', 'smith machine lunge', 'sprint lunge']
  },
  '0739': {
    displayName: 'Leg Press (45 Degree)',
    keywords: ['leg press', '45 degree leg press', 'sled leg press', 'machine leg press']
  },
  '0760': {
    displayName: 'Leg Press (Smith Machine)',
    keywords: ['smith leg press', 'smith machine leg press', 'leg press']
  },
  '0114': {
    displayName: 'Step Up (Barbell)',
    keywords: ['step up', 'step ups', 'barbell step up', 'box step up']
  },
  '1008': {
    displayName: 'Step Up (Band)',
    keywords: ['banded step up', 'band step up', 'step up', 'step ups']
  },
  '0130': {
    displayName: 'Hip Extension (Bench)',
    keywords: ['hip extension', 'bench hip extension', 'glute extension', 'back extension']
  },
  '0228': {
    displayName: 'Hip Extension (Cable)',
    keywords: ['cable hip extension', 'cable glute kickback', 'cable kickback', 'kickback']
  },
  '0980': {
    displayName: 'Hip Extension (Band)',
    keywords: ['band hip extension', 'banded kickback', 'band glute kickback', 'kickback']
  },
  '0578': {
    displayName: 'Deadlift (Lever Machine)',
    keywords: ['lever deadlift', 'machine deadlift', 'deadlift']
  },
  '0593': {
    displayName: 'Reverse Hyperextension (Machine)',
    keywords: ['reverse hyper', 'reverse hyperextension', 'reverse hypers', 'glute hyper']
  },
  '0668': {
    displayName: 'Rear Decline Bridge',
    keywords: ['decline bridge', 'glute bridge', 'rear bridge']
  },
  '3561': {
    displayName: 'Glute Bridge March',
    keywords: ['glute bridge march', 'marching bridge', 'bridge march', 'glute bridge']
  },
  '3013': {
    displayName: 'Glute Bridge (Floor)',
    keywords: ['glute bridge', 'floor glute bridge', 'hip bridge', 'bridge']
  },
  '1422': {
    displayName: 'Pelvic Tilt Bridge',
    keywords: ['pelvic tilt', 'pelvic bridge', 'glute bridge', 'bridge']
  },
  '3645': {
    displayName: 'Single Leg Bridge',
    keywords: ['single leg bridge', 'one leg bridge', 'single leg glute bridge']
  },
  '0099': {
    displayName: 'Bulgarian Split Squat (Barbell)',
    keywords: ['bulgarian split squat', 'split squat', 'rear foot elevated squat', 'bss']
  },
  '1004': {
    displayName: 'Squat (Band)',
    keywords: ['banded squat', 'band squat', 'resistance band squat', 'squat']
  },
  '0991': {
    displayName: 'Pull Through (Band)',
    keywords: ['band pull through', 'pull through', 'banded pull through', 'hip hinge']
  },
  '0196': {
    displayName: 'Cable Pull Through',
    keywords: ['cable pull through', 'pull through', 'rope pull through']
  },
  '1408': {
    displayName: 'Hip Lift (Band)',
    keywords: ['band hip lift', 'banded hip lift', 'hip thrust', 'banded hip thrust']
  },
  '0157': {
    displayName: 'Deadlift (Cable)',
    keywords: ['cable deadlift', 'cable rdl', 'deadlift']
  },
  '1009': {
    displayName: 'Stiff Leg Deadlift (Band)',
    keywords: ['band deadlift', 'banded rdl', 'band stiff leg deadlift', 'rdl']
  },
  '0291': {
    displayName: 'Squat (Dumbbell)',
    keywords: ['dumbbell squat', 'goblet squat', 'db squat']
  },
  '0295': {
    displayName: 'Dumbbell Clean',
    keywords: ['dumbbell clean', 'db clean', 'clean']
  },
  '0586': {
    displayName: 'Leg Curl (Machine)',
    keywords: ['leg curl', 'lying leg curl', 'hamstring curl', 'machine leg curl', 'lever leg curl']
  },
  '0610': {
    displayName: 'Seated Calf Raise (Machine)',
    keywords: ['seated calf raise', 'calf raise', 'machine calf raise', 'lever calf raise']
  },
  '0708': {
    displayName: 'Standing Calf Raise (Machine)',
    keywords: ['standing calf raise', 'calf raise', 'machine calf raise', 'calf press']
  },
  '1370': {
    displayName: 'Calf Raise (Barbell)',
    keywords: ['barbell calf raise', 'calf raise', 'standing calf raise']
  },
  '0752': {
    displayName: 'Smith Machine Deadlift',
    keywords: ['smith deadlift', 'smith machine deadlift', 'deadlift']
  },
  '3281': {
    displayName: 'Smith Machine Full Squat',
    keywords: ['smith squat', 'smith machine squat', 'full squat', 'squat']
  },
  '3142': {
    displayName: 'Smith Machine Sumo Squat',
    keywords: ['smith sumo squat', 'sumo squat', 'smith machine sumo', 'wide squat']
  },
  '0044': {
    displayName: 'Good Morning (Barbell)',
    keywords: ['good morning', 'barbell good morning', 'good mornings']
  },
  '0115': {
    displayName: 'Stiff Leg Good Morning (Barbell)',
    keywords: ['stiff leg good morning', 'good morning', 'barbell good morning']
  },
  '0074': {
    displayName: 'Rack Pull (Barbell)',
    keywords: ['rack pull', 'barbell rack pull', 'rack deadlift', 'block pull']
  },
  '0063': {
    displayName: 'Narrow Stance Squat (Barbell)',
    keywords: ['narrow squat', 'close stance squat', 'narrow stance squat']
  },
  '0051': {
    displayName: 'Jefferson Squat',
    keywords: ['jefferson squat', 'jefferson deadlift', 'straddle deadlift']
  },
  '0127': {
    displayName: 'Zercher Squat (Barbell)',
    keywords: ['zercher squat', 'barbell zercher squat']
  },
  '0098': {
    displayName: 'Side Split Squat (Barbell)',
    keywords: ['side split squat', 'lateral squat', 'cossack squat']
  },

  // ===== BACK (25) =====
  '2330': {
    displayName: 'Lat Pulldown (Cable)',
    keywords: ['lat pulldown', 'lat pull down', 'cable pulldown', 'pull down', 'cable lat pulldown']
  },
  '0007': {
    displayName: 'Alternating Lat Pulldown',
    keywords: ['lat pulldown', 'alternate pulldown', 'alternating pulldown', 'pull down']
  },
  '0673': {
    displayName: 'Reverse Grip Lat Pulldown (Machine)',
    keywords: ['reverse grip pulldown', 'underhand pulldown', 'lat pulldown', 'pull down']
  },
  '0818': {
    displayName: 'Parallel Grip Lat Pulldown',
    keywords: ['parallel grip pulldown', 'close grip pulldown', 'lat pulldown', 'neutral grip pulldown']
  },
  '0027': {
    displayName: 'Bent Over Row (Barbell)',
    keywords: ['bent over row', 'barbell row', 'bb row', 'bent row', 'barbell bent over row']
  },
  '0118': {
    displayName: 'Reverse Grip Bent Over Row (Barbell)',
    keywords: ['reverse grip row', 'underhand row', 'barbell row', 'bent over row']
  },
  '3017': {
    displayName: 'Pendlay Row (Barbell)',
    keywords: ['pendlay row', 'barbell pendlay row', 'strict row']
  },
  '0049': {
    displayName: 'Incline Row (Barbell)',
    keywords: ['incline row', 'barbell incline row', 'chest supported row', 'seal row']
  },
  '0293': {
    displayName: 'Bent Over Row (Dumbbell)',
    keywords: ['dumbbell bent over row', 'dumbbell row', 'db row', 'bent over row']
  },
  '0017': {
    displayName: 'Assisted Pull Up',
    keywords: ['pull up', 'pull ups', 'pullup', 'pullups', 'assisted pull up', 'chin up']
  },
  '3293': {
    displayName: 'Archer Pull Up',
    keywords: ['archer pull up', 'pull up', 'pullup', 'advanced pull up']
  },
  '0974': {
    displayName: 'Close Grip Pulldown (Band)',
    keywords: ['band pulldown', 'banded pulldown', 'close grip pulldown', 'lat pulldown']
  },
  '1013': {
    displayName: 'Underhand Pulldown (Band)',
    keywords: ['band pulldown', 'underhand pulldown', 'banded lat pulldown', 'lat pulldown']
  },
  '0073': {
    displayName: 'Pullover (Barbell)',
    keywords: ['pullover', 'barbell pullover', 'lat pullover']
  },
  '0347': {
    displayName: 'Pullover (Dumbbell)',
    keywords: ['dumbbell pullover', 'db pullover', 'pullover', 'lat pullover']
  },

  // ===== CHEST (25) =====
  '0025': {
    displayName: 'Bench Press (Barbell)',
    keywords: ['bench press', 'barbell bench press', 'flat bench', 'chest press', 'bench']
  },
  '0033': {
    displayName: 'Decline Bench Press (Barbell)',
    keywords: ['decline bench', 'decline bench press', 'decline press']
  },
  '0047': {
    displayName: 'Incline Bench Press (Barbell)',
    keywords: ['incline bench', 'incline bench press', 'incline press', 'incline barbell press']
  },
  '0030': {
    displayName: 'Close Grip Bench Press (Barbell)',
    keywords: ['close grip bench', 'close grip bench press', 'narrow grip bench', 'cgbp']
  },
  '0289': {
    displayName: 'Bench Press (Dumbbell)',
    keywords: ['dumbbell bench press', 'db bench press', 'dumbbell chest press', 'bench press']
  },
  '0314': {
    displayName: 'Incline Bench Press (Dumbbell)',
    keywords: ['dumbbell incline press', 'incline dumbbell press', 'incline bench', 'incline press']
  },
  '0176': {
    displayName: 'Cable Crossover',
    keywords: ['cable crossover', 'cable fly', 'cable chest fly', 'crossover']
  },
  '1254': {
    displayName: 'Bench Press (Band)',
    keywords: ['band bench press', 'banded bench press', 'resistance band chest press']
  },
  '3294': {
    displayName: 'Archer Push Up',
    keywords: ['archer push up', 'push up', 'pushup', 'advanced push up']
  },
  '0662': {
    displayName: 'Push Up',
    keywords: ['push up', 'pushup', 'push ups', 'pushups', 'press up']
  },
  '0671': {
    displayName: 'Wide Grip Push Up',
    keywords: ['wide push up', 'wide grip push up', 'push up', 'pushup']
  },
  '0577': {
    displayName: 'Incline Chest Press (Machine)',
    keywords: ['incline chest press', 'machine incline press', 'lever incline press', 'incline press']
  },

  // ===== SHOULDERS (20) =====
  '0091': {
    displayName: 'Overhead Press (Barbell, Seated)',
    keywords: ['overhead press', 'ohp', 'shoulder press', 'barbell shoulder press', 'seated press', 'military press']
  },
  '0361': {
    displayName: 'Shoulder Press (Dumbbell)',
    keywords: ['shoulder press', 'dumbbell shoulder press', 'db shoulder press', 'overhead press', 'dumbbell ohp']
  },
  '0997': {
    displayName: 'Shoulder Press (Band)',
    keywords: ['band shoulder press', 'banded shoulder press', 'shoulder press', 'overhead press']
  },
  '0219': {
    displayName: 'Shoulder Press (Cable)',
    keywords: ['cable shoulder press', 'cable overhead press', 'shoulder press']
  },
  '0178': {
    displayName: 'Lateral Raise (Cable)',
    keywords: ['lateral raise', 'cable lateral raise', 'side raise', 'side lateral raise']
  },
  '0041': {
    displayName: 'Front Raise (Barbell)',
    keywords: ['front raise', 'barbell front raise', 'front delt raise']
  },
  '0977': {
    displayName: 'Front Lateral Raise (Band)',
    keywords: ['front raise', 'band front raise', 'lateral raise', 'band raise']
  },
  '0075': {
    displayName: 'Rear Delt Raise (Barbell)',
    keywords: ['rear delt raise', 'barbell rear delt', 'rear raise', 'reverse raise']
  },
  '0993': {
    displayName: 'Reverse Fly (Band)',
    keywords: ['band reverse fly', 'banded reverse fly', 'rear delt fly', 'reverse fly']
  },
  '0095': {
    displayName: 'Barbell Shrug',
    keywords: ['barbell shrug', 'shrug', 'shrugs', 'trap shrug', 'bb shrug']
  },

  // ===== ARMS - BICEPS (20) =====
  '0031': {
    displayName: 'Barbell Curl',
    keywords: ['barbell curl', 'bb curl', 'bicep curl', 'biceps curl', 'standing curl']
  },
  '0038': {
    displayName: 'Drag Curl (Barbell)',
    keywords: ['drag curl', 'barbell drag curl', 'body drag curl']
  },
  '0070': {
    displayName: 'Preacher Curl (Barbell)',
    keywords: ['preacher curl', 'barbell preacher curl', 'scott curl']
  },
  '0285': {
    displayName: 'Alternating Curl (Dumbbell)',
    keywords: ['alternating curl', 'dumbbell alternating curl', 'alternate curl', 'bicep curl']
  },
  '0294': {
    displayName: 'Concentration Curl (Dumbbell)',
    keywords: ['concentration curl', 'dumbbell concentration curl', 'seated curl']
  },
  '0968': {
    displayName: 'Alternating Curl (Band)',
    keywords: ['band curl', 'banded curl', 'band bicep curl', 'resistance band curl']
  },
  '0976': {
    displayName: 'Concentration Curl (Band)',
    keywords: ['band concentration curl', 'banded curl', 'concentration curl']
  },

  // ===== ARMS - TRICEPS (20) =====
  '0056': {
    displayName: 'Lying Tricep Extension (Barbell)',
    keywords: ['lying tricep extension', 'skull crusher', 'skullcrusher', 'barbell skull crusher', 'lying extension']
  },
  '0092': {
    displayName: 'Overhead Tricep Extension (Barbell, Seated)',
    keywords: ['overhead tricep extension', 'barbell overhead extension', 'seated tricep extension', 'french press']
  },
  '0061': {
    displayName: 'Lying Tricep Extension (Barbell)',
    keywords: ['skull crusher', 'skullcrusher', 'lying tricep extension', 'nose breaker']
  },
  '0998': {
    displayName: 'Tricep Extension (Band)',
    keywords: ['band tricep extension', 'banded tricep extension', 'resistance band tricep']
  },
  '0009': {
    displayName: 'Assisted Chest Dip',
    keywords: ['dip', 'dips', 'chest dip', 'assisted dip', 'dip machine']
  },
  '0019': {
    displayName: 'Assisted Tricep Dip',
    keywords: ['dip', 'dips', 'tricep dip', 'assisted dip', 'assisted tricep dip']
  },

  // ===== CORE / ABS (20) =====
  '0003': {
    displayName: 'Air Bike (Bicycle Crunch)',
    keywords: ['bicycle crunch', 'air bike', 'bicycle crunches', 'cycling crunch']
  },
  '0274': {
    displayName: 'Crunch',
    keywords: ['crunch', 'crunches', 'ab crunch', 'abdominal crunch']
  },
  '2333': {
    displayName: 'Hanging Leg Raise (Straight Legs)',
    keywords: ['hanging leg raise', 'leg raise', 'hanging raise', 'ab raise']
  },
  '0011': {
    displayName: 'Hanging Knee Raise (Assisted)',
    keywords: ['hanging knee raise', 'knee raise', 'captain chair', 'leg raise']
  },
  '0001': {
    displayName: '3/4 Sit Up',
    keywords: ['sit up', 'situp', 'sit ups', 'situps', 'crunch']
  },
  '0006': {
    displayName: 'Heel Touchers (Alternating)',
    keywords: ['heel touchers', 'heel touches', 'alternate heel touches', 'oblique crunch']
  },
  '0002': {
    displayName: '45 Degree Side Bend',
    keywords: ['side bend', 'oblique bend', 'side crunch', 'oblique']
  },
  '0014': {
    displayName: 'Russian Twist (Assisted)',
    keywords: ['russian twist', 'russian twists', 'seated twist', 'oblique twist']
  },
  '0650': {
    displayName: 'Plank',
    keywords: ['plank', 'front plank', 'forearm plank', 'planks']
  },
  '1005': {
    displayName: 'Standing Crunch (Band)',
    keywords: ['band crunch', 'standing crunch', 'cable crunch', 'banded crunch']
  },
  '0971': {
    displayName: 'Ab Wheel Rollout (Band Assisted)',
    keywords: ['ab wheel', 'ab rollout', 'wheel rollout', 'ab roller', 'rollout']
  },
  '0084': {
    displayName: 'Ab Wheel Rollout (Barbell)',
    keywords: ['barbell rollout', 'ab rollout', 'rollout', 'ab wheel']
  },
  '0071': {
    displayName: 'Press Sit Up (Barbell)',
    keywords: ['press sit up', 'barbell sit up', 'weighted sit up']
  },
  '0981': {
    displayName: 'Jackknife Sit Up (Band)',
    keywords: ['jackknife', 'jack knife', 'v up', 'band jackknife', 'band v up']
  },
  '0969': {
    displayName: 'Alternating V-Up (Band)',
    keywords: ['v up', 'v ups', 'band v up', 'alternating v up']
  },
  '1014': {
    displayName: 'V-Up (Band)',
    keywords: ['v up', 'v ups', 'band v up', 'v sit up']
  },
  '0972': {
    displayName: 'Bicycle Crunch (Band)',
    keywords: ['bicycle crunch', 'band bicycle crunch', 'banded bicycle crunch', 'cycling crunch']
  },
  '0992': {
    displayName: 'Push Sit Up (Band)',
    keywords: ['push sit up', 'band sit up', 'banded sit up', 'sit up']
  },

  // ===== FULL BODY / CARDIO (10) =====
  '0028': {
    displayName: 'Clean and Press (Barbell)',
    keywords: ['clean and press', 'barbell clean and press', 'clean press', 'power clean and press']
  },
  '0067': {
    displayName: 'One Arm Snatch (Barbell)',
    keywords: ['snatch', 'barbell snatch', 'one arm snatch', 'power snatch']
  },
  '1473': {
    displayName: 'Backward Jump',
    keywords: ['backward jump', 'reverse jump', 'back jump']
  },
  '3672': {
    displayName: 'Back and Forth Step',
    keywords: ['stepping', 'step exercise', 'cardio step', 'back and forth']
  },
  '3543': {
    displayName: 'Drop Jump Squat',
    keywords: ['drop jump squat', 'jump squat', 'plyometric squat', 'drop squat']
  },
  '0020': {
    displayName: 'Balance Board',
    keywords: ['balance board', 'wobble board', 'balance training']
  },

  // ===== FOREARMS / GRIP (4) =====
  '0082': {
    displayName: 'Wrist Curl (Barbell)',
    keywords: ['wrist curl', 'barbell wrist curl', 'forearm curl']
  },
  '0079': {
    displayName: 'Reverse Wrist Curl (Barbell)',
    keywords: ['reverse wrist curl', 'barbell reverse wrist curl', 'forearm extension']
  },
  '1016': {
    displayName: 'Wrist Curl (Band)',
    keywords: ['band wrist curl', 'banded wrist curl', 'wrist curl']
  },
  '0994': {
    displayName: 'Reverse Wrist Curl (Band)',
    keywords: ['band reverse wrist curl', 'banded reverse wrist curl', 'reverse wrist curl']
  },

  // ===== ADDITIONAL POPULAR WOMEN'S EXERCISES (38) =====

  // Glutes/Legs extras
  '0116': {
    displayName: 'Straight Leg Deadlift (Barbell)',
    keywords: ['straight leg deadlift', 'stiff leg deadlift', 'sldl', 'barbell sldl']
  },
  '3193': {
    displayName: 'Glute-Ham Raise',
    keywords: ['glute ham raise', 'ghr', 'glute ham', 'nordic curl', 'hamstring raise']
  },
  '0339': {
    displayName: 'Lying Leg Curl (Dumbbell)',
    keywords: ['dumbbell leg curl', 'lying leg curl', 'hamstring curl', 'db leg curl']
  },
  '0496': {
    displayName: 'Inverse Leg Curl',
    keywords: ['inverse leg curl', 'natural leg curl', 'bodyweight leg curl', 'nordic curl']
  },
  '0069': {
    displayName: 'Overhead Squat (Barbell)',
    keywords: ['overhead squat', 'barbell overhead squat', 'ohs']
  },
  '0068': {
    displayName: 'Pistol Squat (Barbell)',
    keywords: ['pistol squat', 'single leg squat', 'one leg squat', 'barbell pistol squat']
  },
  '0987': {
    displayName: 'Split Squat (Band, Single Arm)',
    keywords: ['split squat', 'band split squat', 'single leg squat', 'lunge']
  },
  '1001': {
    displayName: 'Single Leg Split Squat (Band)',
    keywords: ['split squat', 'bulgarian split squat', 'band split squat', 'single leg squat']
  },
  '0984': {
    displayName: 'Lying Hip Internal Rotation (Band)',
    keywords: ['hip rotation', 'hip internal rotation', 'hip mobility', 'hip warmup']
  },

  // Back extras
  '1431': {
    displayName: 'Assisted Chin Up',
    keywords: ['chin up', 'chin ups', 'chinup', 'chinups', 'assisted chin up', 'underhand pull up']
  },
  '1432': {
    displayName: 'Assisted Pull Up (Standing)',
    keywords: ['pull up', 'pullup', 'assisted pull up', 'pull ups']
  },
  '0076': {
    displayName: 'Rear Delt Row (Barbell)',
    keywords: ['rear delt row', 'barbell rear delt row', 'face pull', 'rear row']
  },
  '1022': {
    displayName: 'Standing Rear Delt Row (Band)',
    keywords: ['band rear delt row', 'banded row', 'rear delt row', 'band face pull']
  },
  '1017': {
    displayName: 'Y-Raise (Band)',
    keywords: ['y raise', 'band y raise', 'y raises', 'shoulder y raise']
  },

  // Chest extras
  '0171': {
    displayName: 'Incline Cable Fly',
    keywords: ['incline cable fly', 'cable incline fly', 'incline fly', 'incline chest fly']
  },
  '0185': {
    displayName: 'Lying Cable Fly',
    keywords: ['lying cable fly', 'flat cable fly', 'cable fly', 'cable chest fly']
  },
  '2364': {
    displayName: 'Assisted Chest Dip (Wide Grip)',
    keywords: ['wide dip', 'chest dip', 'assisted chest dip', 'wide grip dip']
  },
  '0975': {
    displayName: 'Close Grip Push Up (Band)',
    keywords: ['close grip push up', 'diamond push up', 'narrow push up', 'band push up']
  },

  // Shoulders extras
  '0086': {
    displayName: 'Behind the Neck Press (Barbell, Seated)',
    keywords: ['behind the neck press', 'btnp', 'military press', 'behind neck press']
  },
  '1012': {
    displayName: 'Twisting Overhead Press (Band)',
    keywords: ['band overhead press', 'twisting press', 'band shoulder press', 'overhead press']
  },
  '0978': {
    displayName: 'Front Raise (Band)',
    keywords: ['band front raise', 'banded front raise', 'front raise']
  },

  // Biceps extras
  '0080': {
    displayName: 'Reverse Curl (Barbell)',
    keywords: ['reverse curl', 'barbell reverse curl', 'forearm curl', 'reverse bicep curl']
  },
  '0023': {
    displayName: 'Alternating Curl (Barbell)',
    keywords: ['alternating curl', 'barbell alternating curl', 'alternate bicep curl']
  },
  '0072': {
    displayName: 'Prone Incline Curl (Barbell)',
    keywords: ['prone incline curl', 'spider curl', 'incline curl', 'barbell spider curl']
  },

  // Triceps extras
  '1720': {
    displayName: 'Overhead Tricep Extension (Barbell, Lying)',
    keywords: ['lying overhead extension', 'skull crusher', 'behind head extension', 'tricep extension']
  },
  '0035': {
    displayName: 'Decline Skull Crusher (Barbell)',
    keywords: ['decline skull crusher', 'decline tricep extension', 'skull crusher', 'decline close grip press']
  },
  '0055': {
    displayName: 'Lying Close Grip Press (Barbell)',
    keywords: ['close grip press', 'lying close grip press', 'tricep press', 'close grip bench']
  },

  // Abs extras
  '0013': {
    displayName: 'Lying Leg Raise (Throw Down)',
    keywords: ['lying leg raise', 'leg raise', 'throw down', 'leg raises']
  },
  '0012': {
    displayName: 'Lying Leg Raise (Lateral Throw Down)',
    keywords: ['lateral leg raise', 'oblique leg raise', 'lateral throw down', 'leg raise']
  },
  '0010': {
    displayName: 'Hanging Knee Raise (Throw Down)',
    keywords: ['hanging knee raise', 'knee raise', 'captain chair', 'throw down']
  },
  '3204': {
    displayName: 'Full Sit Up (Arms Overhead)',
    keywords: ['sit up', 'full sit up', 'overhead sit up', 'sit ups']
  },

  // Stretching / Mobility (popular for warmup)
  '1709': {
    displayName: 'Lying Glute Stretch',
    keywords: ['glute stretch', 'lying glute stretch', 'piriformis stretch', 'glute stretching']
  },
  '1710': {
    displayName: 'Lying Piriformis Stretch',
    keywords: ['piriformis stretch', 'glute stretch', 'hip stretch', 'deep glute stretch']
  },
  '1708': {
    displayName: 'Lying Calf Stretch',
    keywords: ['calf stretch', 'lying calf stretch', 'calf stretching', 'soleus stretch']
  },
  '1713': {
    displayName: 'Lying Quad Stretch',
    keywords: ['quad stretch', 'quadricep stretch', 'lying quad stretch', 'thigh stretch']
  },
  '1512': {
    displayName: 'All Fours Quad Stretch',
    keywords: ['quad stretch', 'all fours stretch', 'kneeling quad stretch', 'thigh stretch']
  },
  '1368': {
    displayName: 'Ankle Circles',
    keywords: ['ankle circles', 'ankle mobility', 'ankle warmup', 'ankle rotation']
  },
  '1405': {
    displayName: 'Back Pec Stretch',
    keywords: ['pec stretch', 'chest stretch', 'back stretch', 'pectoral stretch']
  },
  '1714': {
    displayName: 'Lying Rectus Femoris Stretch',
    keywords: ['rectus femoris stretch', 'quad stretch', 'hip flexor stretch', 'thigh stretch']
  },
};

// ---------- Main ----------
const mode = process.argv[2];

if (!mode || (mode !== '--preview' && mode !== '--apply')) {
  console.log('Usage:');
  console.log('  node scripts/populate-exercise-names.mjs --preview   # Review before applying');
  console.log('  node scripts/populate-exercise-names.mjs --apply     # Push to Supabase');
  process.exit(0);
}

const ids = Object.keys(EXERCISE_MAPPINGS);
console.log(`Total exercises to update: ${ids.length}`);

if (mode === '--preview') {
  console.log('\n--- PREVIEW (not applied) ---\n');
  console.log('exercise_db_id | display_name | keywords');
  console.log('-------------- | ------------ | --------');
  for (const [id, data] of Object.entries(EXERCISE_MAPPINGS)) {
    console.log(`${id} | ${data.displayName} | ${data.keywords.join(', ')}`);
  }
  console.log(`\nTotal: ${ids.length} exercises`);
  console.log('\nRun with --apply to push to Supabase.');
  process.exit(0);
}

// --apply mode
console.log('\nApplying to Supabase...\n');

let success = 0;
let failed = 0;
const errors = [];

// Process in batches of 10
const entries = Object.entries(EXERCISE_MAPPINGS);
for (let i = 0; i < entries.length; i += 10) {
  const batch = entries.slice(i, i + 10);

  const promises = batch.map(async ([exerciseDbId, data]) => {
    const url = `${SUPABASE_URL}/rest/v1/exercises?exercise_db_id=eq.${exerciseDbId}`;
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        display_name: data.displayName,
        keywords: data.keywords,
        popularity: 5,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      errors.push({ exerciseDbId, status: resp.status, body });
      failed++;
    } else {
      success++;
    }
  });

  await Promise.all(promises);
  process.stdout.write(`  Processed ${Math.min(i + 10, entries.length)}/${entries.length}\r`);
}

console.log(`\n\nDone!`);
console.log(`  Success: ${success}`);
console.log(`  Failed: ${failed}`);

if (errors.length > 0) {
  console.log('\nErrors:');
  for (const err of errors) {
    console.log(`  ID ${err.exerciseDbId}: ${err.status} - ${err.body}`);
  }
}
