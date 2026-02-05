import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { TimerSoundId } from '@/stores/userPreferencesStore';

// Load sound files defensively — if any are missing from the bundle, the app won't crash
let SOUND_FILES: Partial<Record<TimerSoundId, any>> = {};
try {
  SOUND_FILES = {
    chime: require('../../assets/sounds/chime.wav'),
    bell: require('../../assets/sounds/bell.wav'),
    ding: require('../../assets/sounds/ding.wav'),
    pulse: require('../../assets/sounds/pulse.wav'),
    alert: require('../../assets/sounds/alert.wav'),
  };
} catch (e) {
  console.warn('[Sounds] Failed to load sound files:', e);
}

// Human-readable labels for the settings UI
export const TIMER_SOUND_OPTIONS: { id: TimerSoundId; label: string }[] = [
  { id: 'chime', label: 'Chime' },
  { id: 'bell', label: 'Bell' },
  { id: 'ding', label: 'Ding' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'alert', label: 'Alert' },
];

let currentSound: Audio.Sound | null = null;

// Plays a single timer sound (used for preview in settings)
export async function playTimerSound(soundId: TimerSoundId): Promise<void> {
  try {
    const soundFile = SOUND_FILES[soundId];
    if (!soundFile) {
      console.warn(`[Sounds] Sound file not available: ${soundId}`);
      return;
    }

    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(soundFile);
    currentSound = sound;
    await sound.playAsync();

    // Auto-cleanup when playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
        if (currentSound === sound) {
          currentSound = null;
        }
      }
    });
  } catch (error) {
    console.warn('[Sounds] Failed to play timer sound:', error);
  }
}

// Plays the timer sound twice with a ~600ms gap (used for timer completion alerts)
export async function playTimerSoundDouble(soundId: TimerSoundId): Promise<void> {
  try {
    const soundFile = SOUND_FILES[soundId];
    if (!soundFile) {
      console.warn(`[Sounds] Sound file not available: ${soundId}`);
      return;
    }

    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    // First play
    const { sound: sound1 } = await Audio.Sound.createAsync(soundFile);
    currentSound = sound1;
    await sound1.playAsync();

    // When first play finishes, wait 600ms then play again
    sound1.setOnPlaybackStatusUpdate(async (status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        await sound1.unloadAsync();

        setTimeout(async () => {
          try {
            const { sound: sound2 } = await Audio.Sound.createAsync(soundFile);
            currentSound = sound2;
            await sound2.playAsync();

            sound2.setOnPlaybackStatusUpdate((status2) => {
              if ('didJustFinish' in status2 && status2.didJustFinish) {
                sound2.unloadAsync();
                if (currentSound === sound2) {
                  currentSound = null;
                }
              }
            });
          } catch (error) {
            console.warn('[Sounds] Failed to play second timer sound:', error);
          }
        }, 600);
      }
    });
  } catch (error) {
    console.warn('[Sounds] Failed to play double timer sound:', error);
  }
}

// Track active vibration interval so overlapping calls don't stack
let vibrationTimer: NodeJS.Timeout | null = null;

// Triggers sustained vibration (~2.5s) by chaining rapid haptic impacts.
// On iOS, Vibration.vibrate() only fires a single ~400ms pulse,
// so we use repeated expo-haptics Heavy impacts instead.
export function triggerTimerVibration(): void {
  if (vibrationTimer) {
    clearInterval(vibrationTimer);
    vibrationTimer = null;
  }

  const INTERVAL_MS = 150;
  const DURATION_MS = 2500;
  let elapsed = 0;

  // Fire immediately
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  vibrationTimer = setInterval(() => {
    elapsed += INTERVAL_MS;
    if (elapsed >= DURATION_MS) {
      if (vibrationTimer) {
        clearInterval(vibrationTimer);
        vibrationTimer = null;
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, INTERVAL_MS);
}
