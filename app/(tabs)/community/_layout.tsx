import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityLayout() {
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="events" 
        options={{
          headerShown: false, // Set to false to hide this header
          title: 'Events',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/(tabs)/community')} 
              style={styles.headerButton}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
                size={24} 
                color="#007AFF" // Standard iOS blue, adjust as needed
              />
            </TouchableOpacity>
          ),
        }}
      />
      {/* <Stack.Screen name="groups" /> */}
      <Stack.Screen name="groups/[id]" />
      <Stack.Screen name="groups/create" />
      <Stack.Screen name="groups/create-post" options={{ title: 'Create Group Post' }}/> 
      <Stack.Screen name="post" />
      <Stack.Screen name="create" />
      <Stack.Screen name="find-friends" />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: Platform.OS === 'ios' ? 10 : 15,
    padding: 5,
  },
});