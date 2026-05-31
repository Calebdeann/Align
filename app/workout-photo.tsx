import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image as RNImage,
  Alert,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: WIN_W } = Dimensions.get('window');
const PHOTO_H = Math.round(WIN_W * (16 / 9));

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

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [capturing, setCapturing] = useState(false);
  const [recentPhotoUri, setRecentPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: MediaLibrary.MediaType.photo,
      });
      if (assets[0]) setRecentPhotoUri(assets[0].uri);
    })();
  }, []);

  const workoutParams: WorkoutParams = {
    workoutTitle: params.workoutTitle ?? '',
    durationSeconds: params.durationSeconds ?? '0',
    totalVolume: params.totalVolume ?? '0',
    volumeUnit: params.volumeUnit ?? 'kg',
    exerciseCount: params.exerciseCount ?? '0',
    totalSets: params.totalSets ?? '0',
    userId: params.userId ?? '',
  };

  const navigateToPreview = (imageUri: string, imageAspectRatio: number) => {
    router.push({
      pathname: '/workout-photo-preview',
      params: { imageUri, imageAspectRatio: String(imageAspectRatio), ...workoutParams },
    });
  };

  const handlePickerError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    const isHeicFailure = /public\.heic|representation/i.test(msg);
    console.warn('[workout-photo] image picker failed', { msg });
    if (isHeicFailure) {
      Alert.alert(
        "Couldn't load that photo",
        'iOS could not read this image. It may be stored only in iCloud and needs to download first. Try a different photo, or open it once in the Photos app to fetch the full version.'
      );
    } else {
      Alert.alert("Couldn't load photo", 'Please try again.');
    }
  };

  const promptForPermission = async (): Promise<boolean> => {
    const res = await requestPermission();
    if (res.granted) return true;
    Alert.alert(
      'Camera access needed',
      'Enable camera access for It Girl in Settings to take post-workout photos.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (capturing) return;
    if (!permission?.granted) {
      const ok = await promptForPermission();
      if (!ok) return;
    }
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        Alert.alert("Couldn't capture photo", 'Please try again.');
        return;
      }
      const ratio = photo.width > 0 ? photo.height / photo.width : 16 / 9;
      navigateToPreview(photo.uri, ratio);
    } catch (err) {
      console.warn('[workout-photo] takePictureAsync failed', err);
      Alert.alert("Couldn't capture photo", 'Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const ratio = asset.width > 0 ? asset.height / asset.width : 16 / 9;
        navigateToPreview(asset.uri, ratio);
      }
    } catch (err) {
      handlePickerError(err);
    }
  };

  const cameraReady = !!permission?.granted;

  return (
    <View style={styles.container}>
      {/* Camera frame — fills from very top of screen */}
      <View style={[styles.cameraFrame, { top: insets.top, borderRadius: 20 }]}>
        {cameraReady ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
            enableTorch={false}
            mute
            // Selfie photos should match the mirrored preview the user sees
            // while framing — otherwise text/asymmetry looks flipped after capture.
            mirror={facing === 'front'}
          />
        ) : (
          <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.15)" />
        )}

        {/* Rule-of-thirds grid overlay */}
        {cameraReady && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.gridLineV, { left: '33.3333%' }]} />
            <View style={[styles.gridLineV, { left: '66.6666%' }]} />
            <View style={[styles.gridLineH, { top: '33.3333%' }]} />
            <View style={[styles.gridLineH, { top: '66.6666%' }]} />
          </View>
        )}

        {/* Shutter — centered at bottom of camera frame */}
        <Pressable
          style={[styles.shutterOuter, capturing && { opacity: 0.6 }]}
          onPress={handleTakePhoto}
          disabled={capturing}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>

      {/* Top controls — float over image, no backgrounds */}
      <View style={[styles.topControls, { top: insets.top + 12 }]}>
        {/* Back */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
        >
          <View style={styles.iconShadow}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </View>
        </Pressable>

        {/* Flash — center */}
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setFlash((f) => (f === 'off' ? 'on' : 'off'));
          }}
        >
          <View style={styles.iconShadow}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off-outline'}
              size={26}
              color="#fff"
            />
          </View>
        </Pressable>
      </View>

      {/* Bottom controls — below the camera frame */}
      <View
        style={[
          styles.bottomControls,
          { top: insets.top + PHOTO_H, paddingBottom: insets.bottom + 8 },
        ]}
      >
        {/* Gallery / recent photo */}
        <Pressable style={[styles.sideBtn, styles.sideBtnUpload]} onPress={handleUpload}>
          {recentPhotoUri ? (
            <RNImage
              source={{ uri: recentPhotoUri }}
              style={styles.recentPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.sideBtnInner}>
              <Ionicons name="image-outline" size={22} color="#fff" />
            </View>
          )}
        </Pressable>

        {/* Spacer where Templates used to live */}
        <View />

        {/* Flip camera — liquid glass dark circle */}
        <Pressable
          style={[styles.sideBtn, styles.sideBtnFlip]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setFacing((f) => (f === 'back' ? 'front' : 'back'));
          }}
        >
          <BlurView
            intensity={40}
            tint="systemChromeMaterialDark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sideBtnOverlay}>
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PHOTO_H,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  iconBtn: {
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
  shutterOuter: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#fff',
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sideBtnUpload: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  sideBtnFlip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  sideBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  recentPhoto: {
    width: '100%',
    height: '100%',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
