import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

export default function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const anim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.base, style, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#EBEBEB', borderRadius: 8 },
});
