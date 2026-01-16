import { router } from 'expo-router';
import OnboardingLayout from '@/components/OnboardingLayout';

export default function ReadyScreen() {
  return (
    <OnboardingLayout
      title="You're ready!"
      subtitle="Now lets get to know you a little bit better!"
      currentStep={4}
      totalSteps={4}
      onContinue={() => router.push('/onboarding/experience')}
      onSkip={() => router.push('/onboarding/experience')}
    />
  );
}
