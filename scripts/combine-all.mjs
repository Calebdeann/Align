import fs from 'fs';

const allExercises = [];
for (let i = 1; i <= 15; i++) {
  try {
    const path = `/tmp/ex_batch${i}.json`;
    if (fs.existsSync(path)) {
      const data = JSON.parse(fs.readFileSync(path, 'utf8'));
      if (data.data) allExercises.push(...data.data);
    }
  } catch (e) {
    console.log(`Batch ${i} failed:`, e.message);
  }
}

console.log('Total exercises fetched:', allExercises.length);

// Show target muscle distribution from API
const apiDist = {};
allExercises.forEach(e => {
  const m = e.targetMuscles?.[0] || 'unknown';
  apiDist[m] = (apiDist[m] || 0) + 1;
});
console.log('\nAPI target muscle distribution:');
Object.entries(apiDist).sort((a,b) => b[1]-a[1]).forEach(([m, c]) => console.log(`${m}: ${c}`));

// Filter wanted patterns - expanded
const patterns = [
  'hip thrust', 'glute bridge', 'romanian deadlift', 'kickback', 'donkey kick',
  'fire hydrant', 'clamshell', 'step up', 'good morning', 'pull through',
  'hip abduction', 'frog', 'squat', 'leg press', 'leg extension', 'lunge',
  'split squat', 'wall sit', 'leg curl', 'deadlift', 'nordic', 'calf',
  'pulldown', 'pull up', 'pullup', 'chin up', 'chinup', 'row', 'face pull',
  'reverse fly', 'hyperextension', 'back extension', 'superman', 'shrug',
  'bench press', 'push up', 'pushup', 'fly', 'crossover', 'chest press', 'pec',
  'shoulder press', 'overhead press', 'lateral raise', 'front raise', 'rear delt',
  'arnold', 'upright row', 'military press', 'pike', 'curl', 'tricep', 'skull',
  'pushdown', 'close grip', 'dip', 'crunch', 'plank', 'leg raise', 'mountain climb',
  'russian twist', 'sit up', 'bicycle', 'dead bug', 'bird dog', 'flutter', 'v up',
  'ab wheel', 'hanging knee', 'woodchop', 'swing', 'single leg', 'raise',
  'extension', 'flexion', 'press', 'pull', 'abduction', 'adduction'
];

const wanted = allExercises.filter(e => {
  const name = e.name.toLowerCase();
  return patterns.some(p => name.includes(p));
});

// Remove duplicates by name
const unique = new Map();
wanted.forEach(e => {
  if (!unique.has(e.name.toLowerCase())) {
    unique.set(e.name.toLowerCase(), e);
  }
});

console.log('\nUnique wanted exercises:', unique.size);

// Save all
const output = Array.from(unique.values()).map(e => ({
  exerciseId: e.exerciseId,
  name: e.name,
  gifUrl: e.gifUrl,
  targetMuscles: e.targetMuscles,
  equipments: e.equipments
}));

fs.writeFileSync('/tmp/all_exercises.json', JSON.stringify(output, null, 2));
console.log('Saved to /tmp/all_exercises.json');
