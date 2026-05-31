import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import {
  reportContent,
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from '@/services/api/moderation';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  // Optional label shown in the heading ("Report Priya", "Report this workout").
  targetLabel?: string;
}

// Modal form for filing a report. Reason picker (5 fixed options) + optional
// notes (200 chars). On submit, inserts a row in `reports` via reportContent
// (RLS enforces reporter_id = auth.uid()). The form never reveals whether
// the report moved the needle — Apple's spec wants action, not transparency.
export default function ReportForm({ visible, onClose, targetType, targetId, targetLabel }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setReason(null);
    setNotes('');
    onClose();
  }

  async function handleSubmit() {
    if (!reason || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSubmitting(true);
    const ok = await reportContent(targetType, targetId, reason, notes);
    setSubmitting(false);
    if (ok) {
      Alert.alert('Report submitted', 'Thanks. Our team reviews reports within 24 hours.');
      setReason(null);
      setNotes('');
      onClose();
    } else {
      Alert.alert('Could not submit', 'Something went wrong. Please try again in a moment.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{targetLabel ? `Report: ${targetLabel}` : 'Report'}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="rgba(0,0,0,0.5)" />
            </Pressable>
          </View>

          <Text style={styles.section}>What's wrong?</Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((r) => {
              const selected = reason === r;
              return (
                <Pressable
                  key={r}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setReason(r);
                  }}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.reasonText}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>Anything to add?</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional. Up to 200 characters."
            placeholderTextColor="rgba(0,0,0,0.35)"
            style={styles.notes}
            multiline
            maxLength={200}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={!reason || submitting}
            style={[styles.submitButton, (!reason || submitting) && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    flex: 1,
  },
  section: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasons: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  reasonRowSelected: {
    backgroundColor: '#E8E8E8',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#000000',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  reasonText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
  },
  notes: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000000',
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
