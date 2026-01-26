import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface Source {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  useTint: boolean;
}

const sources: Source[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: require('../../assets/images/Onboarding Icons/6. Hear us/instagram-icon.png'),
    useTint: false,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: require('../../assets/images/Onboarding Icons/6. Hear us/tiktok-icon.png'),
    useTint: false,
  },
  {
    id: 'appstore',
    label: 'App Store',
    icon: require('../../assets/images/Onboarding Icons/6. Hear us/app-store-icon.png'),
    useTint: false,
  },
  {
    id: 'friend',
    label: 'Friend / Family',
    icon: require('../../assets/images/Onboarding Icons/6. Hear us/friends-family-icon.png'),
    useTint: true,
  },
  {
    id: 'other',
    label: 'Other',
    icon: require('../../assets/images/Onboarding Icons/6. Hear us/icon-park-outline_more-four.png'),
    useTint: true,
  },
];

export default function ReferralScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('referralSource', id);
    setTimeout(() => {
      router.push('/onboarding/age');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Where did you hear about us?"
      progress={20}
      onSkip={() => {
        skipField('referralSource');
        router.push('/onboarding/age');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {sources.map((source) => {
          const isSelected = selected === source.id;
          return (
            <Pressable
              key={source.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(source.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Image
                  source={source.icon}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: source.useTint ? (isSelected ? '#FFFFFF' : '#000000') : undefined,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {source.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
