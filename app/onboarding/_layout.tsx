import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 280,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="intro" />
      <Stack.Screen name="become" />
      <Stack.Screen name="name" />
      <Stack.Screen name="traffic-source" />
      <Stack.Screen name="achieve" />
      <Stack.Screen name="ideal-day" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="finding-workout" />
      <Stack.Screen name="select-program" />
      <Stack.Screen name="program-detail" />
      <Stack.Screen name="when-to-begin" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="find-partner" />
      <Stack.Screen name="gym-buddy" />
      <Stack.Screen name="partner-match" />
      <Stack.Screen name="sticker" />
      <Stack.Screen name="personalising" />
      <Stack.Screen name="pre-paywall" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="email-signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
