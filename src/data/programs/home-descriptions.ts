// Hand-written descriptions for every workout in the Home program.
// Keyed by ProgramWorkout.id. Same casual coach voice as HOURGLASS_DESCRIPTIONS.
//
// Program shape: 8 weeks × 5 days. Phase A (W1-4) is dumbbell + bodyweight
// foundation. Phase B (W5-8) introduces barbell movements and bumps loading.
// Days: 1 Glutes, 2 Abs+Cardio, 3 Upper, 4 Abs+Cardio, 5 Lower.

export const HOME_DESCRIPTIONS: Record<string, string> = {
  // ───────── Week 1 — Foundation ─────────
  'home-w1-d1-main':
    'First glute day. DB RDLs and sumo squats build the posterior chain; single leg hip thrust and reverse lunge add unilateral work. Keep dumbbells honest — better to hit clean form on a lighter pair than swing a heavier one.',
  'home-w1-d2-main':
    "Abs + cardio. Dead bug, heel taps, reverse and bicycle crunch — four-move core circuit. Pair with the 30-min cardio of your choice for the day's aerobic load.",
  'home-w1-d3-main':
    'Upper body. Shoulder press, single arm row, lateral raise, bicep curl, tricep kickback. Classic dumbbell five — work each through a full range, controlled tempo.',
  'home-w1-d4-main':
    'Second abs + cardio of the week. Mountain climbers wake up the obliques; ab crunch and elbow-to-knee work the rectus. Hold a 60-second plank to close — quality over quantity.',
  'home-w1-d5-main':
    'Lower body. Goblet squat, single leg RDL, calf raise, then BB good mornings and split squats. Foundation week — focus on grooving the movement patterns.',

  // ───────── Week 2 — Reps up ─────────
  'home-w2-d1-main':
    'Glutes, reps bump up. DB RDL to 12, sumo squat to 15, single leg hip thrust to 4 sets of 8. Same weights as last week — the volume jump is the progression.',
  'home-w2-d2-main':
    'Abs + cardio, all reps up to 12 (or 15 for heel taps). The aerobic base is starting to compound — the cardio should feel slightly easier at the same pace.',
  'home-w2-d3-main':
    'Upper, reps up to 12 across the board. By now your shoulder press groove should feel cleaner — the tighter form is what unlocks the heavier dumbbells in phase B.',
  'home-w2-d4-main':
    'Abs + cardio. Same circuit, reps the same. Plank stays at 60 seconds this week — push duration next week.',
  'home-w2-d5-main':
    'Lower, reps up. Goblet squat and single leg RDL to 12, good mornings to 10. Form check: knees tracking over toes, hinge from the hips on the RDL.',

  // ───────── Week 3 — Hold reps, push load ─────────
  'home-w3-d1-main':
    "Glutes, same rep targets as week two. Now try adding 1-2kg per dumbbell on the RDL and hip thrust. If your form holds at the new weight, that's the progression.",
  'home-w3-d2-main':
    'Abs + cardio. The four-move circuit at week-two rep counts — should feel familiar enough to push intensity within sets.',
  'home-w3-d3-main':
    'Upper, week-two reps. Lateral raises are the lift to push — even half a kilo per side moves the needle for medial delts.',
  'home-w3-d4-main':
    "Abs + cardio. Plank moves to 70 seconds this week — that's where the bracing endurance starts to matter for the lower-day squats.",
  'home-w3-d5-main':
    "Lower, hold reps. Split squats are unilateral — match reps left and right, don't let your strong side carry the weak one.",

  // ───────── Week 4 — Set bump ─────────
  'home-w4-d1-main':
    "Glutes, sets jump to 4 on RDL and sumo squat. That's a meaningful volume increase — pair with shorter rest if you're tight on time.",
  'home-w4-d2-main':
    'Abs + cardio. Same exercises, ab crunch and elbow-to-knee bump to 3 sets. Plank holds at 80 seconds today.',
  'home-w4-d3-main':
    'Upper, set bumps on press, row, lateral raise, and bicep curl. Tricep kickback stays at 3 sets to keep the elbow joint fresh.',
  'home-w4-d4-main':
    'Abs + cardio. Final phase-A core session. Plank at 80 seconds — last week of bodyweight-only loading before phase B picks up the barbell work.',
  'home-w4-d5-main':
    'Lower, sets up on goblet squat, single leg RDL, and split squats. Final foundation lower day — phase B introduces the barbell, so close strong.',

  // ───────── Week 5 — Barbell intro ─────────
  'home-w5-d1-main':
    'New phase. BB RDLs replace the dumbbell version, plus single leg squat for unilateral strength. Step ups and lunges with dumbbells round it out. Go conservative on the barbell — different stabiliser pattern than DB.',
  'home-w5-d2-main':
    "Abs + cardio rotation. Russian twist with legs up, lying leg raise, Otis up. Three moves for tighter, harder core work than phase A's higher-rep circuit.",
  'home-w5-d3-main':
    'Upper, new template. BB bent over row replaces DB single-arm row. Incline push ups, standing around the world, hammer curls, tricep dips. More compound, less isolation than phase A.',
  'home-w5-d4-main':
    'Abs + cardio. Weighted plank, side plank, weighted table top crunch. Add a plate or DB on the plank to load the brace — the weight is what makes plank progressive.',
  'home-w5-d5-main':
    'Lower, BB back squat opens. B stance RDL, calf raises, BB lateral lunge, Bulgarian split squats. Heaviest lower of the week — make sure you warm up the squat properly.',

  // ───────── Week 6 — Settle ─────────
  'home-w6-d1-main':
    'Glutes, reps up on BB RDL and single leg squat. The single leg squat is unforgiving — use a low box if needed and work up to no support.',
  'home-w6-d2-main':
    "Abs + cardio. Russian twist and lying leg raise to 10 reps. Otis up stays at 8 — it's harder than it looks.",
  'home-w6-d3-main':
    "Upper, incline push up and around the world to 8 reps, tricep dip to 10. The dip is the one to push — that's the lift carrying the most arm progression.",
  'home-w6-d4-main':
    'Abs + cardio. Plank duration to 70 seconds, side plank to 40. Weighted table top crunch holds at 2 sets — increases next week.',
  'home-w6-d5-main':
    "Lower, BB lateral lunge to 8 reps. The frontal-plane work is what builds the medius for hip stability — don't skip even though it's the least sexy lift of the week.",

  // ───────── Week 7 — Reps up ─────────
  'home-w7-d1-main':
    'Glutes, BB RDL to 10 reps. Single leg squat stays at 8 — load is more important than reps on that one. Step ups and lunges hold at week-six counts.',
  'home-w7-d2-main':
    "Abs + cardio, all moves at week-six reps. The russian twist with legs up should feel like it's actually hitting your obliques now.",
  'home-w7-d3-main':
    'Upper, BB row jumps to 10 reps. Hammer curl stays at 12 — those higher-rep biceps are about pump, not strength.',
  'home-w7-d4-main':
    'Abs + cardio. Plank at 80 seconds, side plank 50. Table top crunch jumps to 3 sets — final week before deload-style week 8.',
  'home-w7-d5-main':
    'Lower, B stance RDL to 10 reps, calf raise to 12, lateral lunge to 10. Bulgarian split squat stays at 10 — focus on equal reps per side.',

  // ───────── Week 8 — Final push ─────────
  'home-w8-d1-main':
    'Final glute day. Single leg squat to 10 reps, lunges to 12. Eight weeks of progressive load behind you — try to PR the BB RDL or single leg squat.',
  'home-w8-d2-main':
    "Final abs + cardio circuit one. Russian twist to 12 reps. Otis up is brutal — close with what you've got.",
  'home-w8-d3-main':
    "Last upper. Incline push up and around the world to 10 reps. Eight weeks ago this template was new — note today's loads for your next program.",
  'home-w8-d4-main':
    "Final abs + cardio. Plank at 90 seconds, side plank 60. End on a strong brace — that endurance carries into every other lift you'll do.",
  'home-w8-d5-main':
    "Final lower of the program. BB squat to 12 reps, Bulgarian split squat to 12. Take a progress photo this week if you haven't — and rest properly before whatever's next.",
};
