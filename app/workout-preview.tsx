import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/theme';
import { useWorkoutStore, getScheduledWorkoutDisplayName } from '@/stores/workoutStore';
import { useTemplateStore, getTemplateTotalSets } from '@/stores/templateStore';
import { getCurrentUser } from '@/services/api/user';
import { ExerciseImage } from '@/components/ExerciseImage';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import CircleBackButton from '@/components/ui/CircleBackButton';
import { getProgramWorkout, WORKOUT_TYPE_COLORS, type ProgramWorkout } from '@/data/programs';
import { getPlanRectangleImage } from '@/data/programs/planImages';
import {
  resolveProgramExercises,
  programExerciseToTemplateExercise,
  type ResolvedProgramExercise,
} from '@/data/programs/exerciseMatching';
import { useExerciseStore } from '@/stores/exerciseStore';
import { WORKOUT_PREVIEW_LOREM } from '@/data/plans';
import { CARDIO_OPTIONS, parseRecommendedMinutes } from '@/constants/cardioOptions';

const MAX_CARDIO_SELECTIONS = 2;

// Per-option Ionicons used in the cardio row thumbnail. Keeps the cardio list
// visually consistent with the exercise rows above it.
const CARDIO_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'treadmill-run': 'walk',
  'incline-walk': 'trending-up',
  bike: 'bicycle',
  stairmaster: 'footsteps',
  rower: 'boat',
  elliptical: 'fitness',
  'outdoor-run': 'walk',
  'outdoor-walk': 'walk',
};

// Soft pastel backgrounds for each cardio icon tile — gives the list a
// playful, varied feel instead of a single workout-type color.
const CARDIO_ICON_COLORS: Record<string, string> = {
  'treadmill-run': '#FFD1DC',
  'incline-walk': '#C8F0D2',
  bike: '#CFE8FF',
  stairmaster: '#E2D4F7',
  rower: '#FFE0B5',
  elliptical: '#FFF3B0',
  'outdoor-run': '#FFC4B8',
  'outdoor-walk': '#D9EAD3',
};

// Mirrors SUPERSET_COLORS in app/active-workout.tsx — same indices, same colors,
// so the badge in the preview matches what users see during the workout.
const SUPERSET_COLORS = ['#FFB6C1', '#C8B6FF', '#B6E0FF', '#B6FFD9', '#FFE08A', '#FFA585'];
function getSupersetColor(supersetId: number): string {
  return SUPERSET_COLORS[(supersetId - 1) % SUPERSET_COLORS.length];
}

export default function WorkoutPreviewScreen() {
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const dateKey = params.dateKey as string;
  // `programWorkoutId` is passed when this screen is opened from a plan
  // template card (start-workout-sheet's "Templates" folder). No scheduled
  // workout backs it — render purely from program data.
  const programWorkoutIdParam = params.programWorkoutId as string | undefined;
  // `source=template` flips the bottom action from "Start Workout" to
  // "Schedule Workout" — templates can only be scheduled, not started.
  const isTemplateMode = params.source === 'template';
  const { t } = useTranslation();

  const { withLock } = useNavigationLock();
  const [userId, setUserId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedProgramExercise[]>([]);
  // Cardio workout state: which cardio options the user has selected before
  // starting. Only relevant when programWorkout.type === 'cardio'.
  const [selectedCardio, setSelectedCardio] = useState<string[]>([]);

  const scheduledWorkouts = useWorkoutStore((s) => s.scheduledWorkouts);
  const startWorkoutFromTemplate = useWorkoutStore((s) => s.startWorkoutFromTemplate);
  const startActiveWorkout = useWorkoutStore((s) => s.startActiveWorkout);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);
  const removeWorkoutOccurrence = useWorkoutStore((s) => s.removeWorkoutOccurrence);
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout);
  const getTemplateById = useTemplateStore((s) => s.getTemplateById);
  const allExercises = useExerciseStore((s) => s.allExercises);
  const loadExercises = useExerciseStore((s) => s.loadExercises);

  useEffect(() => {
    getCurrentUser()
      .then((u) => u && setUserId(u.id))
      .catch(() => {});
  }, []);

  // Lazily load the exercise DB if it hasn't been loaded yet — plan workouts
  // need it to resolve thumbnail / id / instructions for each exercise.
  useEffect(() => {
    if (!allExercises.length) {
      loadExercises().catch(() => {});
    }
  }, [allExercises.length, loadExercises]);

  const workout = useMemo(() => {
    const cleanId = workoutId?.replace('scheduled_', '');
    return scheduledWorkouts.find((w) => w.id === cleanId || w.id === workoutId);
  }, [scheduledWorkouts, workoutId]);

  // Program workout resolved either from the scheduled workout's link OR
  // directly from the `programWorkoutId` URL param (template mode).
  const programWorkout = useMemo<ProgramWorkout | null>(() => {
    const pwId = workout?.programWorkoutId ?? programWorkoutIdParam ?? null;
    if (!pwId) return null;
    return getProgramWorkout(pwId);
  }, [workout, programWorkoutIdParam]);

  const template = useMemo(() => {
    if (!workout?.templateId) return null;
    return getTemplateById(workout.templateId);
  }, [workout, getTemplateById]);

  // Resolve plan-workout exercises to real DB rows once the exercise store is loaded.
  useEffect(() => {
    if (!programWorkout || programWorkout.exercises.length === 0) {
      setResolved([]);
      return;
    }
    if (!allExercises.length) return;
    const names = programWorkout.exercises.map((e) => e.name);
    setResolved(resolveProgramExercises(names));
  }, [programWorkout, allExercises]);

  // Resolve title, description, exercises, duration, hero color
  const display = useMemo(() => {
    if (programWorkout) {
      const pwIdForImage = workout?.programWorkoutId ?? programWorkoutIdParam ?? null;
      const heroImage = pwIdForImage ? getPlanRectangleImage(pwIdForImage) : null;
      return {
        title: programWorkout.title,
        description: programWorkout.description ?? WORKOUT_PREVIEW_LOREM,
        heroColor: WORKOUT_TYPE_COLORS[programWorkout.type] ?? '#E5E5E5',
        heroImage,
        exercises: programWorkout.exercises.map((pe, idx) => {
          const r = resolved[idx];
          return {
            name: pe.name,
            sub: `${pe.sets} x ${pe.reps}`,
            gifUrl: r?.gifUrl,
            thumbnailUrl: r?.thumbnailUrl,
            exerciseId: r?.exerciseId ?? undefined,
            supersetGroup: pe.supersetGroup,
          };
        }),
        freeText: programWorkout.freeText,
        hasExercises: programWorkout.exercises.length > 0,
      };
    }
    if (template) {
      return {
        title: workout?.name ?? template.name,
        description: workout?.description ?? template.description ?? '',
        heroColor: workout?.tagColor ?? template.tagColor ?? '#E5E5E5',
        heroImage: null,
        exercises: template.exercises.map((ex) => ({
          name: ex.exerciseName,
          sub: `${ex.sets.length} sets`,
          gifUrl: ex.gifUrl,
          thumbnailUrl: ex.thumbnailUrl,
          exerciseId: ex.exerciseId,
          supersetGroup: ex.supersetId ?? undefined,
        })),
        freeText: undefined,
        hasExercises: true,
      };
    }
    // Fallback for scheduled workouts where neither program data nor a
    // template resolved — still try the programWorkoutId for an image so a
    // tagged cardio day doesn't render an empty colored block.
    const fallbackHero = workout?.programWorkoutId
      ? getPlanRectangleImage(workout.programWorkoutId)
      : null;
    return {
      title: workout?.name ?? '',
      description: workout?.description ?? '',
      heroColor: workout?.tagColor ?? '#E5E5E5',
      heroImage: fallbackHero,
      exercises: [] as { name: string; sub: string }[],
      freeText: undefined,
      hasExercises: false,
    };
  }, [programWorkout, template, workout, resolved]);

  const handleDeleteWorkout = () => {
    if (!workout) return;
    const isRecurring = workout.repeat.type !== 'never';
    if (isRecurring) {
      Alert.alert(t('workoutPreview.deleteWorkout'), t('workoutPreview.deleteRecurringMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('workoutPreview.justThisOne'),
          onPress: () => {
            removeWorkoutOccurrence(workout.id, dateKey);
            router.back();
          },
        },
        {
          text: t('workoutPreview.allFutureWorkouts'),
          style: 'destructive',
          onPress: () => {
            const d = new Date(dateKey);
            d.setDate(d.getDate() - 1);
            const endDateKey = d.toISOString().split('T')[0];
            updateWorkout(workout.id, { endDate: endDateKey });
            router.back();
          },
        },
      ]);
    } else {
      Alert.alert(
        t('workoutPreview.deleteWorkout'),
        t('workoutPreview.deleteConfirm', { name: getScheduledWorkoutDisplayName(workout) }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
              removeWorkout(workout.id);
              router.back();
            },
          },
        ]
      );
    }
  };

  // A workout is "cardio" if either the program data says so, or the scheduled
  // row was seeded with tagId='cardio' (programWorkout resolution sometimes
  // returns null when local state drifts from the current program data — that
  // shouldn't block the picker because the user-facing intent is unambiguous).
  const isCardioWorkout = programWorkout?.type === 'cardio' || workout?.tagId === 'cardio';
  const recommendedCardioMinutes = isCardioWorkout
    ? parseRecommendedMinutes(programWorkout?.freeText)
    : null;

  function toggleCardioOption(optionId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedCardio((prev) => {
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      if (prev.length >= MAX_CARDIO_SELECTIONS) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      return [...prev, optionId];
    });
  }

  const handleStartWorkout = () => {
    if (!workout) return;
    withLock(() => {
      // Cardio: each picker option maps to a real DB exercise row, so the
      // workout uses that row's id directly (animations + detail view work).
      if (isCardioWorkout && selectedCardio.length > 0) {
        const cardioExercises = selectedCardio
          .map((optId) => CARDIO_OPTIONS.find((o) => o.id === optId))
          .filter((o): o is NonNullable<typeof o> => !!o)
          .map((opt) => {
            const dbExercise = allExercises.find((e) => e.id === opt.id);
            return {
              exerciseId: opt.id,
              exerciseName: dbExercise?.display_name ?? opt.name,
              muscle: 'cardio',
              gifUrl: dbExercise?.image_url ?? undefined,
              thumbnailUrl: dbExercise?.thumbnail_url ?? undefined,
              sets: [
                {
                  targetDifficulty: opt.defaultDifficulty,
                  targetDurationMinutes: recommendedCardioMinutes ?? undefined,
                },
              ],
              restTimerSeconds: 0,
            };
          });
        // programWorkout may be null when isCardioWorkout fired off tagId
        // alone; in that case use the scheduled workout's own id/name.
        startWorkoutFromTemplate(
          programWorkout?.id ?? workout.id,
          programWorkout?.title ?? workout.name ?? 'Cardio',
          cardioExercises,
          userId,
          workout.id
        );
      } else if (programWorkout && display.hasExercises) {
        startWorkoutFromTemplate(
          programWorkout.id,
          programWorkout.title,
          programWorkout.exercises.map((pe, idx) =>
            programExerciseToTemplateExercise(pe, resolved[idx])
          ),
          userId,
          workout.id
        );
      } else if (template) {
        startWorkoutFromTemplate(
          template.id,
          template.name,
          template.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscle: ex.muscle,
            gifUrl: ex.gifUrl,
            thumbnailUrl: ex.thumbnailUrl,
            notes: ex.notes,
            sets: ex.sets.map((s) => ({
              targetWeight: s.targetWeight,
              targetReps: s.targetReps,
            })),
            restTimerSeconds: ex.restTimerSeconds,
          })),
          userId,
          workout.id
        );
      } else {
        startActiveWorkout(userId, workout.id);
      }
      router.push('/active-workout');
    });
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Share', 'Sharing is coming soon.');
  };

  // In template mode there's no scheduled workout to look up — render from
  // programWorkout alone. The "not found" guard only applies when we expected
  // a scheduled workout and didn't find one.
  if (!workout && !programWorkout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <CircleBackButton />
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('workoutPreview.workoutNotFound')}</Text>
          <Text style={styles.emptySubtext}>{t('workoutPreview.workoutNotFoundSubtext')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <View style={styles.headerRight}>
          <Pressable style={styles.circleIconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroRow}>
          <View style={[styles.heroImage, { backgroundColor: display.heroColor }]}>
            {display.heroImage && (
              <Image
                source={display.heroImage}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            )}
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{display.title}</Text>
            {display.description ? (
              <Text style={styles.heroDescription} numberOfLines={5}>
                {display.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action pill — "Schedule Workout" in template mode, "Start Workout"
            for live previews. Cardio pickers still gate the Start variant
            until at least one option is selected. */}
        <Pressable
          style={[
            styles.startPill,
            !isTemplateMode &&
              isCardioWorkout &&
              selectedCardio.length === 0 &&
              styles.startPillDisabled,
          ]}
          disabled={!isTemplateMode && isCardioWorkout && selectedCardio.length === 0}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (isTemplateMode) {
              const pwId = programWorkoutIdParam ?? workout?.programWorkoutId ?? null;
              if (!pwId) return;
              withLock(() =>
                router.push({
                  pathname: '/schedule-workout',
                  params: { programWorkoutId: pwId },
                })
              );
              return;
            }
            const todayKey = new Date().toISOString().split('T')[0];
            if (dateKey && dateKey !== todayKey) {
              const workoutDate = new Date(dateKey + 'T12:00:00');
              const formatted = workoutDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
              });
              const isPast = dateKey < todayKey;
              Alert.alert(
                isPast ? 'Past Workout' : 'Future Workout',
                isPast
                  ? `This workout was scheduled for ${formatted}. Starting it now will log it for today.`
                  : `This workout is scheduled for ${formatted}. Starting it early will log it for today.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Start Anyway', onPress: handleStartWorkout },
                ]
              );
              return;
            }
            handleStartWorkout();
          }}
        >
          <Text style={styles.startPillText}>
            {isTemplateMode ? 'Schedule Workout' : 'Start Workout'}
          </Text>
        </Pressable>

        {/* Exercise list (or cardio picker for cardio sub-workouts, or
            free-text instructions for any remaining freeText workouts) */}
        <View style={styles.listCard}>
          <View style={styles.listHandle} />
          {isCardioWorkout ? (
            <>
              <Text style={styles.cardioHint}>
                {recommendedCardioMinutes
                  ? `Plan suggests: ${recommendedCardioMinutes} min  ·  Pick 1 or 2`
                  : 'Pick 1 or 2'}
              </Text>
              {CARDIO_OPTIONS.map((opt, i) => {
                const isSelected = selectedCardio.includes(opt.id);
                // At-max: dim unselected rows so users see they're locked out.
                // Selected rows stay full-opacity (still tappable to deselect).
                const atMax = selectedCardio.length >= MAX_CARDIO_SELECTIONS;
                const isLocked = atMax && !isSelected;
                const last = i === CARDIO_OPTIONS.length - 1;
                return (
                  <View key={opt.id}>
                    <Pressable
                      style={[styles.exRow, isLocked && styles.cardioRowLocked]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        toggleCardioOption(opt.id);
                      }}
                    >
                      <View
                        style={[
                          styles.exThumb,
                          styles.cardioIconBox,
                          { backgroundColor: CARDIO_ICON_COLORS[opt.slug] ?? display.heroColor },
                        ]}
                      >
                        <Ionicons
                          name={CARDIO_ICONS[opt.slug] ?? 'fitness'}
                          size={26}
                          color="#000"
                        />
                      </View>
                      <View style={styles.exInfo}>
                        <Text style={styles.exName}>{opt.name}</Text>
                      </View>
                      <View
                        style={[
                          styles.cardioCheckCircle,
                          isSelected && styles.cardioCheckCircleSelected,
                          isLocked && styles.cardioCheckCircleLocked,
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                    {!last && <View style={styles.exDivider} />}
                  </View>
                );
              })}
            </>
          ) : display.freeText && !display.hasExercises ? (
            <View style={styles.freeTextBlock}>
              <Text style={styles.freeTextLabel}>WHAT TO DO</Text>
              <Text style={styles.freeTextContent}>{display.freeText}</Text>
            </View>
          ) : display.exercises.length === 0 ? (
            <View style={styles.placeholderBlock}>
              <Text style={styles.placeholderText}>No exercises yet</Text>
            </View>
          ) : (
            display.exercises.map((ex, i) => {
              const gifUrl = (ex as { gifUrl?: string }).gifUrl;
              const thumbnailUrl = (ex as { thumbnailUrl?: string }).thumbnailUrl;
              const exerciseId = (ex as { exerciseId?: string }).exerciseId;
              const supersetGroup = (ex as { supersetGroup?: number }).supersetGroup;
              const hasImg = !!(gifUrl || thumbnailUrl);
              const canOpen = !!exerciseId && !exerciseId.startsWith('plan_');
              const openExercise = canOpen
                ? () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    withLock(() => router.push(`/exercise/${exerciseId}`));
                  }
                : undefined;
              // Hide the divider between two same-superset rows so the pair
              // reads as a visually-linked unit.
              const next = display.exercises[i + 1] as { supersetGroup?: number } | undefined;
              const inSameGroupAsNext =
                supersetGroup != null && next?.supersetGroup === supersetGroup;
              const supersetColor = supersetGroup != null ? getSupersetColor(supersetGroup) : null;
              return (
                <View key={`${ex.name}-${i}`}>
                  <View style={styles.exRow}>
                    {supersetColor && (
                      <View style={[styles.supersetStripe, { backgroundColor: supersetColor }]} />
                    )}
                    <Pressable style={styles.exThumb} onPress={openExercise} disabled={!canOpen}>
                      {hasImg ? (
                        <ExerciseImage
                          gifUrl={gifUrl}
                          thumbnailUrl={thumbnailUrl}
                          size={56}
                          borderRadius={10}
                        />
                      ) : (
                        <View
                          style={[
                            styles.exThumbPlaceholder,
                            { backgroundColor: display.heroColor },
                          ]}
                        />
                      )}
                    </Pressable>
                    <View style={styles.exInfo} pointerEvents="box-none">
                      <View style={styles.exNameRow}>
                        <Text
                          style={[styles.exName, { alignSelf: 'flex-start' }]}
                          numberOfLines={2}
                          onPress={openExercise}
                        >
                          {ex.name}
                        </Text>
                        {supersetColor && (
                          <View style={[styles.supersetBadge, { backgroundColor: supersetColor }]}>
                            <Ionicons name="link" size={11} color="#000" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.exSub}>{ex.sub}</Text>
                    </View>
                  </View>
                  {i < display.exercises.length - 1 && !inSameGroupAsNext && (
                    <View style={styles.exDivider} />
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Delete (kept from previous behaviour) */}
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleDeleteWorkout();
          }}
        >
          <Text style={styles.deleteButtonText}>{t('workoutPreview.deleteWorkout')}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, color: '#999' },
  emptySubtext: { fontFamily: fonts.regular, fontSize: 13, color: '#bbb', marginTop: 6 },

  heroRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  heroImage: {
    width: 110,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginLeft: 4,
    transform: [{ rotate: '-2.5deg' }],
  },
  heroText: { flex: 1, paddingTop: 4 },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000',
    marginBottom: 6,
  },
  heroDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  startPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  startPillText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  listHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
    marginBottom: 12,
  },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  exThumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  exThumbPlaceholder: { width: 56, height: 56, borderRadius: 10 },
  exInfo: { flex: 1 },
  exNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exName: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  exSub: { fontFamily: fonts.regular, fontSize: 12, color: '#999', marginTop: 2 },
  exDivider: { height: 1, backgroundColor: '#F0F0F0' },
  supersetStripe: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  supersetBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  placeholderText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  freeTextBlock: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 10,
  },
  freeTextLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: 1,
  },
  freeTextContent: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  cardioHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
    paddingBottom: 4,
  },
  cardioIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cardioCheckCircleSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  cardioCheckCircleLocked: {
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cardioRowLocked: {
    opacity: 0.35,
  },
  startPillDisabled: {
    opacity: 0.4,
  },

  deleteButton: { paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  deleteButtonText: { fontFamily: fonts.medium, fontSize: 14, color: '#E53935' },
});
