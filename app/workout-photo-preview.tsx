import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';

type Audience = 'friends' | 'everyone';

export default function WorkoutPhotoPreviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri: string;
    workoutTitle: string;
    durationSeconds: string;
    totalVolume: string;
    volumeUnit: string;
    exerciseCount: string;
    totalSets: string;
    userId: string;
  }>();

  const [audience, setAudience] = useState<Audience>('friends');
  const [audienceVisible, setAudienceVisible] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '/workout-complete',
      params: {
        workoutTitle: params.workoutTitle,
        durationSeconds: params.durationSeconds,
        totalVolume: params.totalVolume,
        volumeUnit: params.volumeUnit,
        exerciseCount: params.exerciseCount,
        totalSets: params.totalSets,
        userId: params.userId,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.circleBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Submit Photo</Text>
          <View style={styles.circleBtn}>
            <Ionicons name="information-circle-outline" size={22} color="#fff" />
          </View>
        </View>
      </SafeAreaView>

      {/* Photo */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: params.imageUri }} style={styles.photo} contentFit="cover" />

        {/* X retake button */}
        <Pressable
          style={styles.closeBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>

        {/* Right-side placeholder circles */}
        <View style={styles.rightCircles}>
          <View style={styles.frostedCircle} />
          <View style={styles.frostedCircle} />
          <View style={styles.frostedCircle} />
        </View>

        {/* Bottom pills */}
        <View style={styles.pillsRow}>
          <Pressable
            style={[styles.frostedPill, styles.audiencePill]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAudienceVisible(true);
            }}
          >
            <Ionicons
              name={audience === 'friends' ? 'lock-closed' : 'globe-outline'}
              size={22}
              color="#fff"
            />
            <Text style={styles.pillText}>
              {audience === 'friends' ? 'My Friends' : 'Everyone'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.frostedPill, styles.musicPill]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Music', 'Music coming soon!');
            }}
          >
            <Ionicons name="musical-notes" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* SAVE */}
      <Pressable
        style={[styles.saveArea, { paddingBottom: Math.max(insets.bottom, 20) }]}
        onPress={handleSave}
      >
        <Text style={styles.saveText}>SAVE</Text>
      </Pressable>

      {/* Audience picker bottom sheet */}
      <Modal
        visible={audienceVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAudienceVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAudienceVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.audienceSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.audienceTitle}>Select your Audience</Text>

          <Pressable
            style={styles.audienceOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAudience('friends');
              setAudienceVisible(false);
            }}
          >
            <Ionicons name="lock-closed" size={22} color="#fff" />
            <Text style={styles.audienceOptionText}>Friends only</Text>
            <View style={[styles.radioCircle, audience === 'friends' && styles.radioSelected]}>
              {audience === 'friends' && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </Pressable>

          <Pressable
            style={styles.audienceOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAudience('everyone');
              setAudienceVisible(false);
            }}
          >
            <Ionicons name="globe-outline" size={22} color="#fff" />
            <Text style={styles.audienceOptionText}>Everyone</Text>
            <View style={[styles.radioCircle, audience === 'everyone' && styles.radioSelected]}>
              {audience === 'everyone' && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
  },
  photoContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  rightCircles: {
    position: 'absolute',
    top: 20,
    right: 16,
    gap: 10,
  },
  frostedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  pillsRow: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    flexDirection: 'row',
    gap: 10,
  },
  frostedPill: {
    height: 52,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  audiencePill: {
    paddingHorizontal: 16,
    gap: 8,
    minWidth: 160,
  },
  musicPill: {
    width: 72,
    justifyContent: 'center',
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#fff',
  },
  saveArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  saveText: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 80,
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 88,
  },
  // Audience modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  audienceSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#58585c',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  audienceTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121213',
    borderRadius: 20,
    height: 72,
    paddingHorizontal: 20,
    gap: 14,
  },
  audienceOptionText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#fff',
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
});
