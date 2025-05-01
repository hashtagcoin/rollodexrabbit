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
import { MessageCircle } from 'lucide-react-native';
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
  const [pendingOutgoing, setPendingOutgoing] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Fetch all relationships for this user
      const { data: rels, error: relsError } = await supabase
        .from('friendships_with_profiles')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (relsError) {
        setLoading(false);
        return;
      }
      // Build maps for quick lookup
      const acceptedIds = new Set<string>();
      const outgoingPendingIds = new Set<string>();
      const incomingPendingIds = new Set<string>();
      rels.forEach((rel: any) => {
        if (rel.status === 'accepted') {
          const friendId = rel.requester_id === user.id ? rel.addressee_id : rel.requester_id;
          acceptedIds.add(friendId);
        } else if (rel.status === 'pending') {
          if (rel.requester_id === user.id) {
            outgoingPendingIds.add(rel.addressee_id);
          } else if (rel.addressee_id === user.id) {
            incomingPendingIds.add(rel.requester_id);
          }
        }
      });
      setPendingOutgoing(Array.from(outgoingPendingIds));
      // Fetch all users not current and not already friends
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id);
      if (!usersError && usersData) {
        // Filter out accepted friends
        const filtered = usersData.filter((u: any) => !acceptedIds.has(u.id));
        setUsers(filtered);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleAddFriend = async (userId: string) => {
    // Always fetch authenticated user's id directly
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert('You must be logged in to send friend requests.');
      return;
    }
    const requesterId = user.id;
    const { error } = await supabase
      .from('user_relationships')
      .insert({ requester_id: requesterId, addressee_id: userId, status: 'pending' });
    if (error) {
      alert('Failed to send friend request: ' + error.message);
      console.error('Error sending friend request:', error);
    } else {
      setPendingOutgoing((prev) => [...prev, userId]);
    }
  };


  const handleChat = (userId: string) => {
    // Implement chat logic here
    // For now, just log
    console.log('Chat with', userId);
  };

  const renderItem = ({ item }: { item: Profile }) => {
    const isRequested = pendingOutgoing.includes(item.id);
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.full_name) }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{item.full_name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.friendButton, isRequested && styles.friendButtonDisabled]}
            onPress={() => handleAddFriend(item.id)}
            disabled={isRequested}
          >
            <Text style={[styles.friendButtonText, isRequested && styles.friendButtonTextDisabled]}>
              {isRequested ? 'Requested' : 'Add Friend'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleChat(item.id)}>
            <MessageCircle size={26} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
  friendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
  },
  friendButtonDisabled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  friendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendButtonTextDisabled: {
    color: '#fff',
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
