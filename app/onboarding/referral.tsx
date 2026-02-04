import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

interface Source {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  useTint: boolean;
}

export default function ReferralScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const sources: Source[] = useMemo(
    () => [
      {
        id: 'instagram',
        label: t('onboarding.referral.instagram'),
        icon: require('../../assets/images/Onboarding Icons/6. Hear us/instagram-icon.png'),
        useTint: false,
      },
      {
        id: 'tiktok',
        label: t('onboarding.referral.tiktok'),
        icon: require('../../assets/images/Onboarding Icons/6. Hear us/tiktok-icon.png'),
        useTint: false,
      },
      {
        id: 'appstore',
        label: t('onboarding.referral.appStore'),
        icon: require('../../assets/images/Onboarding Icons/6. Hear us/app-store-icon.png'),
        useTint: false,
      },
      {
        id: 'friend',
        label: t('onboarding.referral.friendFamily'),
        icon: require('../../assets/images/Onboarding Icons/6. Hear us/friends-family-icon.png'),
        useTint: true,
      },
      {
        id: 'other',
        label: t('onboarding.referral.other'),
        icon: require('../../assets/images/Onboarding Icons/6. Hear us/icon-park-outline_more-four.png'),
        useTint: true,
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('referralSource', id);
      setTimeout(() => {
        router.push('/onboarding/goals');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.referral.question')}
      progress={8}
      onSkip={() => {
        skipField('referralSource');
        router.push('/onboarding/goals');
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
