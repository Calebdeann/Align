// Hand-written descriptions for every workout in the Pilates Princess program.
// Voice: lengthening + sculpting, dancer-aesthetic, pilates complements gym work.

const CARDIO_LINE = '30 mins of your choice — incline walk, stair master, bike, or jog.';
const PILATES_LINE =
  'Reformer or mat class — 45-60 mins. Focus on the breath, control, and length. The gym builds the muscle, pilates shapes the line.';

export const PILATES_PRINCESS_DESCRIPTIONS: Record<string, string> = {
  // ── Week 1 ──────────────────────────────────────────────────────────────────
  'pilates-princess-w1-d1-main':
    "Welcome to Pilates Princess. Hip thrusts open every gym day — pilates can't replicate the heavy glute loading you need to build shape. Sumo squat opens the inner thigh.",
  'pilates-princess-w1-d1-cardio': CARDIO_LINE,
  'pilates-princess-w1-d2-main': PILATES_LINE,
  'pilates-princess-w1-d3-main':
    'Upper day — small weights, high reps, full range. Lateral into front raise is the combo that builds the shoulder cap. Bicep + hammer curl superset for arm length and balance.',
  'pilates-princess-w1-d3-cardio': CARDIO_LINE,
  'pilates-princess-w1-d4-main':
    'Second glute day. Bulgarian split squat + B-stance RDL target the glute med — the side glute that creates the silhouette curve. Back extensions to lock in the hinge.',
  'pilates-princess-w1-d4-abs':
    'Bicycle crunch, table top, plank twists, heel taps — 3 × 12 each. Core control is what makes pilates lines look effortless.',
  'pilates-princess-w1-d5-main': PILATES_LINE,

  // ── Week 2 — Repeat ────────────────────────────────────────────────────────
  'pilates-princess-w2-d1-main':
    'Repeat week. Same lifts — focus on the squeeze at the top of the hip thrust, full hip extension on every rep.',
  'pilates-princess-w2-d1-cardio': CARDIO_LINE,
  'pilates-princess-w2-d2-main': PILATES_LINE,
  'pilates-princess-w2-d3-main':
    'Repeat upper. Try to add 1-2.5kg on the shoulder press or lat pull — small jumps are the right move with higher-rep work.',
  'pilates-princess-w2-d3-cardio': CARDIO_LINE,
  'pilates-princess-w2-d4-main':
    'Repeat second glute day. Bulgarian splits feel more stable now — push the depth.',
  'pilates-princess-w2-d4-abs': 'Same core combo. Pilates-style ab work — slow and controlled.',
  'pilates-princess-w2-d5-main': PILATES_LINE,

  // ── Week 3 — up reps + set jump ────────────────────────────────────────────
  'pilates-princess-w3-d1-main':
    'Hip thrusts to 4 × 8 — heavier set, lower reps. DB RDL + step ups + sumo all to 12. Volume bumps across the rest of the day.',
  'pilates-princess-w3-d1-cardio': CARDIO_LINE,
  'pilates-princess-w3-d2-main': PILATES_LINE,
  'pilates-princess-w3-d3-main':
    'Reps bump on lat pull (12), tricep kickback (12), lateral raises (10). Same weights — let the volume drive the burn.',
  'pilates-princess-w3-d3-cardio': CARDIO_LINE,
  'pilates-princess-w3-d4-main':
    'Hip thrusts to 4 × 8 here too. Bulgarian splits to 10, back extensions to 12. More glute med + hamstring work.',
  'pilates-princess-w3-d4-abs': 'Same core. Focus on slow tempo today.',
  'pilates-princess-w3-d5-main': PILATES_LINE,

  // ── Week 4 — up weights ────────────────────────────────────────────────────
  'pilates-princess-w4-d1-main':
    'DB RDL back to 10 (heavier). Hip thrusts stay at 4 × 8 — push the weight. Final week of phase A.',
  'pilates-princess-w4-d1-cardio': CARDIO_LINE,
  'pilates-princess-w4-d2-main': PILATES_LINE,
  'pilates-princess-w4-d3-main':
    'Reps shift down on shoulder press (10) and tricep kickback (8) — heavier loading. Lat pull stays at 10. Final phase A upper.',
  'pilates-princess-w4-d3-cardio': CARDIO_LINE,
  'pilates-princess-w4-d4-main':
    'Final phase A glutes. Heaviest Bulgarian split + B-stance RDL of the phase.',
  'pilates-princess-w4-d4-abs':
    "Last week of the bicycle/plank-twist combo. Phase B's abs are different.",
  'pilates-princess-w4-d5-main': PILATES_LINE,

  // ── Week 5 — Phase B opens ─────────────────────────────────────────────────
  'pilates-princess-w5-d1-main':
    'Welcome to phase B. Reverse deficit lunge replaces step ups — bigger range, more glute med. BB RDL replaces DB — heavier loading possible. Leg curls add hamstring isolation.',
  'pilates-princess-w5-d1-cardio': CARDIO_LINE,
  'pilates-princess-w5-d2-main': PILATES_LINE,
  'pilates-princess-w5-d3-main':
    'New upper. Seated cable row replaces face pull as the mid-back lift. Around the worlds (DB) for shoulder control + cap shape. Tricep extension DB for arm length.',
  'pilates-princess-w5-d3-cardio': CARDIO_LINE,
  'pilates-princess-w5-d4-main':
    'New second glute day. Good mornings teach perfect hip hinge — keep weight light, focus on the stretch. DB step ups for unilateral glute work.',
  'pilates-princess-w5-d4-abs':
    'New abs combo: dead bugs, elbow-to-knee crunch, lying leg raise — 3 × 12. Pilates-flavoured core work.',
  'pilates-princess-w5-d5-main': PILATES_LINE,
  'pilates-princess-w5-d5-cardio': CARDIO_LINE,

  // ── Week 6 ──────────────────────────────────────────────────────────────────
  'pilates-princess-w6-d1-main':
    'Repeat phase B opener. Reverse deficit lunges feel more controlled now — push the depth.',
  'pilates-princess-w6-d1-cardio': CARDIO_LINE,
  'pilates-princess-w6-d2-main': PILATES_LINE,
  'pilates-princess-w6-d3-main': 'Repeat phase B upper. Seated row — try to add 2.5kg.',
  'pilates-princess-w6-d3-cardio': CARDIO_LINE,
  'pilates-princess-w6-d4-main':
    'Repeat second glute day. Good mornings — slow tempo, big stretch.',
  'pilates-princess-w6-d4-abs':
    'Same abs combo. Lying leg raise — keep lower back pressed into the floor.',
  'pilates-princess-w6-d5-main': PILATES_LINE,
  'pilates-princess-w6-d5-cardio': CARDIO_LINE,

  // ── Week 7 — up reps ────────────────────────────────────────────────────────
  'pilates-princess-w7-d1-main':
    'Hip thrusts + reverse deficit lunge + BB RDL all bump to 10. More volume on the heavier lifts. Eat enough today.',
  'pilates-princess-w7-d1-cardio': CARDIO_LINE,
  'pilates-princess-w7-d2-main': PILATES_LINE,
  'pilates-princess-w7-d3-main':
    'Lat pull, seated row, reverse fly all to 12. Around the worlds to 12. Tricep extension to 10. Volume across the whole upper body.',
  'pilates-princess-w7-d3-cardio': CARDIO_LINE,
  'pilates-princess-w7-d4-main':
    'Hip thrusts to 10. Same other lifts. Penultimate week — push the glute work.',
  'pilates-princess-w7-d4-abs': 'Same abs combo.',
  'pilates-princess-w7-d5-main': PILATES_LINE,
  'pilates-princess-w7-d5-cardio': CARDIO_LINE,

  // ── Week 8 — Final week, up weights ────────────────────────────────────────
  'pilates-princess-w8-d1-main':
    'Final week. Reps drop back, weights up. Heaviest hip thrust + BB RDL of the program.',
  'pilates-princess-w8-d1-cardio': CARDIO_LINE,
  'pilates-princess-w8-d2-main': PILATES_LINE,
  'pilates-princess-w8-d3-main':
    'Final upper. Reps back down — heaviest lat pull + seated row of the program.',
  'pilates-princess-w8-d3-cardio': CARDIO_LINE,
  'pilates-princess-w8-d4-main':
    "Final glute day. Hip thrusts to 4 × 8 — push the heaviest weight you've used this program.",
  'pilates-princess-w8-d4-abs': 'Final core session. Take a progress photo this week.',
  'pilates-princess-w8-d5-main': PILATES_LINE,
  'pilates-princess-w8-d5-cardio': CARDIO_LINE,
};
