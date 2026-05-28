import type { BodyGraphMuscleData, MuscleTimeframe, WorkoutStats } from '@/services/api/recovery';

// =============================================
// TRAINING STATUS
// Science basis:
//   - 48-72h muscle recovery window (Zatsiorsky & Kraemer)
//   - Optimal frequency: 3-4 sessions/week (Schoenfeld, 2016)
//   - Deload every 4-6 weeks when volume is consistently high (Renaissance Periodization)
//   - Consistency > intensity for long-term adaptation
// =============================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Picks a variant for the day — consistent within a day, rotates daily.
// Pass an extra seed (e.g. workoutCount) to get different picks per situation.
function pick(options: string[], seed: number = 0): string {
  if (options.length === 0) return '';
  const day = new Date().getDate();
  return options[(day + seed) % options.length];
}

export function getTrainingStatus(
  data: BodyGraphMuscleData[],
  stats: WorkoutStats,
  timeframe: MuscleTimeframe
): string {
  const { workoutCount, daysSinceLastWorkout, avgSessionsPerWeek } = stats;
  const sorted = [...data].sort((a, b) => b.effectiveSets - a.effectiveSets);
  const overreached = sorted.filter((d) => d.intensityTier === 4);
  const maxTier = data.length > 0 ? Math.max(...data.map((d) => d.intensityTier)) : 0;

  const lowerGroups = ['glutes', 'legs', 'calves'];
  const pushGroups = ['chest', 'shoulders', 'triceps'];
  const pullGroups = ['back', 'biceps'];
  const top3 = sorted.slice(0, 3).map((d) => d.groupId);

  // Muscle context helpers
  const topMuscle = sorted[0] ? capitalize(sorted[0].groupId) : null;
  const top2Names = sorted
    .slice(0, 2)
    .map((d) => capitalize(d.groupId))
    .join(' and ');
  const trainedIds = new Set(data.map((d) => d.groupId));
  const allMainGroups = [
    'back',
    'chest',
    'legs',
    'glutes',
    'biceps',
    'triceps',
    'shoulders',
    'core',
    'calves',
  ];
  const untrainedGroups = allMainGroups.filter((g) => !trainedIds.has(g));
  const freshMuscle = untrainedGroups.length > 0 ? capitalize(untrainedGroups[0]) : null;

  // ── 24H ──────────────────────────────────────────────
  if (timeframe === 'today') {
    if (workoutCount === 0) {
      return pick([
        'Rest day. Your muscles are literally rebuilding right now. Growth happens during recovery, not just in the gym.',
        'Rest day. This is part of the process, not a skip. Your body is adapting from your last session.',
        'No workout today. Sleep and protein are doing the work right now. Come back tomorrow.',
      ]);
    }
    if (overreached.length > 0) {
      const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
      return pick(
        [
          `Your ${names} hit max recoverable volume today. Take a real rest day tomorrow. Pushing through overreached muscles is how injuries happen, not gains.`,
          `Your ${names} are cooked. Genuinely rest tomorrow. More training right now would set you back, not forward.`,
          `${names} overreached. Your nervous system needs a full day off. Protein, sleep, and water are your workout tomorrow.`,
        ],
        overreached.length
      );
    }
    if (maxTier >= 3) {
      return pick([
        `Heavy ${topMuscle ?? 'session'} day. Get some protein in within the next 2 hours and actually sleep tonight. That's when muscle repair happens.${freshMuscle ? ` ${freshMuscle} is fresh if you want to train tomorrow.` : ''}`,
        `${top2Names ? `${top2Names} took a beating today.` : 'Heavy session.'} Eat well, sleep 8 hours, and you'll feel the adaptation by tomorrow.`,
        `Heavy session done${topMuscle ? ` — ${topMuscle} was the focus` : ''}. Protein synthesis peaks in the next few hours so eat something. Your body will do the rest overnight.`,
      ]);
    }
    if (maxTier === 2) {
      return pick([
        `Solid ${topMuscle ? `${topMuscle} session` : 'session'}. Stay hydrated, eat well, and sleep. Your muscles will genuinely be ready to go again tomorrow.`,
        `Good work today${top2Names ? ` — ${top2Names} trained` : ''}. You're in the optimal training zone. Rest well and you'll recover fully by tomorrow.`,
        `Solid effort${topMuscle ? ` on ${topMuscle}` : ''}. Moderate volume is actually where most long-term progress comes from. Sleep well tonight.`,
      ]);
    }
    return pick([
      `Light session today${topMuscle ? ` — mostly ${topMuscle}` : ''}. Great for active recovery. Your body's ready to push harder tomorrow if you want.`,
      'Easy session today. Active recovery like this keeps blood flowing to your muscles without adding fatigue. Good call.',
      `Light work done${freshMuscle ? `. ${freshMuscle} is fully recovered if you want to go harder tomorrow` : '. Your body is recovered and ready'}.`,
    ]);
  }

  // ── 1W ───────────────────────────────────────────────
  if (timeframe === 'week') {
    if (workoutCount === 0) {
      return pick([
        'No training this week yet. Starting is genuinely the hardest part. Even one session this week builds the habit.',
        "Zero sessions so far this week. One workout changes your whole momentum. You've got time.",
        "No training yet this week. You don't need the perfect session, just any session.",
      ]);
    }
    if (workoutCount === 1) {
      const recency =
        daysSinceLastWorkout === 0
          ? 'today'
          : `${daysSinceLastWorkout} day${daysSinceLastWorkout === 1 ? '' : 's'} ago`;
      return pick(
        [
          `1 session this week (${recency}). You showed up, which matters. 3-4 sessions a week is where you actually start seeing changes.`,
          `1 session this week (${recency}). That's a start. Research shows 3-4 sessions a week is the sweet spot for real results.`,
          `1 session down this week (${recency}). Keep going. Frequency is the biggest driver of progress, not how hard any single session is.`,
        ],
        workoutCount
      );
    }
    if (workoutCount === 2) {
      return pick(
        [
          `2 sessions this week. You're on your way. One or two more puts you in the sweet spot where real progress happens (3-4 sessions/week).`,
          `2 sessions this week. Good momentum. One more and you're in the optimal range for hypertrophy and strength adaptation.`,
          `2 sessions in. You're building consistency, which matters more than intensity right now. Keep going.`,
        ],
        workoutCount
      );
    }

    if (workoutCount >= 3 && workoutCount <= 4) {
      const lowerCount = top3.filter((g) => lowerGroups.includes(g)).length;
      const pushCount = top3.filter((g) => pushGroups.includes(g)).length;
      const pullCount = top3.filter((g) => pullGroups.includes(g)).length;

      if (overreached.length > 0) {
        const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
        return pick(
          [
            `Good week overall, but your ${names} have accumulated a lot of volume. Go lighter on those next session. More isn't always more.`,
            `Solid frequency this week. Watch your ${names} though, they've taken a lot this week. Back off on those next time.`,
            `Good week. Your ${names} are getting close to their weekly limit. A lighter touch on those next session will keep you progressing.`,
          ],
          overreached.length
        );
      }
      if (pushCount >= 2 && pullCount === 0) {
        return pick(
          [
            `Good frequency this week, but it's been push-heavy. Your back and biceps are probably recovered and ready. Pull session next.`,
            `${workoutCount} sessions this week. Push muscles are doing a lot of work. Your back needs attention too or you'll develop imbalances over time.`,
            `Good week, but very push-focused. Balance it with a pull session. Your posture and shoulder health depend on it long-term.`,
          ],
          pushCount
        );
      }
      if (pullCount >= 2 && pushCount === 0) {
        return pick(
          [
            `Good frequency this week, but it's been pull-heavy. Your chest and shoulders need some love too. Keeps things balanced and protects your posture.`,
            `${workoutCount} sessions and it's been very pull-heavy. Your chest and triceps are probably well rested. Push session next.`,
            `Good week. Heavy on pulling movements though. Balance with some chest and shoulder work to keep your training symmetrical.`,
          ],
          pullCount
        );
      }
      if (lowerCount >= 2 && pushCount === 0 && pullCount === 0) {
        return pick(
          [
            `Strong lower body week. Your upper body is recovered and ready. An upper session will keep your training balanced.`,
            `Legs have been doing most of the work this week. Your upper body is fresh and ready. Mix it in.`,
            `Lower body heavy week. Great for leg development but your upper body needs frequency too for balanced results.`,
          ],
          lowerCount
        );
      }
      return pick(
        [
          `Solid week. ${workoutCount} sessions with good muscle balance. This is the frequency where the actual adaptations happen.`,
          `${workoutCount} well-balanced sessions this week. You're training at the right frequency for real progress. Keep this up.`,
          `Great week. ${workoutCount} sessions, solid balance across muscle groups. This is exactly what consistent progress looks like.`,
        ],
        workoutCount
      );
    }

    if (overreached.length > 0) {
      const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
      return pick(
        [
          `${workoutCount} sessions this week and your ${names} are overreached. Rest isn't optional here. It's literally part of the process.`,
          `${workoutCount} training days this week and ${names} are past their limit. Your body can't adapt without recovery time. Take a day off.`,
          `High frequency week (${workoutCount} sessions) and ${names} are showing it. A rest day now pays off more than session ${workoutCount + 1}.`,
        ],
        workoutCount
      );
    }
    return pick(
      [
        `${workoutCount} sessions this week is a lot. Make sure you're actually sleeping. Adaptation happens during recovery, not during training.`,
        `${workoutCount} training days this week. Impressive, but your body needs at least one full rest day to actually absorb the work.`,
        `${workoutCount} sessions is a high week. Sleep and nutrition are doing as much work as the gym right now. Don't skip the recovery side.`,
      ],
      workoutCount
    );
  }

  // ── 1M ───────────────────────────────────────────────
  if (timeframe === 'month') {
    if (workoutCount === 0) {
      return pick([
        'No training this month yet. Even 2-3 sessions a week produces real, noticeable changes within 4 weeks. It compounds fast.',
        'Fresh month, zero sessions. The best time to start was last month. Second best time is today.',
        'No sessions this month yet. 3 sessions a week for 4 weeks straight will genuinely change how you look and feel.',
      ]);
    }

    const recencyNote =
      daysSinceLastWorkout === 0
        ? 'last session was today'
        : daysSinceLastWorkout === 1
          ? 'last session was yesterday'
          : `last session was ${daysSinceLastWorkout} days ago`;

    const avgRounded = Math.round(avgSessionsPerWeek * 10) / 10;

    if (avgSessionsPerWeek < 2) {
      if (overreached.length > 0) {
        const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
        return pick(
          [
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Your ${names} went hard but one intense session doesn't replace consistency. 3 moderate sessions a week beats 1 brutal one every time.`,
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. ${names} fatigue will clear in a day or two. The bigger focus is building a consistent schedule.`,
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Going hard occasionally isn't the same as training consistently. Your ${names} will recover. Focus on frequency next month.`,
          ],
          workoutCount
        );
      }
      return pick(
        [
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}${topMuscle ? ` — mostly ${topMuscle}` : ''}. Consistency is the biggest factor here, more than intensity. Aim for 3 sessions a week and watch what happens.`,
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Frequency beats intensity for long-term results. 3 consistent sessions a week will change everything${freshMuscle ? ` — and your ${freshMuscle} hasn't been touched yet` : ''}.`,
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. You're capable of more. Even adding one extra session a week will make a noticeable difference.`,
        ],
        workoutCount
      );
    }

    if (avgSessionsPerWeek < 3) {
      if (overreached.length > 0) {
        const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
        return pick(
          [
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Your ${names} are heavily fatigued. Give them 48-72 hours before going hard on those again. You're building something real here.`,
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Solid base being built. Your ${names} need a couple of days though. Let them recover and come back stronger.`,
            `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. You're on the right track. Just let your ${names} recover fully before hitting them again. 48 hours minimum.`,
          ],
          workoutCount
        );
      }
      return pick(
        [
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. You're building a solid base. Push toward 3-4 sessions a week and you'll genuinely feel the difference.`,
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. Good foundation being laid. Nudge that frequency up slightly and the results will accelerate.`,
          `${workoutCount} sessions this month (${avgRounded}/week), ${recencyNote}. You're in the right zone. One more session per week would put you in the optimal range for real adaptation.`,
        ],
        workoutCount
      );
    }

    if (avgSessionsPerWeek <= 4) {
      if (overreached.length > 0) {
        const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
        return pick(
          [
            `Strong month. ${workoutCount} sessions (${avgRounded}/week), ${recencyNote}. Your ${names} are overreached though. A lighter week every 4-6 weeks isn't skipping. It literally makes you stronger by letting your body absorb the work.`,
            `Great month overall. ${workoutCount} sessions (${avgRounded}/week). Your ${names} have hit their limit for now. A planned deload week resets your nervous system and actually boosts progress.`,
            `Solid month. ${workoutCount} sessions (${avgRounded}/week). Watch your ${names}, they're overreached. Research shows deloading every 4-6 weeks improves long-term strength and prevents burnout.`,
          ],
          workoutCount
        );
      }
      const lowerCount = top3.filter((g) => lowerGroups.includes(g)).length;
      const pushCount = top3.filter((g) => pushGroups.includes(g)).length;
      const pullCount = top3.filter((g) => pullGroups.includes(g)).length;
      if (pushCount >= 2 && pullCount === 0) {
        return pick(
          [
            `Strong month. ${workoutCount} sessions (${avgRounded}/week). It's been push-heavy though. More pull work (back, biceps) will protect your shoulders and fix your posture long-term.`,
            `Good month. ${workoutCount} sessions (${avgRounded}/week). Push muscles are well trained. Your back and biceps need more attention to keep your body balanced and injury-free.`,
            `${workoutCount} sessions this month (${avgRounded}/week). Great push volume but your pulling muscles are undertrained. Imbalances like this affect posture and increase shoulder injury risk over time.`,
          ],
          pushCount
        );
      }
      if (pullCount >= 2 && pushCount === 0) {
        return pick(
          [
            `Strong month. ${workoutCount} sessions (${avgRounded}/week). Pull-heavy month. Balance with more chest and shoulder work. Your posture will actually thank you.`,
            `Good month. ${workoutCount} sessions (${avgRounded}/week). You've pulled a lot this month. Your chest and shoulders are fresh and could use more attention next month.`,
            `${workoutCount} sessions this month (${avgRounded}/week). Solid pulling base built. Add more push work to balance things out. Rounded training protects your joints long-term.`,
          ],
          pullCount
        );
      }
      return pick(
        [
          `Genuinely great month. ${workoutCount} sessions (${avgRounded}/week). You're in the optimal range and your body is adapting. Keep this up.`,
          `${workoutCount} sessions this month (${avgRounded}/week). This is what optimal training frequency looks like. Your body is getting a strong enough signal to adapt consistently.`,
          `Great month. ${workoutCount} sessions (${avgRounded}/week). You're training at the frequency where real, lasting changes happen. Stay consistent and results will keep coming.`,
        ],
        workoutCount
      );
    }

    if (overreached.length > 0) {
      const names = overreached.map((d) => capitalize(d.groupId)).join(' and ');
      return pick(
        [
          `High volume month. ${workoutCount} sessions (${avgRounded}/week). Your ${names} are overreached. A planned deload week actually boosts long-term progress. Your body needs time to absorb the work you've put in.`,
          `${workoutCount} sessions this month (${avgRounded}/week). That's a huge workload and your ${names} are showing it. A lighter week now will let your nervous system recover and come back stronger.`,
          `Very high volume month. ${workoutCount} sessions (${avgRounded}/week). Your ${names} are past their limit. Deloading isn't weakness, it's what advanced athletes do every 4-6 weeks on purpose.`,
        ],
        workoutCount
      );
    }
    return pick(
      [
        `Very high volume month. ${workoutCount} sessions (${avgRounded}/week). Make sure you have real rest days built in. If you've been at this pace for 4+ weeks, a lighter week will do more for you than another hard one.`,
        `${workoutCount} sessions this month (${avgRounded}/week). Incredibly consistent. Just make sure recovery is matching your output. Sleep, protein, and a planned lighter week every month keeps this sustainable.`,
        `High volume month. ${workoutCount} sessions (${avgRounded}/week). Impressive consistency. At this frequency, a deload week every 4-6 weeks is what separates long-term progress from burnout.`,
      ],
      workoutCount
    );
  }

  return pick([
    "Training data loaded. Check the muscle map above for a full breakdown of what you've worked.",
    'Your workout history is here. Use the timeframe tabs to see how your volume has built up over time.',
    'Workout data loaded. Tap through the timeframes above to see your training across different periods.',
  ]);
}
