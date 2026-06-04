import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { SUMMER_BODY_DESCRIPTIONS } from './summer-body-descriptions';

const ex = (
  name: string,
  sets: number,
  reps: string,
  opts: { supersetGroup?: number; notes?: string } = {}
): ProgramExercise => ({ name, sets, reps, ...opts });

const CARDIO_30 = '30 mins cardio of choice';
const ACTIVE_REST = '30 mins incline walking, stairs or bike';

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { mainFreeText?: string; abs?: ProgramExercise[]; cardio?: string } = {}
): ProgramDay {
  const main: ProgramWorkout = {
    id: `summer-body-w${week}-d${dayInWeek}-main`,
    week,
    dayInWeek,
    type,
    title,
    exercises,
  };
  if (opts.mainFreeText) main.freeText = opts.mainFreeText;
  const workouts: ProgramWorkout[] = [main];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `summer-body-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `summer-body-w${week}-d${dayInWeek}-cardio`,
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

// ════════════════════════════════════════════════════════════════════════════
// PHASE A — Weeks 1-4 (foundation)
// ════════════════════════════════════════════════════════════════════════════

function pAGlutesAbs(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Hip Thrust (Barbell)', 3, '10', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Seated Hip Abduction (Machine)', 3, '10'),
      ex('Step Up (Dumbbell)', 3, '8', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Cable Kickbacks', 3, '8'),
      ex('Cable Crunch', 3, '8'),
      ex('Hanging Knee Raise', 3, '8'),
    ];
  }
  if (week === 2) {
    return [
      ex('Hip Thrust (Barbell)', 3, '12', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Seated Hip Abduction (Machine)', 3, '12'),
      ex('Step Up (Dumbbell)', 3, '10', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Cable Kickbacks', 3, '10'),
      ex('Cable Crunch', 3, '10'),
      ex('Hanging Knee Raise', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('Hip Thrust (Barbell)', 3, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Cable Kickbacks', 3, '10'),
    ex('Cable Crunch', 3, '10'),
    ex('Hanging Knee Raise', 3, '10'),
  ];
}

function pAUpperBack(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Lat Pulldown', 3, '8'),
      ex('Bent Over Row (Barbell)', 3, '8'),
      ex('Face Pulls', 3, '8'),
      ex('Seated Row (Cable)', 3, '10'),
      ex('Bicep Curl (Barbell)', 3, '8'),
      ex('Bicep Curl (Cable)', 3, '10'),
    ];
  }
  if (week === 2) {
    return [
      ex('Lat Pulldown', 3, '10'),
      ex('Bent Over Row (Barbell)', 3, '10'),
      ex('Face Pulls', 3, '10'),
      ex('Seated Row (Cable)', 3, '12'),
      ex('Bicep Curl (Barbell)', 3, '10'),
      ex('Bicep Curl (Cable)', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Bent Over Row (Barbell)', 3, '8'),
    ex('Face Pulls', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Bicep Curl (Barbell)', 3, '8'),
    ex('Bicep Curl (Cable)', 3, '8'),
  ];
}

function pAGlutesHams(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Hip Thrust (Barbell)', 3, '10', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Romanian Deadlift (Barbell)', 3, '10'),
      ex('Lying Leg Curl (Machine)', 3, '8', {
        notes: 'Any leg curl machine works. Use whichever your gym has.',
      }),
      ex('Back Extensions (Hyperextension)', 3, '8', {
        notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
      }),
      ex('Seated Hip Abduction (Machine)', 3, '10'),
    ];
  }
  if (week === 2) {
    return [
      ex('Hip Thrust (Barbell)', 3, '12', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Romanian Deadlift (Barbell)', 3, '10'),
      ex('Lying Leg Curl (Machine)', 3, '10', {
        notes: 'Any leg curl machine works. Use whichever your gym has.',
      }),
      ex('Back Extensions (Hyperextension)', 3, '10', {
        notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
      }),
      ex('Seated Hip Abduction (Machine)', 3, '12'),
    ];
  }
  // weeks 3 & 4
  return [
    ex('Hip Thrust (Barbell)', 3, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Romanian Deadlift (Barbell)', 3, '8'),
    ex('Lying Leg Curl (Machine)', 3, '10', {
      notes: 'Any leg curl machine works. Use whichever your gym has.',
    }),
    ex('Back Extensions (Hyperextension)', 3, '10', {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '10'),
  ];
}

function pAUpper(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Shoulder Press (Machine)', 3, '8'),
      ex('Reverse Fly (Cable)', 3, '8'),
      ex('Face Pulls', 3, '10'),
      ex('Lateral Raise (Dumbbell)', 3, '8'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '8'),
      ex('Triceps Pushdown', 3, '8'),
    ];
  }
  if (week === 2) {
    return [
      ex('Shoulder Press (Machine)', 3, '10'),
      ex('Reverse Fly (Cable)', 3, '12'),
      ex('Face Pulls', 3, '12'),
      ex('Lateral Raise (Dumbbell)', 3, '10'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
      ex('Triceps Pushdown', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same as W2
  return [
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '12'),
    ex('Face Pulls', 3, '12'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function pAQuadsAbs(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Back Squat (Barbell)', 3, '10'),
      ex('Walking Lunges', 3, '8'),
      ex('Leg Extension (Machine)', 3, '8'),
      ex('Cable Crunch', 3, '8'),
      ex('Plank', 3, '60 sec', { supersetGroup: 1 }),
      ex('Hanging Knee Raise', 3, '8', { supersetGroup: 1 }),
    ];
  }
  if (week === 2) {
    return [
      ex('Back Squat (Barbell)', 3, '10'),
      ex('Walking Lunges', 3, '10'),
      ex('Leg Extension (Machine)', 3, '10'),
      ex('Cable Crunch', 3, '10'),
      ex('Plank', 3, '70 sec', { supersetGroup: 1 }),
      ex('Hanging Knee Raise', 3, '10', { supersetGroup: 1 }),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('Back Squat (Barbell)', 3, '8'),
    ex('Walking Lunges', 3, '8'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Cable Crunch', 3, '10'),
    ex('Plank', 3, '70 sec', { supersetGroup: 1 }),
    ex('Hanging Knee Raise', 3, '10', { supersetGroup: 1 }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE B — Weeks 5-8 (new exercises)
// ════════════════════════════════════════════════════════════════════════════

function pBGlutesAbs(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Hip Thrust (Barbell)', 3, '8', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Reverse Lunges (Barbell)', 3, '10'),
      ex('Step Up (Dumbbell)', 3, '10', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Cable Kickbacks', 3, '10'),
      ex('Side Plank Twist with Rear Fly (Dumbbell)', 3, '10'),
      ex('Hanging Oblique Knee Raise', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Hip Thrust (Barbell)', 3, '10', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Reverse Lunges (Barbell)', 3, '10'),
      ex('Step Up (Dumbbell)', 3, '10', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Cable Kickbacks', 3, '12'),
      ex('Side Plank Twist with Rear Fly (Dumbbell)', 3, '12'),
      ex('Hanging Oblique Knee Raise', 3, '12'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Hip Thrust (Barbell)', 3, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Reverse Lunges (Barbell)', 3, '8'),
    ex('Step Up (Dumbbell)', 3, '8', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Cable Kickbacks', 3, '12'),
    ex('Side Plank Twist with Rear Fly (Dumbbell)', 3, '12'),
    ex('Hanging Oblique Knee Raise', 3, '12'),
  ];
}

function pBUpperBack(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm Row (Dumbbell)', 3, '8'),
      ex('Reverse Fly (Cable)', 3, '10'),
      ex('Straight Arm Pulldown', 3, '10', { notes: 'Feel free to use any attachment.' }),
      ex('Bicep Curl (Barbell)', 3, '8'),
      ex('Bicep Curl (Cable)', 3, '8'),
    ];
  }
  if (week === 6) {
    return [
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 3, '10'),
      ex('Reverse Fly (Cable)', 3, '10'),
      ex('Straight Arm Pulldown', 3, '10', { notes: 'Feel free to use any attachment.' }),
      ex('Bicep Curl (Barbell)', 3, '10'),
      ex('Bicep Curl (Cable)', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Assisted Pull Up', 3, '8'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Straight Arm Pulldown', 3, '8', { notes: 'Feel free to use any attachment.' }),
    ex('Bicep Curl (Barbell)', 3, '8'),
    ex('Bicep Curl (Cable)', 3, '8'),
  ];
}

function pBGlutesHams(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Hip Thrust (Barbell)', 3, '10', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Good Morning (Smith Machine)', 3, '8'),
      ex('Lying Leg Curl (Machine)', 3, '10', {
        notes: 'Any leg curl machine works. Use whichever your gym has.',
      }),
      ex('Back Extensions (Hyperextension)', 3, '10', {
        notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
      }),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Hip Thrust (Barbell)', 3, '10', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Good Morning (Smith Machine)', 3, '10'),
      ex('Lying Leg Curl (Machine)', 3, '10', {
        notes: 'Any leg curl machine works. Use whichever your gym has.',
      }),
      ex('Back Extensions (Hyperextension)', 3, '12', {
        notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
      }),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Hip Thrust (Barbell)', 3, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Good Morning (Smith Machine)', 3, '10'),
    ex('Lying Leg Curl (Machine)', 3, '8', {
      notes: 'Any leg curl machine works. Use whichever your gym has.',
    }),
    ex('Back Extensions (Hyperextension)', 3, '12', {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '8'),
  ];
}

function pBUpper(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Shoulder Press (Machine)', 3, '10'),
      ex('Chest Press (Machine)', 3, '8'),
      ex('Iso Lateral High Row (Machine)', 3, '10'),
      ex('Lateral to Front Raise (Dumbbell)', 3, '6'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
      ex('Overhead Triceps Extension (Cable)', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Shoulder Press (Machine)', 3, '10'),
      ex('Chest Press (Machine)', 3, '10'),
      ex('Iso Lateral High Row (Machine)', 3, '10'),
      ex('Lateral to Front Raise (Dumbbell)', 3, '8'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
      ex('Overhead Triceps Extension (Cable)', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Chest Press (Machine)', 3, '10'),
    ex('Iso Lateral High Row (Machine)', 3, '8'),
    ex('Lateral to Front Raise (Dumbbell)', 3, '8'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
    ex('Overhead Triceps Extension (Cable)', 3, '10'),
  ];
}

function pBQuadsAbs(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Pendulum Squat (Machine)', 3, '8'),
      ex('Bulgarian Split Squat (Smith Machine)', 3, '10'),
      ex('Leg Press (Machine)', 3, '8'),
      ex('Leg Extension (Machine)', 3, '10'),
      ex('Decline Crunch', 3, '6', { supersetGroup: 1 }),
      ex('Hanging Oblique Knee Raise', 3, '10', { supersetGroup: 1 }),
    ];
  }
  if (week === 6) {
    return [
      ex('Pendulum Squat (Machine)', 3, '10'),
      ex('Bulgarian Split Squat (Smith Machine)', 3, '10'),
      ex('Leg Press (Machine)', 3, '10'),
      ex('Leg Extension (Machine)', 3, '10'),
      ex('Decline Crunch', 3, '8', { supersetGroup: 1 }),
      ex('Hanging Oblique Knee Raise', 3, '12', { supersetGroup: 1 }),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Pendulum Squat (Machine)', 3, '10'),
    ex('Bulgarian Split Squat (Smith Machine)', 3, '8'),
    ex('Leg Press (Machine)', 3, '10'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Decline Crunch', 3, '8', { supersetGroup: 1 }),
    ex('Hanging Oblique Knee Raise', 3, '12', { supersetGroup: 1 }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE C — Weeks 9-12 (new program)
// ════════════════════════════════════════════════════════════════════════════

function pCGlutesAbs(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hip Thrust (Barbell)', 4, '8', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Seated Hip Abduction (Machine)', 3, '8'),
      ex('Step Up (Dumbbell)', 3, '8', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Back Extensions (Hyperextension)', 3, '12', {
        notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
      }),
      ex('Dead Bug', 3, '10'),
      ex('Hanging Straight Leg Raise', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hip Thrust (Barbell)', 4, '10', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Back Extensions (Hyperextension)', 3, '12', {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
    ex('Dead Bug', 3, '12'),
    ex('Hanging Straight Leg Raise', 3, '10'),
  ];
}

function pCUpperBack(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Seated Row (Cable)', 3, '8'),
      ex('T-Bar Row', 3, '8'),
      ex('Kneeling Face Pull (Cable)', 3, '10'),
      ex('Lateral Raise (Machine)', 3, '8'),
      ex('Hammer Curl (Dumbbell)', 3, '8', { supersetGroup: 1 }),
      ex('Seated Bicep Curl (Dumbbell)', 3, '8', { supersetGroup: 1 }),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Seated Row (Cable)', 3, '10'),
    ex('T-Bar Row', 3, '8'),
    ex('Kneeling Face Pull (Cable)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '8'),
    ex('Hammer Curl (Dumbbell)', 3, '8', { supersetGroup: 1 }),
    ex('Seated Bicep Curl (Dumbbell)', 3, '8', { supersetGroup: 1 }),
  ];
}

function pCGlutesHams(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hip Thrust (Barbell)', 3, '8', {
        notes:
          'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
      }),
      ex('Deficit Reverse Lunge', 3, '10', { notes: 'Can also be done on the smith machine.' }),
      ex('Step Up (Dumbbell)', 3, '8', {
        notes:
          'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
      }),
      ex('Seated Leg Curl (Machine)', 3, '8', {
        notes: 'Any leg curl machine works. Use whichever your gym has.',
      }),
      ex('Romanian Deadlift (Dumbbell)', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hip Thrust (Barbell)', 4, '10', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Deficit Reverse Lunge', 3, '10', { notes: 'Can also be done on the smith machine.' }),
    ex('Step Up (Dumbbell)', 3, '8', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Seated Leg Curl (Machine)', 3, '8', {
      notes: 'Any leg curl machine works. Use whichever your gym has.',
    }),
    ex('Romanian Deadlift (Dumbbell)', 3, '8'),
  ];
}

function pCUpper(week: number): ProgramExercise[] {
  if (week === 9) {
    return [
      ex('Shoulder Press (Machine)', 3, '8'),
      ex('Incline Bench Press (Dumbbell)', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 3, '8'),
      ex('Lateral Raise (Cable)', 3, '8'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 10) {
    return [
      ex('Shoulder Press (Machine)', 3, '8'),
      ex('Incline Bench Press (Dumbbell)', 3, '8'),
      ex('Single Arm Row (Dumbbell)', 3, '8'),
      ex('Lateral Raise (Cable)', 3, '8'),
      ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Incline Bench Press (Dumbbell)', 3, '8'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Cable)', 3, '10'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10'),
  ];
}

function pCQuadsAbs(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hack Squat', 3, '10'),
      ex('Goblet Squat (Dumbbell)', 3, '8', {
        notes: 'These can be done with a dumbbell, kettlebell, plate, or without weight.',
      }),
      ex('Single Leg Press (Horizontal Machine)', 3, '8'),
      ex('Single Leg Extension', 3, '8'),
      ex('Cable Crunch', 3, '8'),
      ex('Hanging Straight Leg Raise', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hack Squat', 3, '10'),
    ex('Goblet Squat (Dumbbell)', 3, '10', {
      notes: 'These can be done with a dumbbell, kettlebell, plate, or without weight.',
    }),
    ex('Single Leg Press (Horizontal Machine)', 3, '10'),
    ex('Single Leg Extension', 3, '10'),
    ex('Cable Crunch', 3, '10'),
    ex('Hanging Straight Leg Raise', 3, '8'),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// Week builder — picks the right phase and assembles all 6 days
// ════════════════════════════════════════════════════════════════════════════

function buildSummerWeek(week: number): ProgramDay[] {
  let glutesAbs: ProgramExercise[];
  let upperBack: ProgramExercise[];
  let glutesHams: ProgramExercise[];
  let upper: ProgramExercise[];
  let quadsAbs: ProgramExercise[];

  if (week <= 4) {
    glutesAbs = pAGlutesAbs(week);
    upperBack = pAUpperBack(week);
    glutesHams = pAGlutesHams(week);
    upper = pAUpper(week);
    quadsAbs = pAQuadsAbs(week);
  } else if (week <= 8) {
    glutesAbs = pBGlutesAbs(week);
    upperBack = pBUpperBack(week);
    glutesHams = pBGlutesHams(week);
    upper = pBUpper(week);
    quadsAbs = pBQuadsAbs(week);
  } else {
    glutesAbs = pCGlutesAbs(week);
    upperBack = pCUpperBack(week);
    glutesHams = pCGlutesHams(week);
    upper = pCUpper(week);
    quadsAbs = pCQuadsAbs(week);
  }

  return [
    buildDay(week, 1, 'lower', 'Glutes & Abs', glutesAbs),
    buildDay(week, 2, 'upper', 'Upper Body (Back)', upperBack, { cardio: CARDIO_30 }),
    buildDay(week, 3, 'lower', 'Glutes & Hamstrings', glutesHams),
    buildDay(week, 4, 'upper', 'Upper Body', upper, { cardio: CARDIO_30 }),
    buildDay(week, 5, 'lower', 'Quads & Abs', quadsAbs),
    buildDay(week, 6, 'cardio', 'Active Rest', [], { mainFreeText: ACTIVE_REST }),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 12; w++) DAYS.push(...buildSummerWeek(w));

for (const day of DAYS) {
  for (const w of day.workouts) {
    const desc = SUMMER_BODY_DESCRIPTIONS[w.id];
    if (desc) w.description = desc;
  }
}

export const SUMMER_BODY_PROGRAM: Program = {
  id: 'summer-body',
  planId: 'summer-body',
  durationWeeks: 12,
  daysPerWeek: 6,
  defaultWeekdays: [1, 2, 3, 4, 5, 6],
  days: DAYS,
};

export default SUMMER_BODY_PROGRAM;
