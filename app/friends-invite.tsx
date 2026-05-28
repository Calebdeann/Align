import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '@/constants/theme';
import {
  getUserReferralCode,
  validateReferralCode,
  applyReferralCode,
} from '@/services/api/referrals';
import { useUserProfileStore } from '@/stores/userProfileStore';
import CircleBackButton from '@/components/ui/CircleBackButton';

export default function FriendsInviteScreen() {
  const insets = useSafeAreaInsets();
  const userId = useUserProfileStore((s) => s.profile?.id ?? '');
  const userName = useUserProfileStore((s) => s.profile?.name ?? '');

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getUserReferralCode(userId).then(setReferralCode);
  }, [userId]);

  const handleSendInvites = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Hey girl! You should join my workout challenge on the It Girl App\n\nHere's the code to join: ${referralCode}`,
      });
    } catch {
      // user cancelled share sheet — no-op
    }
  };

  const handleApplyCode = async () => {
    const code = enteredCode.trim().toUpperCase();
    if (!code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setApplying(true);
    try {
      const { valid, referrerId } = await validateReferralCode(code);
      if (!valid || !referrerId) {
        Alert.alert(
          'Invalid code',
          'That code does not exist. Check with your friend and try again.'
        );
        return;
      }
      if (referrerId === userId) {
        Alert.alert('Oops', "You can't use your own code.");
        return;
      }
      const ok = await applyReferralCode(userId, referrerId);
      if (ok) {
        Alert.alert('Code applied!', "You're now connected with your friend.");
        setEnteredCode('');
        setShowCodeInput(false);
      } else {
        Alert.alert('Already used', 'This code has already been applied to your account.');
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Back button */}
        <CircleBackButton
          style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10 }}
        />

        {/* Main card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.titleLine} numberOfLines={3}>
            <Text style={styles.titleSerif}>You&apos;re </Text>
            <Text style={styles.titleItalic}>invited</Text>
            {'\n'}
            <Text style={styles.titleSerif}>to join</Text>
            {'\n'}
            <Text style={styles.titleSerif}>
              {userName ? `${userName.split(' ')[0]}'s ` : ''}challenge
            </Text>
          </Text>

          <View style={styles.divider} />

          {/* Referral code */}
          {referralCode ? (
            <>
              <Text style={styles.code}>{referralCode}</Text>
              <Text style={styles.codeSubtitle}>Share this code with friends</Text>
            </>
          ) : (
            <ActivityIndicator size="small" color="#000" style={{ marginVertical: 16 }} />
          )}

          {/* Send Invites button */}
          <Pressable style={styles.sendBtn} onPress={handleSendInvites} disabled={!referralCode}>
            <LinearGradient
              colors={['#262626', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sendGradient}
            >
              <Ionicons name="share-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendText}>Send Invites</Text>
            </LinearGradient>
          </Pressable>

          {/* Or separator */}
          <Text style={styles.orText}>or</Text>

          {/* Use a friend's code */}
          <Pressable
            style={styles.useCodeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowCodeInput((v) => !v);
            }}
          >
            <Text style={styles.useCodeText}>Use a friend&apos;s code</Text>
          </Pressable>

          {showCodeInput && (
            <View style={styles.codeInputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter code"
                placeholderTextColor="#aaa"
                autoCapitalize="characters"
                autoCorrect={false}
                value={enteredCode}
                onChangeText={setEnteredCode}
                maxLength={12}
              />
              <Pressable
                style={[styles.applyBtn, applying && { opacity: 0.5 }]}
                onPress={handleApplyCode}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyText}>Apply</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 28,
    paddingVertical: 36,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ rotate: '-1deg' }],
  },
  titleLine: {
    textAlign: 'center',
    marginBottom: 8,
  },
  titleSerif: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 38,
    color: '#000',
    lineHeight: 46,
  },
  titleItalic: {
    fontFamily: fonts.frauncesBold,
    fontSize: 38,
    color: '#000',
    fontStyle: 'italic',
    lineHeight: 46,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '80%',
    marginVertical: 20,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: '#000',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  codeSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  sendBtn: {
    alignSelf: 'center',
    borderRadius: 500,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 500,
  },
  sendText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#fff',
  },
  orText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#666',
    marginVertical: 12,
  },
  useCodeBtn: {
    backgroundColor: '#fff',
    borderRadius: 500,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  useCodeText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: 'rgba(0,0,0,0.5)',
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    width: '85%',
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  applyBtn: {
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: '#000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#fff',
  },
});
