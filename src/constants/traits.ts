export const TRAITS_BOX_H = 140;
export const TRAITS_PILL_H = 30;
export const TRAITS_SCALE_MIN = 0.6;
export const TRAITS_SCALE_MAX = 1.8;

export type PlacedTrait = {
  categoryId: string;
  tag: string;
  x: number; // normalized 0–1 (fraction of canvas width)
  y: number; // normalized 0–1 (fraction of canvas height)
  rotation: number; // radians
  scale?: number; // defaults to 1 if absent
};

export type TraitTag = string | { tag: string; verifyKey: string };

export type TraitCategory = {
  id: string;
  name: string;
  color: string; // pill background
  dotColor: string; // category header dot
  tags: TraitTag[];
};

export const TRAIT_CATEGORIES: TraitCategory[] = [
  {
    id: 'goals',
    name: 'My Goals',
    color: '#d3e9c5',
    dotColor: '#7CC96B',
    tags: [
      'Be fit',
      'Lose weight',
      'Build muscle',
      'Build discipline',
      'Get stronger',
      'Tone up',
      'Build my booty',
      'Sculpt my abs',
      'Hit a PR',
      'Stay consistent',
      'Feel confident',
      'Build my upper body',
    ],
  },
  {
    id: 'identity',
    name: 'Identity',
    color: '#e3c5e9',
    dotColor: '#C07BD0',
    tags: [
      'Pilates princess',
      'Muscle mommy',
      'Glutes lover',
      'Gym girlie',
      'Lifter',
      'Yogi',
      'Beginner',
      'Comeback queen',
      'Shy at the gym',
      'Competitive',
      'Heavy lifter',
      'Form obsessed',
      'Plate stacker',
      'Squat queen',
      'Deadlift girlie',
    ],
  },
  {
    id: 'why',
    name: 'Why I Train',
    color: '#f9e597',
    dotColor: '#E8C830',
    tags: [
      'Mental clarity',
      'Stress relief',
      'Self love',
      'Confidence',
      'More energy',
      'Mood booster',
      'Sleep better',
      'Anxiety management',
      'Discipline',
      'Feel strong',
      'Look good naked',
      'Me time',
      'Headspace',
      'Routine',
      'Prove myself wrong',
    ],
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    color: '#97d5f9',
    dotColor: '#5AADF5',
    tags: [
      '5am club',
      'Early bird',
      'Night owl',
      'Weekend lifter',
      'Lunch break sessions',
      'Gym rat',
      'Mum life',
      '9-5 grind',
      'Student',
      'Wedding prep',
      'Coffee before lifting',
      'Pre workout girlie',
      'Solo sessions',
      'Headphones in',
      'Always cold',
    ],
  },
  {
    id: 'stats',
    name: 'Workout Stats',
    color: '#fcc4bd',
    dotColor: '#F08070',
    tags: [
      // Immediate — always unlocked
      'Day 1',
      'It Girl era',
      'Locked in',
      // Easy thresholds
      { tag: 'First workout', verifyKey: 'workout_first' },
      { tag: '10+ workouts', verifyKey: 'workouts_10' },
      { tag: 'Week 1 done', verifyKey: 'streak_7' },
      // Existing milestones
      { tag: '25+ workouts', verifyKey: 'workouts_25' },
      { tag: '50+ workouts', verifyKey: 'workouts_50' },
      { tag: '100+ workouts', verifyKey: 'workouts_100' },
      { tag: '30 day streak', verifyKey: 'streak_30' },
      { tag: '60 day streak', verifyKey: 'streak_60' },
      { tag: '100 day streak', verifyKey: 'streak_100' },
      { tag: '100kg hip thrust', verifyKey: 'hipthrust_100' },
      { tag: '120kg hip thrust', verifyKey: 'hipthrust_120' },
      { tag: '60kg squat', verifyKey: 'squat_60' },
      { tag: '80kg squat', verifyKey: 'squat_80' },
      { tag: '80kg deadlift', verifyKey: 'deadlift_80' },
      { tag: '100kg deadlift', verifyKey: 'deadlift_100' },
      { tag: 'First pull up', verifyKey: 'pullup_first' },
      { tag: '40kg bench', verifyKey: 'bench_40' },
      { tag: 'First plan done', verifyKey: 'plan_first' },
    ],
  },
];

/** Resolve a `TraitTag` (string or object) to the display label. */
export function getTraitLabel(t: TraitTag): string {
  return typeof t === 'string' ? t : t.tag;
}

/** Resolve a `TraitTag` to its eligibility key, or null if it's a free tag. */
export function getTraitVerifyKey(t: TraitTag): string | null {
  return typeof t === 'string' ? null : t.verifyKey;
}
