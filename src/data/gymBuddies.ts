import { ImageSourcePropType } from 'react-native';

export type GymBuddyTagKey = 'goal' | 'identity' | 'stat' | 'why' | 'lifestyle';

// Tag values keyed by their category. Any subset of keys may be present per
// buddy — some buddies have 5 tags, some 3 or 4, two have none.
export type GymBuddyTags = Partial<Record<GymBuddyTagKey, string>>;

export type GymBuddy = {
  id: number;
  name: string;
  // bio is optional — 7 of 20 buddies show no bio (their photo + tags carry it).
  bio: string | null;
  // planId drives the plan banner shown at the bottom of the buddy profile.
  // Always set explicitly so buddies with no tags still get the correct banner.
  planId:
    | 'summer-body'
    | 'pilates-princess'
    | 'hourglass'
    | 'booty'
    | 'it-girl'
    | 'busy-girl'
    | 'muscle-mommy'
    | 'home';
  tags: GymBuddyTags;
  image: ImageSourcePropType;
};

export const GYM_BUDDIES: GymBuddy[] = [
  {
    id: 1,
    name: 'Emma',
    bio: '22. 🇺🇸',
    planId: 'pilates-princess',
    tags: {
      goal: 'Tone up',
      identity: 'Pilates princess',
      why: 'Self love',
      lifestyle: 'Coffee before lifting',
    },
    image: require('../../assets/profileImages/profile-01.png'),
  },
  {
    id: 2,
    name: 'Tilly',
    bio: null,
    planId: 'it-girl',
    tags: {
      goal: 'Build discipline',
      identity: 'Lifter',
      stat: '60 day streak',
      why: 'Discipline',
      lifestyle: 'Headphones in',
    },
    image: require('../../assets/profileImages/profile-02.png'),
  },
  {
    id: 3,
    name: 'Rachel',
    bio: 'just trying my best tbh',
    planId: 'summer-body',
    tags: {
      goal: 'Stay consistent',
      identity: 'Beginner',
      stat: '25+ workouts',
      why: 'Routine',
      lifestyle: '9-5 grind',
    },
    image: require('../../assets/profileImages/profile-03.png'),
  },
  {
    id: 4,
    name: 'Priya',
    bio: '27 | momma bear 🐻',
    planId: 'home',
    tags: {
      goal: 'Be fit',
      identity: 'Gym girlie',
      stat: '30 day streak',
      why: 'Routine',
      lifestyle: 'Lunch break sessions',
    },
    image: require('../../assets/profileImages/profile-04.png'),
  },
  {
    id: 6,
    name: 'Sarah',
    bio: null,
    planId: 'pilates-princess',
    tags: {
      goal: 'Sculpt my abs',
      identity: 'Muscle mommy',
      stat: '50+ workouts',
      why: 'Look good naked',
      lifestyle: 'Headphones in',
    },
    image: require('../../assets/profileImages/profile-06.png'),
  },
  {
    id: 7,
    name: 'Bec',
    bio: 'I just want a dumpy bro',
    planId: 'booty',
    tags: {
      goal: 'Build my booty',
      identity: 'Squat queen',
      stat: '80kg squat',
      why: 'Confidence',
      lifestyle: 'Solo sessions',
    },
    image: require('../../assets/profileImages/profile-07.png'),
  },
  {
    id: 8,
    name: 'Mila',
    bio: 'first plan done. not stopping now.',
    planId: 'muscle-mommy',
    // 3 traits — identity removed (she's not a beginner)
    tags: { goal: 'Stay consistent', stat: 'First plan done', lifestyle: 'Student' },
    image: require('../../assets/profileImages/profile-08.png'),
  },
  {
    id: 9,
    name: 'Hannah',
    bio: '⋆｡°✩',
    planId: 'busy-girl',
    tags: { goal: 'Feel confident', identity: 'Comeback queen', why: 'Self love' },
    image: require('../../assets/profileImages/profile-09.png'),
  },
  {
    id: 10,
    name: 'Aaliyah',
    bio: 'on my grind',
    planId: 'busy-girl',
    tags: {},
    image: require('../../assets/profileImages/profile-10.png'),
  },
  {
    id: 11,
    name: 'Lauren',
    bio: 'late lifer + headphones in.',
    planId: 'hourglass',
    tags: {},
    image: require('../../assets/profileImages/profile-11.png'),
  },
  {
    id: 12,
    name: 'Sofia',
    bio: 'on my busy girl shit',
    planId: 'busy-girl',
    tags: {
      goal: 'Feel confident',
      identity: 'Gym girlie',
      why: 'Look good naked',
      lifestyle: 'Pre workout girlie',
    },
    image: require('../../assets/profileImages/profile-12.png'),
  },
  {
    id: 13,
    name: 'Jess',
    bio: 'i love the beach 🏝️',
    planId: 'summer-body',
    tags: {
      goal: 'Lose weight',
      identity: 'Gym girlie',
      stat: '25+ workouts',
      why: 'Mood booster',
      lifestyle: 'Weekend lifter',
    },
    image: require('../../assets/profileImages/profile-13.png'),
  },
  {
    id: 14,
    name: 'Liv',
    bio: 'coffee, gym, sleep, repeat.',
    planId: 'pilates-princess',
    tags: {
      goal: 'Tone up',
      identity: 'Gym girlie',
      stat: '30 day streak',
      why: 'Confidence',
      lifestyle: 'Coffee before lifting',
    },
    image: require('../../assets/profileImages/profile-14.png'),
  },
  {
    id: 15,
    name: 'Cazz',
    bio: null,
    planId: 'hourglass',
    tags: {
      goal: 'Build my upper body',
      identity: 'Form obsessed',
      stat: '60 day streak',
      why: 'Discipline',
      lifestyle: 'Early bird',
    },
    image: require('../../assets/profileImages/profile-15.png'),
  },
  {
    id: 16,
    name: 'Tay',
    bio: null,
    planId: 'booty',
    tags: {
      goal: 'Build my booty',
      identity: 'Glutes lover',
      stat: '120kg hip thrust',
      why: 'Mood booster',
      lifestyle: 'Headphones in',
    },
    image: require('../../assets/profileImages/profile-16.png'),
  },
  {
    id: 17,
    name: 'Mei',
    bio: 'between classes + gym. just here to feel good.',
    planId: 'home',
    tags: { goal: 'Be fit', identity: 'Beginner', why: 'Mental clarity', lifestyle: 'Student' },
    image: require('../../assets/profileImages/profile-17.png'),
  },
  {
    id: 18,
    name: 'Donna',
    bio: 'comeback sznnn',
    planId: 'summer-body',
    tags: { identity: 'Comeback queen', stat: 'First pull up', why: 'Sleep better' },
    image: require('../../assets/profileImages/profile-18.png'),
  },
  {
    id: 19,
    name: 'Ruby',
    bio: 'beach mornings, gym afternoons',
    planId: 'busy-girl',
    tags: {
      goal: 'Feel confident',
      identity: 'Gym girlie',
      stat: '25+ workouts',
      why: 'Confidence',
      lifestyle: 'Weekend lifter',
    },
    image: require('../../assets/profileImages/profile-19.png'),
  },
  {
    id: 20,
    name: 'Remi',
    bio: null,
    planId: 'muscle-mommy',
    tags: {
      goal: 'Get stronger',
      identity: 'Competitive',
      stat: '100kg deadlift',
      why: 'Prove myself wrong',
      lifestyle: '5am club',
    },
    image: require('../../assets/profileImages/profile-20.png'),
  },
];
