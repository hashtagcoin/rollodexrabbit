import { Stack } from 'expo-router';

export default function AgreementsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="service-agreement" />
      <Stack.Screen name="consent-management" />
      <Stack.Screen name="compliance-check" />
    </Stack>
  );
}