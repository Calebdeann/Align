import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SelectedImageData {
  type: 'template' | 'camera' | 'gallery';
  uri: string;
  localSource?: ImageSourcePropType;
  templateImageId?: string;
}

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (image: SelectedImageData) => void;
}

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ImagePlaceholderIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect
          x={3}
          y={3}
          width={18}
          height={18}
          rx={2}
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M21 15l-5-5L5 21"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </View>
    </View>
  );
}

export function ImagePickerSheet({ visible, onClose, onImageSelected }: ImagePickerSheetProps) {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleChooseFromLibrary = async () => {
    close();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(i18n.t('errors.permissionNeeded'), i18n.t('errors.photoLibraryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected({
        type: 'gallery',
        uri: result.assets[0].uri,
      });
    }
  };

  const handleTakePhoto = async () => {
    close();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(i18n.t('errors.permissionNeeded'), i18n.t('errors.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected({
        type: 'camera',
        uri: result.assets[0].uri,
      });
    }
  };

  const handleOpenTemplates = () => {
    close();
    router.push('/template-images');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Pressable style={styles.modalOverlay} onPress={close}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable style={styles.modalCloseButton} onPress={close}>
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{t('imagePicker.addPhoto')}</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <View style={styles.imagePickerOptions}>
              <Pressable style={styles.imagePickerRow} onPress={handleChooseFromLibrary}>
                <Ionicons name="image-outline" size={22} color={colors.text} />
                <Text style={styles.imagePickerLabel}>{t('imagePicker.chooseFromLibrary')}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.imagePickerRow} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={22} color={colors.text} />
                <Text style={styles.imagePickerLabel}>{t('imagePicker.takePhoto')}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.imagePickerRow} onPress={handleOpenTemplates}>
                <Ionicons name="grid-outline" size={22} color={colors.text} />
                <Text style={styles.imagePickerLabel}>{t('imagePicker.templates')}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  imagePickerOptions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  imagePickerLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
});
