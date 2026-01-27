import { Audio } from 'expo-av';
import { TimerSoundId } from '@/stores/userPreferencesStore';

// Load sound files defensively — if any are missing from the bundle, the app won't crash
let SOUND_FILES: Partial<Record<TimerSoundId, any>> = {};
try {
  SOUND_FILES = {
    chime: require('../../assets/sounds/chime.wav'),
    bell: require('../../assets/sounds/bell.wav'),
    ding: require('../../assets/sounds/ding.wav'),
  };
} catch (e) {
  console.warn('[Sounds] Failed to load sound files:', e);
}

// Human-readable labels for the settings UI
export const TIMER_SOUND_OPTIONS: { id: TimerSoundId; label: string }[] = [
  { id: 'chime', label: 'Chime' },
  { id: 'bell', label: 'Bell' },
  { id: 'ding', label: 'Ding' },
];

let currentSound: Audio.Sound | null = null;

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
