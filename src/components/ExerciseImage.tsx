import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface ExerciseImageProps {
  gifUrl?: string;
  thumbnailUrl?: string; // Static JPEG thumbnail for fast list loading
  size?: number;
  borderRadius?: number;
  animated?: boolean; // false = use thumbnail (list view), true = animated GIF (detail view)
  backgroundColor?: string; // Override background color to match parent
}

function Placeholder({ size, borderRadius }: { size: number; borderRadius: number }) {
  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      <Ionicons name="barbell-outline" size={size * 0.5} color={colors.textSecondary} />
    </View>
  );
}

export function ExerciseImage({
  gifUrl,
  thumbnailUrl,
  size = 40,
  borderRadius = 8,
  animated = false,
  backgroundColor,
}: ExerciseImageProps) {
  const [hasError, setHasError] = useState(false);

  // Use thumbnail for list views (faster loading), GIF for detail/animated views
  const imageUrl = animated ? gifUrl : thumbnailUrl || gifUrl;

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: backgroundColor ?? '#F5F4FA',
          },
        ]}
        contentFit="cover"
        cachePolicy="memory-disk"
        autoplay={animated}
        onError={() => setHasError(true)}
      />
    );
  }

  return <Placeholder size={size} borderRadius={borderRadius} />;
}

const styles = StyleSheet.create({
  image: {
    // backgroundColor set inline to allow override
  },
  placeholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
