import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { HOURGLASS_DESCRIPTIONS } from './hourglass-descriptions';

const ex = (name: string, sets: number, reps: string, notes?: string): ProgramExercise =>
  notes ? { name, sets, reps, notes } : { name, sets, reps };

const ABS_FAV: ProgramExercise[] = [
  ex('Hanging Knee Raise', 3, '12'),
  ex('Plank', 3, '45 sec'),
  ex('Russian Twist', 3, '20 (10 each side)'),
];
const ABS_CABLE: ProgramExercise[] = [
  ex('Cable Crunch', 3, '12'),
  ex('Wood Chopper (Cable)', 3, '10 each side'),
  ex('Hanging Knee Raise', 3, '12'),
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
      ex(
        'Hip Thrust (Barbell)',
        3,
        '12',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '12',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_FAV }
  ),
  buildDay(1, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '10'),
    ex('Seated Row (Cable)', 3, '12'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
  ]),
  buildDay(
    1,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '10'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '12',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    1,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        3,
        '12',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 3, '12'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '8'),
      ex('Lat Pulldown', 3, '8', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 3, '10'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        3,
        '12',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '10',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '12',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 3, '12'),
    ],
    { abs: ABS_FAV }
  ),
  buildDay(2, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '12', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '10'),
    ex('Seated Row (Cable)', 3, '12'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '12'),
  ]),
  buildDay(
    2,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '10'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '12',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    2,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        3,
        '12',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 3, '12'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Lat Pulldown', 3, '10', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 3, '10'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        3,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '6'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 3, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(3, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
  ]),
  buildDay(
    3,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '10',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    3,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        3,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 3, '12'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Lat Pulldown', 3, '8', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 3, '10'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '6'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(4, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 4, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 4, '10'),
  ]),
  buildDay(
    4,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '10',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    4,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 4, '8'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Lat Pulldown', 3, '8', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '6'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(5, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 4, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 4, '10'),
  ]),
  buildDay(
    5,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '10',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    5,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 4, '8'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Lat Pulldown', 3, '8', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Bulgarian Split Squats', 3, '6'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(6, 2, 'upper', 'Upper', [
    ex('Lat Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Seated Shoulder Press (Dumbbell)', 4, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Face Pulls', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 4, '10'),
  ]),
  buildDay(
    6,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Romanian Deadlift (Barbell)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Reverse Lunges (Barbell)', 3, '8'),
      ex(
        'Lying Leg Curl (Machine)',
        3,
        '10',
        'Any leg curl machine works. Use whichever your gym has.'
      ),
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '10',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
    ],
    { abs: ABS_CABLE }
  ),
  buildDay(
    6,
    4,
    'full-body',
    'Full Body',
    [
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Seated Hip Abduction (Machine)', 4, '8'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Lat Pulldown', 3, '8', 'Close Grip'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Shoulder Press (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '8'),
      ex('Deficit Reverse Lunge', 2, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(7, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '10'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '10'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    7,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '8'),
      ex('Leg Extension (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Arnold Press (Dumbbell)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '8'),
      ex('Deficit Reverse Lunge', 2, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '10'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(8, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '10'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '10'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    8,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '8'),
      ex('Leg Extension (Machine)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '8',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '10',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Arnold Press (Dumbbell)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(9, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '12'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '12'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    9,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '10'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '10',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extension (Machine)', 3, '12'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '12'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '12',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 4, '10'),
      ex('Arnold Press (Dumbbell)', 3, '10'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(10, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '10'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    10,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '10',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extension (Machine)', 3, '12'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '8',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Arnold Press (Dumbbell)', 3, '8'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(11, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '10'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    11,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '10',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extension (Machine)', 3, '12'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '8',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Arnold Press (Dumbbell)', 3, '8'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Good Morning (Smith Machine)', 3, '10'),
      ex('Deficit Reverse Lunge', 3, '8', 'Can also be done on the smith machine.'),
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Cable Kickbacks', 4, '12'),
    ],
    { abs: ABS_FAV, cardio: CARDIO_30 }
  ),
  buildDay(12, 2, 'upper', 'Upper', [
    ex('Seated Single Arm Row (Cable)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Chest Supported Reverse Fly (Dumbbell)', 3, '10'),
    ex('Incline Front Raise (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 4, '10'),
  ]),
  buildDay(
    12,
    3,
    'lower',
    'Lower (Session 2)',
    [
      ex('Leg Press (Machine)', 3, '8'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '10',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extension (Machine)', 3, '12'),
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
      ex(
        'Hip Thrust (Barbell)',
        4,
        '10',
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
      ),
      ex('Deadlift (Barbell)', 3, '10'),
      ex(
        'Back Extensions (Hyperextension)',
        3,
        '8',
        'Hold onto a plate or dumbbell at your chest to increase difficulty.'
      ),
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 4, '8'),
      ex('Arnold Press (Dumbbell)', 3, '8'),
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
