import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';

type Part = { text: string; italic: boolean };

const LINES: Part[][] = [
  [{ text: 'You are not here\nby accident.', italic: false }],
  [
    { text: 'Something\n', italic: false },
    { text: 'guided', italic: true },
    { text: ' you here', italic: false },
  ],
  [
    { text: 'The ', italic: false },
    { text: 'universe', italic: true },
    { text: ' has a\nmessage for you...', italic: false },
  ],
];

const CHAR_INTERVAL_MS = 45;
const PAUSE_AFTER_TYPING_MS = 1150;
const HOLD_AFTER_LAST_LINE_MS = 1400;

function lineLength(parts: Part[]): number {
  return parts.reduce((sum, p) => sum + p.text.length, 0);
}

function renderLine(parts: Part[], revealed: number) {
  let remaining = revealed;
  return parts.map((p, i) => {
    if (remaining <= 0) return null;
    const slice = p.text.slice(0, remaining);
    remaining -= p.text.length;
    return (
      <Text key={i} style={p.italic ? styles.italic : styles.regular}>
        {slice}
      </Text>
    );
  });
}

export default function NotByAccidentScreen() {
  const [lineIdx, setLineIdx] = useState(0);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let local = 0;
    const total = lineLength(LINES[lineIdx]);
    let typeId: ReturnType<typeof setInterval> | null = null;
    let pauseId: ReturnType<typeof setTimeout> | null = null;

    typeId = setInterval(() => {
      local += 1;
      setRevealed(local);
      // Heavy haptic on every visible character for a strong typewriter feel.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (local >= total) {
        if (typeId) clearInterval(typeId);
        typeId = null;
        const isLast = lineIdx === LINES.length - 1;
        pauseId = setTimeout(
          () => {
            if (isLast) {
              router.replace('/onboarding/quote-flicker');
            } else {
              // Reset `revealed` in the same React batch as the lineIdx bump,
              // so the new line never renders for one frame with the previous
              // line's full character count.
              setRevealed(0);
              setLineIdx((i) => i + 1);
            }
          },
          isLast ? HOLD_AFTER_LAST_LINE_MS : PAUSE_AFTER_TYPING_MS
        );
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      if (typeId) clearInterval(typeId);
      if (pauseId) clearTimeout(pauseId);
    };
  }, [lineIdx]);

  return (
    <View style={styles.container}>
      <View style={styles.topSpacer} />

      <View style={styles.content}>
        <Text style={styles.line}>{renderLine(LINES[lineIdx], revealed)}</Text>
      </View>

      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSpacer: {
    flex: 1.1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: -30,
    paddingHorizontal: 24,
    minHeight: 52 * 3,
    justifyContent: 'center',
  },
  bottomSpacer: {
    flex: 1,
  },
  line: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 44,
    lineHeight: 52,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  regular: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 44,
    lineHeight: 52,
  },
  italic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 44,
    lineHeight: 52,
  },
});
