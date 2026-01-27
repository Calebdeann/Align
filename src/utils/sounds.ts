import { Audio } from 'expo-av';
import { TimerSoundId } from '@/stores/userPreferencesStore';

const SOUND_FILES: Record<TimerSoundId, any> = {
  chime: require('../../assets/sounds/chime.wav'),
  bell: require('../../assets/sounds/bell.wav'),
  ding: require('../../assets/sounds/ding.wav'),
};

// Human-readable labels for the settings UI
export const TIMER_SOUND_OPTIONS: { id: TimerSoundId; label: string }[] = [
  { id: 'chime', label: 'Chime' },
  { id: 'bell', label: 'Bell' },
  { id: 'ding', label: 'Ding' },
];

let currentSound: Audio.Sound | null = null;

export async function playTimerSound(soundId: TimerSoundId): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[soundId]);
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
    console.warn('Failed to play timer sound:', error);
  }
}
