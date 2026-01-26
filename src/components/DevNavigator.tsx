import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/stores/workoutStore';

const DEV_MODE = true; // Set to false for production

const screens: Record<number, string> = {
  1: '/',
  2: '/onboarding/welcome',
  3: '/onboarding/progress',
  4: '/onboarding/schedule',
  5: '/onboarding/ready',
  6: '/onboarding/experience',
  7: '/onboarding/goals',
  8: '/onboarding/other-goals',
  9: '/onboarding/potential',
  10: '/onboarding/referral',
  11: '/onboarding/age',
  12: '/onboarding/height',
  13: '/onboarding/weight',
  14: '/onboarding/target-weight',
  15: '/onboarding/goal-reality',
  16: '/onboarding/goal-comparison',
  18: '/onboarding/obstacles',
  19: '/onboarding/accomplish',
  20: '/onboarding/prediction',
  // Screens 21-29 need to be added as they're built
  25: '/onboarding/track-exercise-select',
  26: '/onboarding/track-tutorial',
  30: '/onboarding/thank-you',
  32: '/onboarding/reviews',
  33: '/onboarding/generate-plan',
  34: '/home',
};

export default function DevNavigator() {
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const clearAllScheduledWorkouts = useWorkoutStore((state) => state.clearAllScheduledWorkouts);

  if (!DEV_MODE) return null;

  const handleGo = () => {
    const num = parseInt(input, 10);
    const path = screens[num];
    if (path) {
      router.replace(path);
      setShowModal(false);
      setInput('');
    }
  };

  const handleClearWorkouts = () => {
    Alert.alert(
      'Clear All Workouts',
      'This will remove all scheduled workouts from the calendar. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearAllScheduledWorkouts();
            setShowModal(false);
          },
        },
      ]
    );
  };

  return (
    <>
      <Pressable style={styles.devButton} onPress={() => setShowModal(true)}>
        <Text style={styles.devButtonText}>🛠</Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Go to Screen</Text>
            <Text style={styles.hint}>1-33: Onboarding, 34: Home</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder="Screen #"
              autoFocus
            />
            <Pressable style={styles.goButton} onPress={handleGo}>
              <Text style={styles.goText}>Go</Text>
            </Pressable>
            <Pressable style={styles.clearButton} onPress={handleClearWorkouts}>
              <Text style={styles.clearText}>Clear Workouts</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  devButtonText: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    width: 200,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  goButton: {
    backgroundColor: '#947AFF',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  goText: {
    color: '#FFF',
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  clearText: {
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 12,
  },
});
