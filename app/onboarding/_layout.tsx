import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="other-goals" />
      <Stack.Screen name="training-location" />
      <Stack.Screen name="workout-frequency" />
      <Stack.Screen name="health-situations" />
      <Stack.Screen name="obstacles" />
      <Stack.Screen name="energy-fluctuation" />
      {/* <Stack.Screen name="accomplish" /> */}
      <Stack.Screen name="name" />
      <Stack.Screen name="age" />
      <Stack.Screen name="height" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="target-weight" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="reminder" />
      <Stack.Screen name="exercise-tutorial" />
      <Stack.Screen name="first-exercises" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="potential" />
      <Stack.Screen name="generate-plan" />
      <Stack.Screen name="generating-plan" />
      <Stack.Screen name="goal-comparison" />
      <Stack.Screen name="goal-reality" />
      {/* <Stack.Screen name="prediction" /> */}
      <Stack.Screen name="plan-ready" />
      {/* <Stack.Screen name="enter-referral-code" /> */}
      <Stack.Screen name="thank-you" />
    </Stack>
  );
}
