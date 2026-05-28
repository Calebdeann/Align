// Hand-written descriptions for every workout in the Hourglass program.
// Keyed by ProgramWorkout.id. Tone matches the existing plan overview copy
// in src/data/plans.ts — casual, concrete, body-comp focused.
//
// Stages:
//  W1-2  : foundation, technique
//  W3-4  : load + sets
//  W5-6  : push, keep climbing
//  W7-8  : new exercise variations
//  W9-10 : rep then weight cycling
//  W11-12: peak, compound the gains

export const HOURGLASS_DESCRIPTIONS: Record<string, string> = {
  // ───────── Week 1 — Foundation ─────────
  'hourglass-w1-d1-main':
    "Welcome to week one. Hip thrusts and Bulgarian splits open the program because they're the two lifts that build the glute shelf the hourglass shape is built on. Keep weights honest, dial in form first.",
  'hourglass-w1-d1-abs':
    "Two to four ab exercises of your choice. Pick what you actually enjoy so you'll come back to it. The point this week is consistency, not crushing yourself.",
  'hourglass-w1-d2-main':
    'Upper day one. Lat pulldowns and shoulder presses set the foundation for the widening that makes the waist read narrower. Take it 7/10 effort and focus on full range.',
  'hourglass-w1-d2-cardio':
    'Easy 30 minutes — walk, stairs, or bike. Aerobic base work that supports recovery between the heavier lifting days. Conversational pace.',
  'hourglass-w1-d3-main':
    "Second lower of the week, hamstring-led. RDLs first while you're fresh, then step-ups and reverse lunges to hit the glutes from a different angle than Monday.",
  'hourglass-w1-d3-abs':
    "Cable crunch and hanging knee raise focus this round. Slow eccentrics — don't fling the weight back, control it.",
  'hourglass-w1-d4-main':
    'Full body integration day. Hip thrusts again because we want them touched three days a week, then abductors for medius growth, plus pull and press work to round it out.',
  'hourglass-w1-d4-cardio':
    'Wrap the week with 30 easy minutes. This is the day to walk outside if you can — your nervous system needs the low-stress aerobic work after four training days.',

  // ───────── Week 2 — Foundation ─────────
  'hourglass-w2-d1-main':
    "Same lifts as last Monday — that's the point. Try to add a rep on each set before you add weight. Movement quality should already feel tighter than week one.",
  'hourglass-w2-d1-abs':
    'Pick your two to four favourites again. Logging the same ones is fine — variation matters less than progressive load on the core.',
  'hourglass-w2-d2-main':
    'Push for an extra rep on lat pulldowns and bicep curls today. Shoulders stay at 10 — locking that form in for week three when weights start climbing.',
  'hourglass-w2-d2-cardio':
    'Thirty minutes of low-intensity cardio. Pace yourself so you could still hold a phone call.',
  'hourglass-w2-d3-main':
    "Repeat Thursday's lower flow. The reps should feel a touch easier this week — if they don't, take a rest day next time and come back fresh.",
  'hourglass-w2-d3-abs':
    'Cable crunch and hanging knee raises again. Try one extra rep on the hanging variation if your grip allows.',
  'hourglass-w2-d4-main':
    'Closing out the foundation block. Same six exercises as last Friday — try to nudge the B-stance RDL and the close grip lat pulldown to 10 reps clean.',
  'hourglass-w2-d4-cardio':
    'Final easy cardio of the foundation phase. Next week weights start moving up — protect this recovery session.',

  // ───────── Week 3 — Load up ─────────
  'hourglass-w3-d1-main':
    'Loading phase opens. Reps drop to 8 on hip thrusts, 6 on Bulgarian splits — that means weights climb. Pick something that has you putting the bar down with 2 reps in the tank.',
  'hourglass-w3-d1-abs':
    "Two to four ab moves of your choice. Lower-rep lifting days are when core stability matters most — don't skip these.",
  'hourglass-w3-d1-cardio':
    "Cardio gets added to the lower days from this week on. Thirty easy minutes after the lift — walk it out, don't sprint.",
  'hourglass-w3-d2-main':
    'Upper day with a uniform 10 reps across everything. Treat it as a strength accumulation day — no cardio attached, focus all your energy on heavier sets.',
  'hourglass-w3-d3-main':
    'Hamstring lower with weights creeping up. Eight reps on RDLs, ten on the rest. Add 2.5–5kg on each lift from week two if last week felt comfortable.',
  'hourglass-w3-d3-abs':
    "Cable crunch, hanging knee raises. By now your core should be holding bracing through the heavier squats and lunges — abs aren't separate, they're stabilising everything.",
  'hourglass-w3-d4-main':
    "Full body with a heavier hip thrust opener. Hip abductors stay at 12 — keep them high rep, that's where the medius growth comes from.",
  'hourglass-w3-d4-cardio':
    'Half-hour walk to close week three. The shift to heavier lifting can spike soreness; aerobic flush helps it pass quicker.',

  // ───────── Week 4 — Add sets ─────────
  'hourglass-w4-d1-main':
    'Now we add volume. Hip thrusts go to 4 sets, cable kickbacks to 4 sets — same weights as last week if you nailed them, otherwise hold steady and earn the extra set.',
  'hourglass-w4-d1-abs':
    'Your core is taking more total load this week with the extra sets. Pick your favourites and stop one rep short of failure on each set — quality over grind.',
  'hourglass-w4-d1-cardio':
    'Thirty easy minutes after the lift. Walking is best on this one — your legs are about to be wrecked from the extra hip thrust set.',
  'hourglass-w4-d2-main':
    'Upper gets the volume bump too. Four sets on shoulder press and bicep curls — these are the two lifts most responsible for the shoulder-to-waist taper.',
  'hourglass-w4-d3-main':
    'Same lower flow as week three, no set bump here. Use this day to focus on rep quality and bar speed — push the concentric, control the lowering.',
  'hourglass-w4-d3-abs':
    'Cable crunch and hanging knee raise focus. Try slowing the negative on the cable crunch to a 3-second count — feel the rectus burn.',
  'hourglass-w4-d4-main':
    'Full body with set bumps on hip thrusts, abductors, and single-arm dumbbell row. The row is the surprise hourglass move — wider mid back, narrower waist illusion.',
  'hourglass-w4-d4-cardio':
    "Recovery cardio. End of a high-volume week — be deliberate about the easy pace. If you're tempted to push, save it for week five.",

  // ───────── Week 5 — Keep climbing ─────────
  'hourglass-w5-d1-main':
    "Halfway point. Weights should be visibly heavier than week one — if not, that's the focus this week. Same volume as last week, push the load.",
  'hourglass-w5-d1-abs':
    "Five weeks in and your bracing should be automatic. Pick four ab exercises and treat them like a circuit if you're short on time.",
  'hourglass-w5-d1-cardio':
    'Thirty minutes, low intensity. If walking is starting to feel too easy, swap one session a week for stairs or bike — keep it under 75% effort.',
  'hourglass-w5-d2-main':
    "Upper progress check. Lateral raises and face pulls should be feeling smoother — that's the rear delt and rotator cuff catching up to the press work.",
  'hourglass-w5-d2-cardio':
    'Cardio gets added to the upper day from this week on. Thirty steady minutes — pair it with the lighter session of your week.',
  'hourglass-w5-d3-main':
    "Hamstring focus, push the RDL. By now you should be feeling the posterior chain wake up halfway through warm-up — that's a good sign your nervous system is dialled in.",
  'hourglass-w5-d3-abs':
    "Cable crunch / hanging knee raise. The waist work pays off across the whole program — don't skip these even when the lifting day runs long.",
  'hourglass-w5-d4-main':
    'Full body, same sets as week four. Bar speed is the metric this week — if every rep feels grinding, drop weight 5% and rebuild. We want crisp reps, not survival reps.',
  'hourglass-w5-d4-cardio':
    'Close the week with easy aerobic. Take a route you actually enjoy — recovery is also mental, not just physical.',

  // ───────── Week 6 — Keep climbing ─────────
  'hourglass-w6-d1-main':
    'Last week of the same exercise template before things change. Push hard — this is your PR opportunity on hip thrust before we rotate movements next week.',
  'hourglass-w6-d1-abs':
    'Your favourites. Six weeks in you should know which ab moves actually light you up — bias toward those today.',
  'hourglass-w6-d1-cardio':
    'Steady-state cardio. Six weeks of building base — your resting heart rate may have already dropped a few beats.',
  'hourglass-w6-d2-main':
    'Upper PR opportunity day. Lat pulldowns, shoulder press, seated row — these have been with you for six weeks. Try for one rep PR on each.',
  'hourglass-w6-d2-cardio': "Half an hour easy. Bank the recovery for tomorrow's heavier session.",
  'hourglass-w6-d3-main':
    "DB RDLs this week instead of barbell — same movement, slightly different stabiliser demand. Your grip will give out before your hamstrings; that's normal.",
  'hourglass-w6-d3-abs':
    'Cable crunch and hanging knee raises. Final week on this exact pairing before we open up exercise variety next phase.',
  'hourglass-w6-d4-main':
    'Closing the second block. Same six lifts, same volume — focus on PRing weight on hip thrust and B-stance RDL since those moved the most over the block.',
  'hourglass-w6-d4-cardio':
    'Aerobic flush. Big change coming next week — exercises rotate, so leave this session in the recovery zone.',

  // ───────── Week 7 — New exercises ─────────
  'hourglass-w7-d1-main':
    'Exercise rotation week. Good mornings replace one of the squat patterns, deficit reverse lunges drop in. New stimulus = new growth. Go lighter to learn the movements first.',
  'hourglass-w7-d1-abs':
    'Two to four of your favourites — same as before. The novelty this block is in the lifting, not the abs.',
  'hourglass-w7-d1-cardio':
    "Easy 30. New exercises will spike soreness — keep the cardio low so it doesn't compound recovery debt.",
  'hourglass-w7-d2-main':
    'Brand new upper template — machine-heavy this block to dial in the mind-muscle connection. Single arm rows and reverse flies are the new shoulder-width drivers.',
  'hourglass-w7-d2-cardio':
    'Steady-state. Pair it with the upper day since this one is lower fatigue than the lower days.',
  'hourglass-w7-d3-main':
    'Leg press leads today — pure quad and glute volume with the back supported. Step-ups with dumbbells, walking lunges, leg extensions. Different angles, same goal.',
  'hourglass-w7-d3-abs':
    'Cable crunch / hanging knee raise focus. Stick with the format you know while everything else is new.',
  'hourglass-w7-d3-cardio':
    "Cardio gets added to Thursday lower from now on. Half an hour, low intensity. If you're sore from Tuesday, walk it out.",
  'hourglass-w7-d4-main':
    "Full body with barbell deadlift or RDL — the heaviest pull of the week. Assisted pull ups too if you're working toward unassisted. Arnold press caps it.",
  'hourglass-w7-d4-cardio':
    'Easy aerobic to close. First week of new exercises means soreness — give the legs the gift of an easy walk.',

  // ───────── Week 8 — New exercises (repeat) ─────────
  'hourglass-w8-d1-main':
    'Week two on the new template. The movements should feel less foreign — load them up a bit if so. Good mornings still need conservative weight, that hip hinge is unforgiving.',
  'hourglass-w8-d1-abs':
    "Favourites again. Bias toward whatever survived last week's soreness — your body votes for what works.",
  'hourglass-w8-d1-cardio':
    'Thirty minutes steady. Cardio is the unsexy part of body composition — but the people who stick with it see the leaner outcomes.',
  'hourglass-w8-d2-main':
    'Same upper as last week — push the loads on rows and lateral raise machine. The fixed-path movements let you go heavier safely.',
  'hourglass-w8-d2-cardio':
    'Easy half-hour. Aerobic base is compounding now — you may notice you can hold a higher pace at the same effort.',
  'hourglass-w8-d3-main':
    'Leg press + step up + walking lunge. Quads are the stars today; glutes are along for the ride. Walking lunges done as long-stride for more glute, short-stride for more quad.',
  'hourglass-w8-d3-abs':
    'Cable crunch + hanging knee raise. Second week with this combo this block — try to push hanging knee raise to a strict pause at the top.',
  'hourglass-w8-d3-cardio':
    'Easy walk or bike. The lower days have the heaviest fatigue load — keep cardio sub-threshold here.',
  'hourglass-w8-d4-main':
    "Full body. Deadlift or RDL — pick the one that's been more progressive for you. Assisted pull ups: try one notch less assistance than week seven.",
  'hourglass-w8-d4-cardio':
    "Aerobic flush before the rep cycle in week nine. Take a route you haven't walked in a while.",

  // ───────── Week 9 — Up reps ─────────
  'hourglass-w9-d1-main':
    "Reps go up: hip thrusts to 10, good mornings to 10, kickbacks to 12. Same exercises, more reps per set. Use the same weight as last week if you can — that's a 25% volume jump.",
  'hourglass-w9-d1-abs':
    'Higher rep lifting day pairs nicely with lower rep, slower ab work. Pick two or three moves and slow the negatives.',
  'hourglass-w9-d1-cardio':
    'Half-hour easy. Volume is up across the board this week — keep cardio conservative.',
  'hourglass-w9-d2-main':
    'Upper, higher reps. Single arm rows to 12, reverse flies to 12, the rest stay at 10. The 12s drive the metabolic burn that gives the muscle that fuller look.',
  'hourglass-w9-d2-cardio':
    'Steady-state. Keep the watch off the heart rate display — this is intuitive easy pace.',
  'hourglass-w9-d3-main':
    'Leg press to 10, step ups and walking lunges to 10, extensions and kickbacks to 12. Pump-focused — chase the burn, not the absolute weight.',
  'hourglass-w9-d3-abs':
    'Cable crunch + hanging knee raise. Hold a peak contraction for a beat on the cable — that pause is where the abs actually feel it.',
  'hourglass-w9-d3-cardio':
    'Thirty easy. Pair the higher-rep lower day with very gentle cardio — your legs will thank you.',
  'hourglass-w9-d4-main':
    "Full body with the deadlift or RDL to 12 reps. That's a long set — break it up mentally into three groups of four so it doesn't psych you out.",
  'hourglass-w9-d4-cardio':
    'Recovery aerobic. End of the high-volume rep week — earn rest day with an easy session.',

  // ───────── Week 10 — Up weights ─────────
  'hourglass-w10-d1-main':
    'Weights climb again, reps stay where week nine left them. Hip thrusts and good mornings stay at 10; the goal is to do them with more load than seven days ago.',
  'hourglass-w10-d1-abs':
    "Your favourites — by week 10 you've probably built a go-to routine. Run it. Don't overthink it.",
  'hourglass-w10-d1-cardio':
    'Easy 30 minutes. Heavier loads = more nervous system fatigue. Cardio stays gentle to protect the recovery.',
  'hourglass-w10-d2-main':
    'Upper, weights up. Single arm rows drop back to 8 reps because the load is climbing — same with the press accessories at 10. Treat it as a strength day inside a hypertrophy block.',
  'hourglass-w10-d2-cardio':
    'Easy half-hour. Bank the recovery for the heavier lower day tomorrow.',
  'hourglass-w10-d3-main':
    'Leg press at 8 reps, step ups and lunges at 10, extensions and kickbacks at 12. Pyramid-feel session — heavy compound first, isolation pump finisher.',
  'hourglass-w10-d3-abs':
    "Cable crunch + hanging knee raise. The bracing you've built across 10 weeks is helping every other lift — these aren't just for show.",
  'hourglass-w10-d3-cardio':
    'Thirty easy. Two weeks left — the program is now about peaking your weights, so cardio stays in the recovery role.',
  'hourglass-w10-d4-main':
    'Full body, weights up across the board. Hip thrusts at 10 should be a meaningful number now — same with the deadlift or RDL. Arnold press drops to 8 for the load.',
  'hourglass-w10-d4-cardio':
    "Easy aerobic. Two more weeks of pushing weight — protect this recovery like it's the most important session of the week.",

  // ───────── Week 11 — Compound the gains ─────────
  'hourglass-w11-d1-main':
    "Same template as week 10. Try to match or beat last week's numbers — that's the whole point of the repeat. If you matched, you're maintaining; if you beat, you're growing.",
  'hourglass-w11-d1-abs':
    'Favourites round. Your last ab session of the week is about consistency, not novelty.',
  'hourglass-w11-d1-cardio':
    "Easy 30. Stay disciplined — the final two weeks aren't where you spike training stress; they're where you peak.",
  'hourglass-w11-d2-main':
    "Repeat last week's upper. PR opportunity on single arm rows or cable bicep curls — those have built the most over the block.",
  'hourglass-w11-d2-cardio':
    "Steady-state. The aerobic base you've built means today's pace probably feels easier than week one's did.",
  'hourglass-w11-d3-main':
    "Leg press and accessories. Week 11 of consistent training — you've earned the right to push the leg press load. Drive through the heels, control the eccentric.",
  'hourglass-w11-d3-abs':
    'Cable crunch + hanging knee raise. Final two sessions with this pairing — make them count.',
  'hourglass-w11-d3-cardio': 'Half-hour easy. Save the intensity for the lifting platform.',
  'hourglass-w11-d4-main':
    "Full body, second-to-last Friday session. Same six lifts you've done for five weeks now — your form should look the cleanest it has all program.",
  'hourglass-w11-d4-cardio': 'Easy aerobic to close the second-last week. One more week to go.',

  // ───────── Week 12 — Final push ─────────
  'hourglass-w12-d1-main':
    'Final Monday lower. Same exercises, same target reps as week 11 — try to push one more rep or 2.5kg on hip thrusts and good mornings. End-of-program PR opportunity.',
  'hourglass-w12-d1-abs':
    'Final ab session of week one. Whatever moves got you to week 12 — those are your moves. Run them with intent.',
  'hourglass-w12-d1-cardio':
    'Last Monday cardio. Keep it easy — twelve weeks of compounded base work means this session is way more productive than the same walk in week one.',
  'hourglass-w12-d2-main':
    "Last upper session. Match or beat your week 11 numbers and you've closed the program on a high. Single arm rows are the lift to chase — biggest carryover for the hourglass look.",
  'hourglass-w12-d2-cardio':
    "Easy steady-state. The aerobic base you've built will carry forward whether you re-run this program or move to another.",
  'hourglass-w12-d3-main':
    "Final hamstring/quad day. Twelve weeks ago your leg press was a different number — note today's so you can compare. Step ups and walking lunges, full range.",
  'hourglass-w12-d3-abs':
    'Closing ab session of the cable crunch / hanging knee raise pairing. Twelve weeks of these — that midsection bracing is now baked in.',
  'hourglass-w12-d3-cardio': 'Half-hour easy. Two sessions to go.',
  'hourglass-w12-d4-main':
    "Final lifting session of the Hourglass program. Hip thrust, deadlift or RDL, pulls, presses — all the big rocks. Take a progress photo this week if you haven't been.",
  'hourglass-w12-d4-cardio':
    "Final cardio. Twelve weeks of consistency — that's the whole game. Easy pace, take in the win.",
};
