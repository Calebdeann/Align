import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

const sources = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'appstore', label: 'App Store', icon: '📱' },
  { id: 'friend', label: 'Friend / Family', icon: '👥' },
  { id: 'other', label: 'Other', icon: '✨' },
];

export default function ReferralScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    setSelected(id);
    setAndSave('referralSource', id);
    setTimeout(() => {
      router.push('/onboarding/age');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Where did you hear about us?"
      progress={50}
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
                <Text style={{ fontSize: 20 }}>{source.icon}</Text>
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
