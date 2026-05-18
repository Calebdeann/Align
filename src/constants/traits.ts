export const TRAITS_BOX_H = 90;
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

export type TraitCategory = {
  id: string;
  name: string;
  color: string; // pill background
  dotColor: string; // category header dot
  tags: string[];
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
    id: 'stats',
    name: 'Workout Stats',
    color: '#fcc4bd',
    dotColor: '#F08070',
    tags: [
      '25+ workouts completed',
      '50+ workouts completed',
      '100+ workouts completed',
      '30 day streak',
      '60 day streak',
      '100 day streak',
      '100kg hip thrust',
      '120kg hip thrust',
      '60kg squat',
      '80kg squat',
      '80kg deadlift',
      '100kg deadlift',
      'First pull up',
      '40kg bench',
      'Completed first plan',
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
];
