import { router } from 'expo-router';
import OnboardingLayout from '@/components/OnboardingLayout';

export default function WelcomeScreen() {
  return (
    <OnboardingLayout
      title="Welcome to Align!"
      subtitle="Easily log your workouts, tracking each set"
      currentStep={1}
      totalSteps={4}
      onContinue={() => router.push('/onboarding/progress')}
      onSkip={() => router.push('/onboarding/progress')}
    />
  );
}
