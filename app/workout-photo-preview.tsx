import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';

type Audience = 'friends' | 'everyone';

export default function WorkoutPhotoPreviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri: string;
    imageAspectRatio: string;
    workoutTitle: string;
    durationSeconds: string;
    totalVolume: string;
    volumeUnit: string;
    exerciseCount: string;
    totalSets: string;
    userId: string;
  }>();

  const { width } = useWindowDimensions();
  // Fixed-height container (16/9 of width) keeps the "Everyone" pill, X button,
  // and SAVE label anchored at consistent positions regardless of which photo
  // is picked. The image inside uses contentFit="contain" so it shows at its
  // natural aspect ratio, centered both axes, with #1F1F1F filling any
  // letterbox/pillarbox space around it.
  const PHOTO_H = Math.round(width * (16 / 9));

  const [audience, setAudience] = useState<Audience>('everyone');
  const [audienceVisible, setAudienceVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const showAudience = () => {
    setAudienceVisible(true);
    slideAnim.setValue(300);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const hideAudience = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setAudienceVisible(false);
    });
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/workout-summary',
      params: {
        photoUri: params.imageUri,
        imageAudience: audience,
        imageAspectRatio: params.imageAspectRatio,
        workoutTitle: params.workoutTitle,
        durationSeconds: params.durationSeconds,
        totalVolume: params.totalVolume,
        volumeUnit: params.volumeUnit,
        exerciseCount: params.exerciseCount,
        totalSets: params.totalSets,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Photo — fills from very top of screen */}
      <View style={[styles.photoContainer, { height: PHOTO_H, marginTop: insets.top }]}>
        <Image source={{ uri: params.imageUri }} style={styles.photo} contentFit="contain" />

        {/* Back button — floats on image, no background */}
        <Pressable
          style={[styles.closeBtn, { top: 10, left: 16 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
        >
          <View style={styles.iconShadow}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
        </Pressable>

        {/* Bottom pills — centered */}
        <View style={styles.pillsRow}>
          <Pressable
            style={[styles.frostedPill, styles.audiencePill]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              showAudience();
            }}
          >
            <Ionicons
              name={audience === 'friends' ? 'lock-closed' : 'globe-outline'}
              size={18}
              color="#fff"
            />
            <Text style={styles.pillText}>
              {audience === 'friends' ? 'My Friends' : 'Everyone'}
            </Text>
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
        animationType="none"
        onRequestClose={hideAudience}
      >
        <TouchableWithoutFeedback onPress={hideAudience}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.audienceSheet,
            { paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.audienceTitle}>Select your Audience</Text>

          <Pressable
            style={styles.audienceOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setAudience('friends');
              hideAudience();
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setAudience('everyone');
              hideAudience();
            }}
          >
            <Ionicons name="globe-outline" size={22} color="#fff" />
            <Text style={styles.audienceOptionText}>Everyone</Text>
            <View style={[styles.radioCircle, audience === 'everyone' && styles.radioSelected]}>
              {audience === 'everyone' && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoContainer: {
    width: '100%',
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  pillsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  frostedPill: {
    height: 44,
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
    paddingHorizontal: 14,
    gap: 8,
    minWidth: 130,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  saveArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },
  saveText: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 56,
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 64,
  },
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
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121213',
    borderRadius: 20,
    height: 64,
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
