import { Stack } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="services" />
      <Stack.Screen name="services/create" />
      <Stack.Screen name="services/[id]" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="bookings/[id]" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}