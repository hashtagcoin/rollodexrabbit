console.log('--- app/profile/friends/find.tsx file executing ---');

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { MessageCircle } from 'lucide-react-native'; 
import AppHeader from '../../../components/AppHeader';

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

const FindFriendsScreen = () => { 
  console.log('[ProfileFindFriends] Component rendering...');

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingOutgoing, setPendingOutgoing] = useState<string[]>([]); 

  useEffect(() => {
    console.log('[ProfileFindFriends] useEffect triggered.');
    async function fetchUsers() {
      setLoading(true);
      console.log('[ProfileFindFriends] Fetching current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[ProfileFindFriends] No logged-in user found.');
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);
      console.log('[ProfileFindFriends] Current user ID:', user.id);

      console.log('[ProfileFindFriends] Fetching relationships from friendships_with_profiles...');
      const { data: rels, error: relsError } = await supabase
        .from('friendships_with_profiles') 
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      console.log('[ProfileFindFriends] Raw relationships data:', rels);
      console.log('[ProfileFindFriends] Relationships fetch error (if any):', relsError);
        
      if (relsError) {
        console.error('Error fetching relationships:', relsError);
      }
      
      const acceptedIds = new Set<string>();
      const outgoingPendingIds = new Set<string>();
      (rels || []).forEach((rel: any) => {
        if (rel.status === 'accepted') {
          const friendId = rel.requester_id === user.id ? rel.addressee_id : rel.requester_id;
          acceptedIds.add(friendId);
        } else if (rel.status === 'pending') {
          if (rel.requester_id === user.id) {
            outgoingPendingIds.add(rel.addressee_id);
          } 
        }
      });
      console.log('[ProfileFindFriends] Accepted friend IDs:', acceptedIds);
      console.log('[ProfileFindFriends] Outgoing pending IDs:', outgoingPendingIds);
      setPendingOutgoing(Array.from(outgoingPendingIds)); 

      console.log('[ProfileFindFriends] Fetching potential friends from user_profiles...');
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id); 
        
      console.log('[ProfileFindFriends] Raw fetched users data:', usersData);
      console.log('[ProfileFindFriends] Users fetch error (if any):', usersError);

      if (usersError) {
          console.error('Error fetching users:', usersError);
      } else if (usersData) {
          const filteredUsers = usersData.filter((u: Profile) => !acceptedIds.has(u.id));
          console.log('[ProfileFindFriends] Setting users state with filtered list (excluding accepted):', filteredUsers);
          setUsers(filteredUsers);
      } else {
          setUsers([]); 
      }

      setLoading(false);
      console.log('[ProfileFindFriends] Loading set to false.');
    }

    fetchUsers();
  }, []); 

  const handleAddFriend = async (addresseeId: string) => {
    console.log(`[ProfileFindFriends] handleAddFriend called for: ${addresseeId}`);
    if (!currentUserId) { 
        Alert.alert('Error', 'Could not identify current user.');
        console.error('[ProfileFindFriends] handleAddFriend: currentUserId is null.');
        return;
    }
    const requesterId = currentUserId;
    
    setPendingOutgoing(prev => [...prev, addresseeId]);

    try {
      console.log(`[ProfileFindFriends] Inserting relationship: ${requesterId} -> ${addresseeId}`);
      const { error } = await supabase
        .from('user_relationships') 
        .insert({ 
          requester_id: requesterId, 
          addressee_id: addresseeId, 
          status: 'pending' 
        });

      if (error) {
        console.error('[ProfileFindFriends] Error sending friend request:', error);
        setPendingOutgoing(prev => prev.filter(id => id !== addresseeId));
        Alert.alert('Error', 'Failed to send friend request: ' + error.message);
      } else {
        console.log('[ProfileFindFriends] Friend request sent successfully.');
        Alert.alert('Success', 'Friend request sent!');
      }
    } catch (error: any) { 
        console.error('[ProfileFindFriends] Unexpected error in handleAddFriend:', error);
        setPendingOutgoing(prev => prev.filter(id => id !== addresseeId)); 
        Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const renderItem = ({ item }: { item: Profile }) => {
    console.log('[ProfileFindFriends] Rendering item:', item);
    const isPending = pendingOutgoing.includes(item.id);

    const avatarUri = item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || 'NA')}&background=random`;

    return (
      <View style={styles.card}> 
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{item.full_name || 'Unknown User'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.friendButton, isPending && styles.friendButtonDisabled]}
            onPress={() => handleAddFriend(item.id)} 
            disabled={isPending}
          >
            <Text style={[styles.friendButtonText, isPending && styles.friendButtonTextDisabled]}>
              {isPending ? 'Requested' : 'Add'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Chat with', item.id)}> 
             <MessageCircle size={26} color="#007AFF" /> 
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  console.log('[ProfileFindFriends] Current loading state:', loading);
  console.log('[ProfileFindFriends] Current users state (count):', users.length);

  return (
    <View style={styles.container}> 
      <AppHeader /> 
      <Text style={styles.header}>Find New Friends</Text> 
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>No new users found.</Text>} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remove paddingHorizontal and paddingTop if AppHeader handles spacing
    // paddingHorizontal: 16, 
    // paddingTop: 20, 
  },
  header: {
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 20, 
    color: '#222',
    textAlign: 'center', 
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12, 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  avatar: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 12, 
    backgroundColor: '#e1e4ea',
  },
  name: {
    flex: 1,
    fontSize: 16, 
    fontWeight: '600',
    color: '#222',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, 
  },
  friendButton: {
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    backgroundColor: '#007AFF',
    borderRadius: 20, 
  },
  friendButtonDisabled: {
    backgroundColor: '#b0c4de', 
  },
  friendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  friendButtonTextDisabled: {
    color: '#f0f0f0', 
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default FindFriendsScreen;
