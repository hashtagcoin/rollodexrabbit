import { Stack } from 'expo-router';

export default function HousingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="apply" />
    </Stack>
  );
}