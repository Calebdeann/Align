import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '@/constants/theme';

interface MixedHeadingProps {
  boldLine: string;
  italicPhrase: string;
  regularSuffix?: string;
  size?: number;
  align?: 'center' | 'left';
}

export default function MixedHeading({
  boldLine,
  italicPhrase,
  regularSuffix,
  size = 42,
  align = 'center',
}: MixedHeadingProps) {
  return (
    <View style={[styles.container, align === 'left' && styles.alignLeft]}>
      <Text style={[styles.boldLine, { fontSize: size, lineHeight: Math.round(size * 1.2) }]}>
        {boldLine}
      </Text>
      <Text style={[styles.secondLine, { fontSize: size, lineHeight: Math.round(size * 1.2) }]}>
        <Text style={[styles.italicPhrase, { fontSize: size }]}>{italicPhrase}</Text>
        {regularSuffix ? (
          <Text style={[styles.regularSuffix, { fontSize: size }]}> {regularSuffix}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  boldLine: {
    fontFamily: fonts.frauncesBold,
    color: '#000000',
    lineHeight: 50,
    textAlign: 'center',
  },
  secondLine: {
    textAlign: 'center',
    lineHeight: 50,
  },
  italicPhrase: {
    fontFamily: fonts.instrumentSerifItalic,
    color: '#000000',
  },
  regularSuffix: {
    fontFamily: fonts.fraunces,
    color: '#000000',
  },
});
