import { router } from 'expo-router';
import OnboardingLayout from '@/components/OnboardingLayout';

export default function ProgressScreen() {
  return (
    <OnboardingLayout
      title="Measure Progress"
      subtitle="Analyze your workout history with in depth analytics"
      currentStep={2}
      totalSteps={4}
      onContinue={() => router.push('/onboarding/schedule')}
      onSkip={() => router.push('/onboarding/experience')}
    />
  );
}
