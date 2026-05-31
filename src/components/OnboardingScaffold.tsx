import { View, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

// Widest current iPhone (Pro Max class). On any device wider than this — iPad
// in iPhone-compat mode, future bigger phones — content is constrained to
// this width and centered. On iPhone the wrapper is a no-op because the
// device width is the limiting factor.
const MAX_CONTENT_WIDTH = 430;

interface Props {
  children: React.ReactNode;
  edges?: SafeAreaViewProps['edges'];
  backgroundColor?: string;
}

// Drop-in replacement for the root `<SafeAreaView>` on onboarding screens.
// Constrains content to a phone-shaped column on iPad so absolute-positioned
// CTAs (Continue buttons, headlines, etc.) stay reachable. Without this,
// `position: 'absolute'` against the viewport on an 11" iPad can push the
// Continue button below the visible area — which is exactly the Apple
// rejection we're fixing.
export default function OnboardingScaffold({
  children,
  edges,
  backgroundColor = '#FFFFFF',
}: Props) {
  return (
    <SafeAreaView style={[styles.outer, { backgroundColor }]} edges={edges}>
      <View style={styles.column}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});
