import fs from 'fs';

const exercises = JSON.parse(fs.readFileSync('/tmp/all_exercises.json', 'utf8'));

function mapMuscleGroup(name, targetMuscles) {
  const n = name.toLowerCase();
  const target = (targetMuscles?.[0] || '').toLowerCase();

  // Name-based mapping
  if (n.includes('hip thrust') || n.includes('glute bridge') || n.includes('glute kickback') ||
      n.includes('donkey kick') || n.includes('fire hydrant') || n.includes('clamshell') ||
      n.includes('hip abduction') || n.includes('frog')) return 'glutes';
  if (n.includes('romanian') || n.includes('stiff leg')) return 'glutes';
  if (n.includes('step up') && n.indexOf('push') === -1) return 'glutes';
  if (n.includes('squat') || n.includes('leg press') || n.includes('leg extension') ||
      n.includes('lunge') || n.includes('split squat')) return 'quads';
  if (n.includes('leg curl') || n.includes('hamstring') || n.includes('nordic')) return 'hamstrings';
  if (n.includes('deadlift') && n.indexOf('romanian') === -1 && n.indexOf('stiff') === -1) return 'hamstrings';
  if (n.includes('calf')) return 'calves';
  if (n.includes('pulldown') || n.includes('lat ') || n.includes('pull up') || n.includes('pullup') ||
      n.includes('chin up') || n.includes('chinup')) return 'lats';
  if (n.includes('row') || n.includes('face pull') || n.includes('reverse fly')) return 'upper back';
  if (n.includes('hyperextension') || n.includes('back extension') || n.includes('superman')) return 'lower back';
  if (n.includes('shrug')) return 'traps';
  if (n.includes('bench press') || n.includes('push up') || n.includes('pushup') ||
      n.includes('fly') || n.includes('crossover') || n.includes('chest press') || n.includes('pec')) return 'chest';
  if (n.includes('shoulder press') || n.includes('overhead press') || n.includes('lateral raise') ||
      n.includes('front raise') || n.includes('rear delt') || n.includes('arnold') ||
      n.includes('upright row') || n.includes('military') || n.includes('pike push')) return 'shoulders';
  if (n.includes('curl') && n.indexOf('leg') === -1) {
    if (n.includes('tricep') || n.includes('skull')) return 'triceps';
    return 'biceps';
  }
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('skull') ||
      n.includes('close grip bench') || n.includes('dip')) return 'triceps';
  if (n.includes('crunch') || n.includes('plank') || n.includes('leg raise') ||
      n.includes('mountain climb') || n.includes('russian twist') || n.includes('sit up') ||
      n.includes('bicycle') || n.includes('dead bug') || n.includes('bird dog') ||
      n.includes('flutter') || n.includes('v up') || n.includes('ab ') ||
      n.includes('hanging knee') || n.includes('woodchop')) return 'abs';
  if (n.includes('swing')) return 'glutes';
  if (n.includes('single leg') && (n.includes('squat') || n.includes('press'))) return 'quads';

  // Fallback to API target muscle
  const muscleMap = {
    'upper back': 'upper back',
    'triceps': 'triceps',
    'biceps': 'biceps',
    'pectorals': 'chest',
    'delts': 'shoulders',
    'quads': 'quads',
    'quadriceps': 'quads',
    'glutes': 'glutes',
    'hamstrings': 'hamstrings',
    'lats': 'lats',
    'abs': 'abs',
    'calves': 'calves',
    'traps': 'traps',
    'forearms': 'forearms',
    'serratus anterior': 'chest',
    'abductors': 'glutes',
    'adductors': 'quads',
    'levator scapulae': 'traps',
    'cardiovascular system': 'cardio',
  };

  return muscleMap[target] || target || 'other';
}

function mapEquipment(equipments) {
  const e = (equipments?.[0] || 'body weight').toLowerCase();
  const map = {
    'body weight': 'body weight', 'barbell': 'barbell', 'dumbbell': 'dumbbell',
    'cable': 'cable', 'machine': 'machine', 'leverage machine': 'machine',
    'sled machine': 'machine', 'smith machine': 'smith machine', 'kettlebell': 'kettlebell',
    'ez barbell': 'barbell', 'band': 'bands', 'resistance band': 'bands',
    'rope': 'cable', 'trap bar': 'barbell', 'wheel roller': 'ab wheel',
    'stability ball': 'exercise ball', 'olympic barbell': 'barbell',
  };
  return map[e] || e;
}

// Generate seed data
const seedData = exercises.map(e => ({
  name: e.name,
  muscle_group: mapMuscleGroup(e.name, e.targetMuscles),
  equipment: mapEquipment(e.equipments),
  image_url: e.gifUrl,
}));

// Show distribution
const dist = {};
seedData.forEach(e => dist[e.muscle_group] = (dist[e.muscle_group] || 0) + 1);
console.log('Distribution:');
Object.entries(dist).sort((a,b) => b[1]-a[1]).forEach(([m, c]) => console.log(m + ': ' + c));
console.log('Total:', seedData.length);

// Save for seed script
fs.writeFileSync('/tmp/seed_data.json', JSON.stringify(seedData, null, 2));
console.log('Saved to /tmp/seed_data.json');
