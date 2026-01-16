import { router } from 'expo-router';
import OnboardingLayout from '@/components/OnboardingLayout';

export default function ScheduleScreen() {
  return (
    <OnboardingLayout
      title="Never Miss a Workout"
      subtitle="Schedule your workouts ahead of time to stay consistent"
      currentStep={3}
      totalSteps={4}
      onContinue={() => router.push('/onboarding/ready')}
      onSkip={() => router.push('/onboarding/experience')}
    />
  );
}
