import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { colors } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: checked ? '#FFFFFF' : '#E0E0E0',
        backgroundColor: checked ? '#FFFFFF' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked && (
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </View>
  );
}

export default function OtherGoalsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const { setAndSave, skipField } = useOnboardingStore();

  const otherGoals = useMemo<{ id: string; label: string; icon: ImageSourcePropType }[]>(
    () => [
      {
        id: 'confidence',
        label: t('onboarding.otherGoals.gainConfidence'),
        icon: require('../../assets/images/Onboarding Icons/2. Other Goals/bi_stars.png'),
      },
      {
        id: 'strength',
        label: t('onboarding.otherGoals.buildStrength'),
        icon: require('../../assets/images/Onboarding Icons/2. Other Goals/icon-park-solid_muscle.png'),
      },
      {
        id: 'look',
        label: t('onboarding.otherGoals.lookBetter'),
        icon: require('../../assets/images/Onboarding Icons/2. Other Goals/temaki_dress.png'),
      },
      {
        id: 'energy',
        label: t('onboarding.otherGoals.feelEnergized'),
        icon: require('../../assets/images/Onboarding Icons/2. Other Goals/ix_electrical-energy-filled.png'),
      },
    ],
    [t]
  );

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const newSelected = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : [...selected, id];
    setSelected(newSelected);
    setAndSave('otherGoals', newSelected);
  };

  const handleContinue = () => {
    router.push('/onboarding/potential');
  };

  return (
    <QuestionLayout
      question={t('onboarding.otherGoals.question')}
      progress={12}
      showContinue
      continueDisabled={selected.length === 0}
      onContinue={handleContinue}
      onSkip={() => {
        skipField('otherGoals');
        router.push('/onboarding/potential');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {otherGoals.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => toggleSelect(goal.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Image
                  source={goal.icon}
                  style={{ width: 20, height: 20, tintColor: isSelected ? '#FFFFFF' : '#000000' }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {goal.label}
              </Text>
              <Checkbox checked={isSelected} />
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
