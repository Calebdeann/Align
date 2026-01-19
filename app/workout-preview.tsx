import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle, dividerStyle } from '@/constants/theme';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';
import {
  useTemplateStore,
  type WorkoutTemplate,
  formatTemplateDuration,
  getTemplateTotalSets,
} from '@/stores/templateStore';
import { getCurrentUser } from '@/services/api/user';
import { useState, useEffect } from 'react';

// Icons
function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DumbbellIcon() {
  return <Ionicons name="barbell-outline" size={20} color={colors.primary} />;
}

function CalendarIcon() {
  return <Ionicons name="calendar-outline" size={20} color={colors.text} />;
}

function TimeIcon() {
  return <Ionicons name="time-outline" size={20} color={colors.text} />;
}

function RepeatIcon() {
  return <Ionicons name="repeat-outline" size={20} color={colors.text} />;
}

function ReminderIcon() {
  return <Ionicons name="notifications-outline" size={20} color={colors.text} />;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  }
  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'Tomorrow';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

// Format time for display
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// Get repeat label
function getRepeatLabel(repeat: ScheduledWorkout['repeat']): string {
  switch (repeat.type) {
    case 'never':
      return 'Does not repeat';
    case 'daily':
      return 'Every day';
    case 'weekly':
      return 'Every week';
    case 'biweekly':
      return 'Every 2 weeks';
    case 'monthly':
      return 'Every month';
    case 'custom':
      if (repeat.customDays && repeat.customDays.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return repeat.customDays.map((d) => dayNames[d]).join(', ');
      }
      return 'Custom';
    default:
      return 'Does not repeat';
  }
}

export default function WorkoutPreviewScreen() {
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const dateKey = params.dateKey as string;

  const [userId, setUserId] = useState<string | null>(null);

  // Get workout from store
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const startWorkoutFromTemplate = useWorkoutStore((state) => state.startWorkoutFromTemplate);
  const startActiveWorkout = useWorkoutStore((state) => state.startActiveWorkout);

  // Get template store
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);

  // Fetch user on mount
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, []);

  // Find the scheduled workout
  const workout = useMemo(() => {
    // The workoutId coming from the planner might have "scheduled_" prefix
    const cleanId = workoutId?.replace('scheduled_', '');
    return scheduledWorkouts.find((w) => w.id === cleanId || w.id === workoutId);
  }, [scheduledWorkouts, workoutId]);

  // Get linked template if exists
  const template = useMemo(() => {
    if (!workout?.templateId) return null;
    return getTemplateById(workout.templateId);
  }, [workout, getTemplateById]);

  // Handle starting workout
  const handleStartWorkout = () => {
    if (template) {
      // Start workout from template
      startWorkoutFromTemplate(
        template.id,
        template.name,
        template.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          muscle: ex.muscle,
          sets: ex.sets.map((s) => ({
            targetWeight: s.targetWeight,
            targetReps: s.targetReps,
          })),
          restTimerSeconds: ex.restTimerSeconds,
        })),
        userId
      );
    } else {
      // Start empty workout
      startActiveWorkout(userId);
    }
    router.push('/active-workout');
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Workout not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Info Card */}
        <View style={[styles.card, styles.workoutInfoCard]}>
          <View style={styles.workoutHeader}>
            {/* Template name badge with colour dot */}
            {workout.templateName && (
              <View style={[styles.templateBadge, { backgroundColor: workout.tagColor + '20' }]}>
                <View style={[styles.colourDot, { backgroundColor: workout.tagColor }]} />
                <Text style={[styles.templateBadgeText, { color: workout.tagColor }]}>
                  {workout.templateName.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.workoutTitle}>{workout.name}</Text>
            {workout.description && (
              <Text style={styles.workoutDescription}>{workout.description}</Text>
            )}
          </View>

          <View style={styles.cardDivider} />

          {/* Schedule Info */}
          <View style={styles.scheduleRow}>
            <CalendarIcon />
            <Text style={styles.scheduleLabel}>Date</Text>
            <Text style={styles.scheduleValue}>{formatDate(dateKey || workout.date)}</Text>
          </View>

          {workout.time && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.scheduleRow}>
                <TimeIcon />
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {formatTime(workout.time.hour, workout.time.minute)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.cardDivider} />
          <View style={styles.scheduleRow}>
            <RepeatIcon />
            <Text style={styles.scheduleLabel}>Repeat</Text>
            <Text style={styles.scheduleValue}>{getRepeatLabel(workout.repeat)}</Text>
          </View>

          {workout.reminder?.enabled && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.scheduleRow}>
                <ReminderIcon />
                <Text style={styles.scheduleLabel}>Reminder</Text>
                <Text style={styles.scheduleValue}>
                  {formatTime(workout.reminder.hour, workout.reminder.minute)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Template Section */}
        <Text style={styles.sectionTitle}>Template</Text>
        {template ? (
          <View style={styles.card}>
            {/* Template Header */}
            <View style={styles.templateHeader}>
              <View style={[styles.templateIcon, { backgroundColor: template.tagColor + '20' }]}>
                <DumbbellIcon />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {formatTemplateDuration(template.estimatedDuration)} •{' '}
                  {getTemplateTotalSets(template)} sets • {template.exercises.length} exercises
                </Text>
              </View>
            </View>

            {template.description && (
              <>
                <View style={styles.cardDivider} />
                <Text style={styles.templateDescription}>{template.description}</Text>
              </>
            )}

            <View style={styles.cardDivider} />

            {/* Exercise List */}
            <View style={styles.exerciseList}>
              {template.exercises.map((ex, index) => (
                <View key={ex.id}>
                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseIconContainer}>
                      <DumbbellIcon />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.muscle} • {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                      </Text>
                    </View>
                  </View>
                  {index < template.exercises.length - 1 && <View style={styles.exerciseDivider} />}
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* No Template Linked */
          <View style={styles.card}>
            <View style={styles.noTemplateContainer}>
              <View style={styles.noTemplateIcon}>
                <Ionicons name="barbell-outline" size={32} color={colors.textTertiary} />
              </View>
              <Text style={styles.noTemplateTitle}>No Template Linked</Text>
              <Text style={styles.noTemplateText}>
                This workout doesn't have a template attached. You can start an empty workout or
                link a template from the Workout tab.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Start Workout Button */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.startButton} onPress={handleStartWorkout}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  card: {
    ...cardStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  workoutInfoCard: {
    marginTop: spacing.md,
  },
  workoutHeader: {
    gap: spacing.xs,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  colourDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  templateBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  workoutTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  workoutDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardDivider: {
    ...dividerStyle,
    marginVertical: spacing.sm,
    marginHorizontal: -spacing.sm,
    marginLeft: 0,
    marginRight: 0,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  scheduleValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  templateMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  templateDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  exerciseList: {
    gap: spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  exerciseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  exerciseMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.15)',
    marginLeft: 52,
  },
  noTemplateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noTemplateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  noTemplateTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noTemplateText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
