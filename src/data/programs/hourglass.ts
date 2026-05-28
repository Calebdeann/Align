import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { HOURGLASS_DESCRIPTIONS } from './hourglass-descriptions';

const ex = (name: string, sets: number, reps: string): ProgramExercise => ({ name, sets, reps });

const ABS_FAV: ProgramExercise[] = [
  ex('Hanging knee raise', 3, '12'),
  ex('Plank', 3, '45 sec'),
  ex('Russian twist', 3, '20 (10 each side)'),
];
const ABS_CABLE: ProgramExercise[] = [
  ex('Cable crunch', 3, '12'),
  ex('Cable woodchopper', 3, '10 each side'),
  ex('Hanging knee raise', 3, '12'),
];
const CARDIO_30 = '30 mins cardio - walk, stairs, bike';

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { abs?: ProgramExercise[]; cardio?: string } = {}
): ProgramDay {
  const workouts: ProgramWorkout[] = [
    {
      id: `hourglass-w${week}-d${dayInWeek}-main`,
      week,
      dayInWeek,
      type,
      title,
      exercises,
    },
  ];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `hourglass-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `hourglass-w${week}-d${dayInWeek}-cardio`,
      week,
      dayInWeek,
      type: 'cardio',
      title: 'Cardio',
      exercises: [],
      freeText: opts.cardio,
    });
  }
  return { week, dayInWeek, workouts };
}

const DAYS: ProgramDay[] = [
  // Week 1
  buildDay(
    1,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 3, '12'),
      ex('Cable Step Ups', 3, '8'),
      ex('Bulgarian Split Squats', 3, '10'),
      ex('Back Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_FAV }
  ),
  buildDay(1, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '10'),
    ex('Shoulder Press', 3, '10'),
    ex('Seated Row', 3, '12'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('DB Bicep Curls', 3, '10'),
  ]),
  buildDay(
    1,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('RDLs', 3, '10'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '12'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    1,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 3, '12'),
      ex('Hip Abductors', 3, '12'),
      ex('B Stance or Single Leg RDL', 3, '8'),
      ex('Close Grip Lat Pull Down', 3, '8'),
      ex('Single Arm Dumbbell Row', 3, '10'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 2 — up reps if possible, else increase weight
  buildDay(
    2,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 3, '12'),
      ex('Cable Step Ups', 3, '10'),
      ex('Bulgarian Split Squats', 3, '10'),
      ex('Back Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_FAV }
  ),
  buildDay(2, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '12'),
    ex('Shoulder Press', 3, '10'),
    ex('Seated Row', 3, '12'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('DB Bicep Curls', 3, '12'),
  ]),
  buildDay(
    2,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('RDLs', 3, '10'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '12'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    2,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 3, '12'),
      ex('Hip Abductors', 3, '12'),
      ex('B Stance or Single Leg RDL', 3, '10'),
      ex('Close Grip Lat Pull Down', 3, '10'),
      ex('Single Arm Dumbbell Row', 3, '10'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 3 — increase weight
  buildDay(
    3,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 3, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Bulgarian Split Squats', 3, '6'),
      ex('Back Extensions', 3, '10'),
      ex('Cable Kickbacks', 3, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(3, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '10'),
    ex('Shoulder Press', 3, '10'),
    ex('Seated Row', 3, '10'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('DB Bicep Curls', 3, '10'),
  ]),
  buildDay(
    3,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('RDLs', 3, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '10'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    3,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 3, '8'),
      ex('Hip Abductors', 3, '12'),
      ex('B Stance or Single Leg RDL', 3, '10'),
      ex('Close Grip Lat Pull Down', 3, '8'),
      ex('Single Arm Dumbbell Row', 3, '10'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 4 — increase sets
  buildDay(
    4,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Bulgarian Split Squats', 3, '6'),
      ex('Back Extensions', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(4, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '10'),
    ex('Shoulder Press', 4, '10'),
    ex('Seated Row', 3, '10'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('DB Bicep Curls', 4, '10'),
  ]),
  buildDay(
    4,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('RDLs', 3, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '10'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    4,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Hip Abductors', 4, '8'),
      ex('B Stance or Single Leg RDL', 3, '10'),
      ex('Close Grip Lat Pull Down', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 5 — increase weights
  buildDay(
    5,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Bulgarian Split Squats', 3, '6'),
      ex('Back Extensions', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(5, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '10'),
    ex('Shoulder Press', 4, '10'),
    ex('Seated Row', 3, '10'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('DB Bicep Curls', 4, '10'),
  ]),
  buildDay(
    5,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('RDLs', 3, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '10'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    5,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Hip Abductors', 4, '8'),
      ex('B Stance or Single Leg RDL', 3, '10'),
      ex('Close Grip Lat Pull Down', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 6 — increase weights
  buildDay(
    6,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Bulgarian Split Squats', 3, '6'),
      ex('Back Extensions', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(6, 2, 'upper', 'Upper', [
    ex('Lat Pull Downs', 3, '10'),
    ex('Shoulder Press', 4, '10'),
    ex('Seated Row', 3, '10'),
    ex('Lateral Raises', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('DB Bicep Curls', 4, '10'),
  ]),
  buildDay(
    6,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('DB RDLs', 3, '8'),
      ex('Cable Step Ups', 3, '8'),
      ex('Reverse Lunges', 3, '8'),
      ex('Hamstring Curls', 3, '10'),
      ex('Goblet Squat', 3, '10'),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    6,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Hip Abductors', 4, '8'),
      ex('B Stance or Single Leg RDL', 3, '10'),
      ex('Close Grip Lat Pull Down', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Shoulder Press Machine', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 7 — change exercises
  buildDay(
    7,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Good Mornings (Smith)', 3, '8'),
      ex('Deficit Reverse Lunge', 2, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(7, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '10'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '10'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    7,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '8'),
      ex('Step Up Dumbbells', 3, '8'),
      ex('Walking Lunges', 3, '8'),
      ex('Leg Extensions', 3, '10'),
      ex('Cable Kickbacks', 3, '10'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    7,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Deadlift or RDL (BB)', 3, '10'),
      ex('Back Extensions', 3, '10'),
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Arnold Press', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 8 — repeat
  buildDay(
    8,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Good Mornings (Smith)', 3, '8'),
      ex('Deficit Reverse Lunge', 2, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(8, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '10'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '10'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    8,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '8'),
      ex('Step Up Dumbbells', 3, '8'),
      ex('Walking Lunges', 3, '8'),
      ex('Leg Extensions', 3, '10'),
      ex('Cable Kickbacks', 3, '10'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    8,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '8'),
      ex('Deadlift or RDL (BB)', 3, '10'),
      ex('Back Extensions', 3, '10'),
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Arnold Press', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 9 — up reps
  buildDay(
    9,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Good Mornings (Smith)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(9, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '12'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '12'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    9,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '10'),
      ex('Step Up Dumbbells', 3, '10'),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    9,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Deadlift or RDL (BB)', 3, '12'),
      ex('Back Extensions', 3, '12'),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '10'),
      ex('Arnold Press', 3, '10'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 10 — up weights
  buildDay(
    10,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Good Mornings (Smith)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(10, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '10'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    10,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '8'),
      ex('Step Up Dumbbells', 3, '10'),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    10,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Deadlift or RDL (BB)', 3, '10'),
      ex('Back Extensions', 3, '8'),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Arnold Press', 3, '8'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 11 — repeat
  buildDay(
    11,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Good Mornings (Smith)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(11, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '10'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    11,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '8'),
      ex('Step Up Dumbbells', 3, '10'),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    11,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Deadlift or RDL (BB)', 3, '10'),
      ex('Back Extensions', 3, '8'),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Arnold Press', 3, '8'),
    ],
    { cardio: CARDIO_30 }
  ),

  // Week 12 — final week
  buildDay(
    12,
    1,
    'lower',
    'Lower (Session 1)',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Good Mornings (Smith)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8'),
      ex('DB RDLs', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(12, 2, 'upper', 'Upper', [
    ex('Single Arm Machine Rows (Wide Grip)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10'),
    ex('Reverse Flies', 3, '10'),
    ex('Incline Front Raise', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Cable Bicep Curls', 4, '10'),
  ]),
  buildDay(
    12,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press', 3, '8'),
      ex('Step Up Dumbbells', 3, '10'),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extensions', 3, '12'),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_CABLE, cardio: CARDIO_30 }
  ),
  buildDay(
    12,
    4,
    'full-body',
    'Full Body',
    [
      ex('Hip Thrusts', 4, '10'),
      ex('Deadlift or RDL (BB)', 3, '10'),
      ex('Back Extensions', 3, '8'),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Dumbbell Row', 4, '8'),
      ex('Arnold Press', 3, '8'),
    ],
    { cardio: CARDIO_30 }
  ),
];

// Attach hand-written descriptions to every workout. Falls back to undefined
// (and then to WORKOUT_PREVIEW_LOREM at render time) if a key is missing.
for (const day of DAYS) {
  for (const w of day.workouts) {
    const desc = HOURGLASS_DESCRIPTIONS[w.id];
    if (desc) {
      w.description = desc;
    } else if (__DEV__) {
      console.warn(`[hourglass] missing description for ${w.id}`);
    }
  }
}

export const HOURGLASS_PROGRAM: Program = {
  id: 'hourglass',
  planId: 'hourglass',
  durationWeeks: 12,
  daysPerWeek: 4,
  defaultWeekdays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  days: DAYS,
};
