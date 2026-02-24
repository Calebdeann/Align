import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="name" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="tried-apps" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="body-change" />
      <Stack.Screen name="other-goals" />
      <Stack.Screen name="training-location" />
      <Stack.Screen name="workout-frequency" />
      <Stack.Screen name="health-situations" />
      <Stack.Screen name="obstacles" />
      <Stack.Screen name="obstacle-response" />
      <Stack.Screen name="energy-fluctuation" />
      <Stack.Screen name="age" />
      <Stack.Screen name="height" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="target-weight" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="email-signin" />
      <Stack.Screen name="reminder" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="potential" />
      <Stack.Screen name="generate-plan" />
      <Stack.Screen name="generating-plan" />
      <Stack.Screen name="goal-comparison" />
      <Stack.Screen name="goal-reality" />
      <Stack.Screen name="thank-you" />
    </Stack>
  );
}
