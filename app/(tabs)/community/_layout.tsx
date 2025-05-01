import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="events" />
      {/* <Stack.Screen name="groups" /> */}
      <Stack.Screen name="groups/[id]" />
      <Stack.Screen name="groups/create" />
      <Stack.Screen name="post" />
      <Stack.Screen name="create" />
      <Stack.Screen name="find-friends" />
    </Stack>
  );
}