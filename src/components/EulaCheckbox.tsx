import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';
import { TERMS_URL, PRIVACY_URL } from '@/constants/legal';

interface Props {
  accepted: boolean;
  onChange: (next: boolean) => void;
}

// Renders a checkbox + "I agree to the Terms of Use and Privacy Policy"
// sentence with tappable links. The Apple Guideline 1.2 EULA requirement
// uses this on every sign-in surface; the buttons in the parent screen
// are disabled until `accepted` is true.
export default function EulaCheckbox({ accepted, onChange }: Props) {
  const toggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onChange(!accepted);
  }, [accepted, onChange]);

  const openTerms = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(TERMS_URL).catch(() => {});
  }, []);

  const openPrivacy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(PRIVACY_URL).catch(() => {});
  }, []);

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} hitSlop={8} style={styles.boxHit}>
        <View style={[styles.box, accepted && styles.boxChecked]}>
          {accepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </Pressable>
      <Text style={styles.text} onPress={toggle}>
        I agree to the{' '}
        <Text style={styles.link} onPress={openTerms}>
          Terms of Use
        </Text>
        {' and '}
        <Text style={styles.link} onPress={openPrivacy}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  boxHit: {
    paddingTop: 2,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#000000',
    lineHeight: 18,
  },
  link: {
    fontFamily: fonts.semiBold,
    textDecorationLine: 'underline',
  },
});
