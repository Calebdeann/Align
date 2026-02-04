import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const WorkoutWidgetBridge = NativeModules.WorkoutWidgetBridge;

export interface WidgetExerciseSet {
  setNumber: number;
  totalSets: number;
  weight: string;
  reps: string;
  completed: boolean;
  setType: string;
}

export interface WidgetExercise {
  name: string;
  thumbnailUrl?: string;
  sets: WidgetExerciseSet[];
}

export interface WidgetWorkoutState {
  workoutName: string;
  startedAtMs: number;
  exercises: WidgetExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalCompletedSets: number;
  totalSets: number;
  allSetsComplete: boolean;
  weightUnit: string;
}

export interface WidgetAction {
  type: string;
  exerciseIndex: number;
  setIndex: number;
  timestamp: number;
}

/**
 * Write full workout state to App Groups UserDefaults for the widget to read.
 */
export function writeWorkoutStateToWidget(state: WidgetWorkoutState): void {
  if (Platform.OS !== 'ios' || !WorkoutWidgetBridge) return;
  try {
    WorkoutWidgetBridge.writeWorkoutState(JSON.stringify(state));
  } catch (e) {
    console.warn('[WidgetBridge] Failed to write workout state:', e);
  }
}

/**
 * Clear workout state from App Groups (call when workout ends).
 */
export function clearWidgetWorkoutState(): void {
  if (Platform.OS !== 'ios' || !WorkoutWidgetBridge) return;
  try {
    WorkoutWidgetBridge.clearWorkoutState();
  } catch (e) {
    console.warn('[WidgetBridge] Failed to clear workout state:', e);
  }
}

/**
 * Read any pending widget actions (set completions from the Live Activity).
 */
export async function readWidgetActions(): Promise<WidgetAction[]> {
  if (Platform.OS !== 'ios' || !WorkoutWidgetBridge) return [];
  try {
    const actions = await WorkoutWidgetBridge.readWidgetActions();
    if (!actions || !Array.isArray(actions) || actions.length === 0) return [];
    return actions as WidgetAction[];
  } catch (e) {
    console.warn('[WidgetBridge] Failed to read widget actions:', e);
    return [];
  }
}

/**
 * Listen for real-time set completions from the Live Activity widget.
 * Returns an unsubscribe function.
 */
export function onWidgetSetCompleted(
  callback: (event: { actions: WidgetAction[] }) => void
): () => void {
  if (Platform.OS !== 'ios' || !WorkoutWidgetBridge) return () => {};

  try {
    const emitter = new NativeEventEmitter(WorkoutWidgetBridge);
    const subscription = emitter.addListener('onWidgetSetCompleted', callback);
    return () => subscription.remove();
  } catch (e) {
    console.warn('[WidgetBridge] Failed to subscribe to widget events:', e);
    return () => {};
  }
}
