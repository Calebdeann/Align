import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';

// ── Mock data (replace with real workout data when wiring up) ─────────────────

const MOCK_MUSCLE_SPLIT = [
  { name: 'Glutes', percentage: 58 },
  { name: 'Legs', percentage: 37 },
  { name: 'Calves', percentage: 4 },
];

const MOCK_EXERCISES = [
  {
    id: '1',
    name: 'Hip Thrust (Barbell)',
    thumbnailUrl: null as string | null,
    sets: [
      { number: 1, weight: 90, reps: 8 },
      { number: 2, weight: 90, reps: 11 },
      { number: 3, weight: 80, reps: 10 },
    ],
  },
  {
    id: '2',
    name: 'Bulgarian Split Squat (Dumbbell)',
    thumbnailUrl: null as string | null,
    sets: [
      { number: 1, weight: 10, reps: 12 },
      { number: 2, weight: 10, reps: 12 },
      { number: 3, weight: 15, reps: 8 },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${mins} minutes`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  showDivider = true,
  chevron = false,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
  chevron?: boolean;
}) {
  return (
    <>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statRight}>
          <Text style={styles.statValue}>{value}</Text>
          {chevron && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(0,0,0,0.35)"
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

function MuscleBar({
  name,
  percentage,
  maxPercentage,
  availableWidth,
}: {
  name: string;
  percentage: number;
  maxPercentage: number;
  availableWidth: number;
}) {
  const filledWidth = Math.round((percentage / maxPercentage) * availableWidth);
  return (
    <View style={styles.muscleRow}>
      <Text style={styles.muscleName}>{name}</Text>
      <View style={styles.muscleBarRow}>
        <LinearGradient
          colors={['#000000', '#262626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.muscleBar, { width: filledWidth }]}
        />
        <Text style={styles.musclePercentage}>{percentage}%</Text>
      </View>
    </View>
  );
}

function ExerciseBlock({ exercise, unit }: { exercise: (typeof MOCK_EXERCISES)[0]; unit: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.exerciseBlock}>
      <Pressable
        style={styles.exerciseHeader}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((prev) => !prev);
        }}
      >
        <View style={styles.exerciseThumbnail}>
          {exercise.thumbnailUrl ? (
            <Image
              source={{ uri: exercise.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.exerciseThumbnailPlaceholder]} />
          )}
        </View>

        <Text style={styles.exerciseName} numberOfLines={2}>
          {exercise.name}
        </Text>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="rgba(0,0,0,0.35)"
        />
      </Pressable>

      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setHeaderRow}>
            <Text style={styles.setHeaderNum}>SET</Text>
            <Text style={styles.setHeaderDetails}>WEIGHT & REPS</Text>
          </View>
          {exercise.sets.map((set) => (
            <View key={set.number} style={styles.setRow}>
              <Text style={styles.setNumber}>{set.number}</Text>
              <Text style={styles.setDetails}>
                {set.weight} {unit} x {set.reps} reps
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WorkoutSummaryScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mode?: string;
    photoUri?: string;
    durationSeconds?: string;
    totalVolume?: string;
    volumeUnit?: string;
    exerciseCount?: string;
    totalSets?: string;
    userName?: string;
    userAvatarUrl?: string;
  }>();

  const isSaveMode = params.mode !== 'view';
  const photoUri = params.photoUri;
  const PHOTO_HEIGHT = Math.round(height * 0.46);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const durationSeconds = parseInt(params.durationSeconds ?? '0', 10);
  const volumeUnit = params.volumeUnit ?? 'kg';
  const totalVolume = params.totalVolume ?? '0';
  const exerciseCount = params.exerciseCount ?? '4';
  const totalSets = params.totalSets ?? '13';
  const userName = params.userName ?? 'Alexis';
  const userAvatarUrl = params.userAvatarUrl;

  const workoutDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canSave = title.trim().length > 0;
  const maxPercentage = Math.max(...MOCK_MUSCLE_SPLIT.map((m) => m.percentage));
  const barAvailableWidth = width - 40;

  function handleSave() {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: persist workout with title, description, photoUri
    router.dismissAll();
    router.replace('/(tabs)');
  }

  function handleDiscard() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Discard Workout', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          router.dismissAll();
          router.replace('/(tabs)');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo header */}
        <View style={[styles.photoContainer, { height: PHOTO_HEIGHT }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]} />
          )}
        </View>

        {/* White card — overlaps photo by 24px */}
        <View style={styles.card}>
          {/* Drag pill */}
          <View style={styles.dragPill} />

          {/* User row */}
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              {userAvatarUrl ? (
                <Image source={{ uri: userAvatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.workoutDate}>{workoutDate}</Text>
            </View>

            {isSaveMode && (
              <Pressable onPress={handleSave} hitSlop={8}>
                <LinearGradient
                  colors={canSave ? ['#262626', '#000000'] : ['#BBBBBB', '#999999']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {/* Title */}
          {isSaveMode ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title..."
              placeholderTextColor="rgba(0,0,0,0.28)"
              returnKeyType="done"
              maxLength={60}
            />
          ) : (
            <Text style={styles.titleText}>{title || 'Untitled Workout'}</Text>
          )}

          {/* Description */}
          {isSaveMode ? (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              maxLength={200}
            />
          ) : description ? (
            <Text style={styles.descriptionText}>{description}</Text>
          ) : null}

          {/* ── Summary ── */}
          <Text style={styles.sectionHeading}>Summary</Text>

          <StatRow label="Duration" value={formatDuration(durationSeconds)} chevron />
          <StatRow label="Volume" value={`${Number(totalVolume).toLocaleString()} ${volumeUnit}`} />
          <StatRow label="Sets" value={totalSets} />
          <StatRow label="Exercises" value={exerciseCount} showDivider={false} />

          {/* ── Muscle Split ── */}
          <Text style={[styles.sectionHeading, { marginTop: 32 }]}>Muscle Split</Text>

          {MOCK_MUSCLE_SPLIT.map((m) => (
            <MuscleBar
              key={m.name}
              name={m.name}
              percentage={m.percentage}
              maxPercentage={maxPercentage}
              availableWidth={barAvailableWidth}
            />
          ))}

          {/* ── Exercises ── */}
          <Text style={[styles.sectionHeading, { marginTop: 32 }]}>Exercises</Text>

          {MOCK_EXERCISES.map((ex) => (
            <ExerciseBlock key={ex.id} exercise={ex} unit={volumeUnit} />
          ))}

          {/* Discard (save mode only) */}
          {isSaveMode && (
            <Pressable style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardText}>Discard Workout</Text>
            </Pressable>
          )}

          <View style={{ height: 48 }} />
        </View>
      </ScrollView>

      {/* Back button — fixed over photo */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Photo
  photoContainer: {
    width: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#2a2a2a',
  },

  // White card
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 600,
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },

  // Back button
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#D0D0D0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.3,
  },
  workoutDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },

  // Save button
  saveButton: {
    width: 90,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Title
  titleInput: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 38,
    color: '#000000',
    marginTop: 4,
    marginBottom: 6,
    padding: 0,
  },
  titleText: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 38,
    color: '#000000',
    marginTop: 4,
    marginBottom: 6,
  },

  // Description
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(0,0,0,0.75)',
    marginBottom: 20,
    padding: 0,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(0,0,0,0.75)',
    marginBottom: 20,
    letterSpacing: -0.2,
  },

  // Section headings
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 14,
    marginTop: 4,
  },

  // Stat rows
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.2,
  },
  statValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212,212,212,0.5)',
  },

  // Muscle split
  muscleRow: {
    marginBottom: 14,
  },
  muscleName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  muscleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleBar: {
    height: 14,
    borderRadius: 7,
  },
  musclePercentage: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    marginLeft: 8,
    letterSpacing: -0.2,
  },

  // Exercises
  exerciseBlock: {
    marginBottom: 24,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  exerciseThumbnailPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  exerciseName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  setsContainer: {
    marginTop: 12,
    paddingLeft: 62,
  },
  setHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 20,
  },
  setHeaderNum: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    width: 28,
    letterSpacing: 0.2,
  },
  setHeaderDetails: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: 0.2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  setNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#000000',
    width: 28,
    letterSpacing: -0.2,
  },
  setDetails: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: '#000000',
    letterSpacing: -0.2,
  },

  // Discard
  discardButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  discardText: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: '#fb5057',
    letterSpacing: -0.2,
  },
});
