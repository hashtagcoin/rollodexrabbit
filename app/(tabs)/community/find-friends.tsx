import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { UserPlus, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

export default function FindFriendsScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Get friend IDs
      const { data: friendRows, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
      const friendIds = friendRows ? friendRows.map((row: any) => row.friend_id) : [];

      // Fetch all active users not current user and not already friends
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('is_active', true)
        .neq('id', user.id)
        .not('id', 'in', `(${friendIds.join(',') || ''})`);

      if (!usersError && usersData) {
        setUsers(usersData);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleAddFriend = (userId: string) => {
    // Implement add friend logic here
    // For now, just log
    console.log('Add friend', userId);
  };

  const handleChat = (userId: string) => {
    // Implement chat logic here
    // For now, just log
    console.log('Chat with', userId);
  };

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.full_name) }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{item.full_name}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleAddFriend(item.id)}>
          <UserPlus size={26} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleChat(item.id)}>
          <MessageCircle size={26} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Friends</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
    backgroundColor: '#e1e4ea',
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4fa',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
