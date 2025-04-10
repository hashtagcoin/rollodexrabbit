import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Adjust path as needed
import { Stack } from 'expo-router';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null; // Assuming you have a bio field
  // Add other fields you might want to display
};

const UserProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!userId) {
      Alert.alert("Error", "User ID not found.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio') // Select desired fields
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data) {
          setProfile(data);
        } else {
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", `Failed to fetch profile: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found.</Text>
      </View>
    );
  }

  const avatarUrl = profile.avatar_url || 'https://placehold.co/150x150/e1f0ff/333333?text=Usr';

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: profile.full_name || 'User Profile' }} />
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{profile.full_name || 'No Name'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bio}>{profile.bio || 'No bio available.'}</Text>
      </View>

      {/* Add more sections here for posts, groups, etc. later */}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

export default UserProfileScreen;
