import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('screen');

const TEMPLATE_SECTIONS = [
  {
    title: 'Abs & Core',
    templates: [
      require('../assets/images/AbsMain.jpg'),
      require('../assets/images/ABS-CORE/IMG_4464.jpg'),
      require('../assets/images/ABS-CORE/IMG_4465.jpg'),
      require('../assets/images/ABS-CORE/IMG_4466.jpg'),
      require('../assets/images/ABS-CORE/IMG_4467.jpg'),
      require('../assets/images/ABS-CORE/IMG_4468.jpg'),
    ],
  },
  {
    title: 'Glutes',
    templates: [
      require('../assets/images/GlutesMain.jpg'),
      require('../assets/images/GLUTES/IMG_4472.jpg'),
      require('../assets/images/GLUTES/IMG_4473.jpg'),
      require('../assets/images/GLUTES/IMG_4474.jpg'),
      require('../assets/images/GLUTES/IMG_4475.jpg'),
      require('../assets/images/GLUTES/IMG_4476.jpg'),
    ],
  },
  {
    title: 'Lower Body',
    templates: [
      require('../assets/images/LowerBodyMain.jpg'),
      require('../assets/images/LOWER BODY/IMG_4484.jpg'),
      require('../assets/images/LOWER BODY/IMG_4485.jpg'),
      require('../assets/images/LOWER BODY/IMG_4486.jpg'),
      require('../assets/images/LOWER BODY/IMG_4487.jpg'),
      require('../assets/images/LOWER BODY/IMG_4488.jpg'),
    ],
  },
];

type WorkoutParams = {
  workoutTitle: string;
  durationSeconds: string;
  totalVolume: string;
  volumeUnit: string;
  exerciseCount: string;
  totalSets: string;
  userId: string;
};

export default function WorkoutPhotoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<WorkoutParams>();

  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;

  const hideSheet = () => {
    Animated.timing(sheetY, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }).start();
  };

  const showSheet = () => {
    Animated.timing(sheetY, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  };

  const workoutParams: WorkoutParams = {
    workoutTitle: params.workoutTitle ?? '',
    durationSeconds: params.durationSeconds ?? '0',
    totalVolume: params.totalVolume ?? '0',
    volumeUnit: params.volumeUnit ?? 'kg',
    exerciseCount: params.exerciseCount ?? '0',
    totalSets: params.totalSets ?? '0',
    userId: params.userId ?? '',
  };

  const navigateToPreview = (imageUri: string) => {
    router.push({ pathname: '/workout-photo-preview', params: { imageUri, ...workoutParams } });
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9, mediaTypes: ['images'] });
    if (!result.canceled && result.assets[0]) navigateToPreview(result.assets[0].uri);
  };

  const handleUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) navigateToPreview(result.assets[0].uri);
  };

  const handleTemplateSelect = (src: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { uri } = RNImage.resolveAssetSource(src);
    navigateToPreview(uri);
  };

  return (
    <View style={styles.container}>
      {/* Static background — replaces live CameraView */}
      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.15)" />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, zIndex: 40 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.circleBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.title}>Submit Photo</Text>
        <View style={styles.circleBtn}>
          <Ionicons name="information-circle-outline" size={22} color="#000" />
        </View>
      </View>

      {/* Shutter + links */}
      <View style={[styles.shutterArea, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.shutterBtn} onPress={handleTakePhoto} />
        <View style={styles.bottomLinks}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showSheet();
            }}
          >
            <Text style={styles.linkText}>Template</Text>
          </Pressable>
          <Pressable onPress={handleUpload}>
            <Text style={styles.linkText}>Upload</Text>
          </Pressable>
        </View>
      </View>

      {/* Choose Image sheet — top is dynamic so it starts below the header */}
      <Animated.View
        style={[styles.sheet, { top: insets.top + 72, transform: [{ translateY: sheetY }] }]}
      >
        <View style={styles.dragHandle} />

        <View style={styles.sheetHeader}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              hideSheet();
            }}
            style={styles.sheetIconBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.sheetTitle}>Choose Image</Text>
          <View style={styles.sheetIconBtn}>
            <Ionicons name="options-outline" size={24} color="#000" />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
          {TEMPLATE_SECTIONS.map((section) => (
            <View key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.grid}>
                {section.templates.map((src, i) => (
                  <Pressable
                    key={i}
                    style={[
                      styles.gridCard,
                      { transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1deg' }] },
                    ]}
                    onPress={() => handleTemplateSelect(src)}
                  >
                    <Image source={src} style={styles.gridImage} contentFit="cover" />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const CARD_SIZE = Math.floor((Dimensions.get('window').width - 40) / 3);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
  },
  shutterArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
    zIndex: 5,
  },
  shutterBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 40,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 30,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#C8C8CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 26,
    color: '#000',
    textAlign: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: '#000',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 4,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
