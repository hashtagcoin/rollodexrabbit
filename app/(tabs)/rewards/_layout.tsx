import { Stack } from 'expo-router';

export default function RewardsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="badge-details" />
      <Stack.Screen name="claim-reward" />
    </Stack>
  );
}