import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { spacing } from '@/constants/theme';

const SHELL_IMAGES: Record<string, number> = {
  A: require('../../../assets/shells/A.png'),
  B: require('../../../assets/shells/B.png'),
  C: require('../../../assets/shells/C.png'),
  D: require('../../../assets/shells/D.png'),
  E: require('../../../assets/shells/E.png'),
  F: require('../../../assets/shells/F.png'),
  G: require('../../../assets/shells/G.png'),
  H: require('../../../assets/shells/H.png'),
  I: require('../../../assets/shells/I.png'),
  J: require('../../../assets/shells/J.png'),
  K: require('../../../assets/shells/K.png'),
  L: require('../../../assets/shells/L.png'),
  M: require('../../../assets/shells/M.png'),
  N: require('../../../assets/shells/N.png'),
  O: require('../../../assets/shells/O.png'),
  P: require('../../../assets/shells/P.png'),
  Q: require('../../../assets/shells/Q.png'),
  R: require('../../../assets/shells/R.png'),
  S: require('../../../assets/shells/S.png'),
  T: require('../../../assets/shells/T.png'),
  U: require('../../../assets/shells/U.png'),
  V: require('../../../assets/shells/V.png'),
  W: require('../../../assets/shells/W.png'),
  X: require('../../../assets/shells/X.png'),
  Y: require('../../../assets/shells/Y.png'),
  Z: require('../../../assets/shells/Z.png'),
};

interface NameShellsProps {
  name: string;
  maxSize?: number;
  minSize?: number;
  gap?: number;
  availableWidth?: number;
  minRowHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export default function NameShells({
  name,
  maxSize = 54,
  minSize = 18,
  gap = 8,
  availableWidth: availableWidthProp,
  minRowHeight = 62,
  style,
}: NameShellsProps) {
  const { width: screenWidth } = useWindowDimensions();
  const availableWidth = availableWidthProp ?? screenWidth - spacing.lg * 2;

  const shellLetters = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('');

  const shellSize =
    shellLetters.length === 0
      ? maxSize
      : Math.max(
          minSize,
          Math.min(
            maxSize,
            (availableWidth - (shellLetters.length - 1) * gap) / shellLetters.length
          )
        );

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: minRowHeight,
          gap,
        },
        style,
      ]}
    >
      {shellLetters.map((letter, index) => {
        const source = SHELL_IMAGES[letter];
        if (!source) return null;
        return (
          <Image
            key={`${letter}-${index}`}
            source={source}
            style={{ width: shellSize, height: shellSize }}
            contentFit="contain"
          />
        );
      })}
    </View>
  );
}
