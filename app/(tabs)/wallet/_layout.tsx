import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="claims" />
      <Stack.Screen name="submit-claim" />
    </Stack>
  );
}