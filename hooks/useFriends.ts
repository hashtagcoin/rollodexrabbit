import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mockFriends, FriendWithProfile } from '../lib/__mocks__/friends';
import { useAuth } from '../providers/AuthProvider';

export type FriendCategory = 'all' | 'friend' | 'provider' | 'family';

export const useFriends = (category: FriendCategory = 'all') => {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithProfile[]>([]);
  const [incomingPendingRequests, setIncomingPendingRequests] = useState<FriendWithProfile[]>([]);
  const [outgoingPendingRequests, setOutgoingPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const userId = user?.id;

  // Function to fetch friends from the database
  const fetchFriends = useCallback(async () => {
    if (!userId) {
      console.log('fetchFriends: No userId available, skipping fetch');
      setLoading(false);
      return;
    }

    console.log('fetchFriends: Fetching friends for userId:', userId);
    
    try {
      setLoading(true);
      setError(null);

      // Query the friendships_with_profiles view to get all friends with their profile info
      const { data: friendshipsData, error: friendshipError } = await supabase
        .from('friendships_with_profiles')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendshipError) {
        console.error('Error fetching friends:', friendshipError.message);
        throw friendshipError;
      }

      console.log('fetchFriends: Raw data from database:', friendshipsData?.length || 0, 'records');

      // Process the returned data
      const acceptedFriends: FriendWithProfile[] = [];
      const incomingPendingRequests: FriendWithProfile[] = [];
      const outgoingPendingRequests: FriendWithProfile[] = [];

      // Normalize data so 'user' always refers to the current user
      // and 'friend' refers to the other party in the relationship.
      // Assumes view provides: relationship_id, requester_id, addressee_id, status, category,
      // requester_name, requester_avatar, addressee_name, addressee_avatar
      const processedData = friendshipsData?.map((item: any) => {
        const userIsRequester = item.requester_id === userId;
        return {
          // Core relationship fields
          relationship_id: item.relationship_id, // Assuming this exists
          status: item.status,
          category: item.category,

          // Normalized user fields (current user)
          user_id: userId, // Always the current user's ID
          user_name: userIsRequester ? item.requester_name : item.addressee_name,
          user_avatar: userIsRequester ? item.requester_avatar : item.addressee_avatar,

          // Normalized friend fields (other user)
          friend_id: userIsRequester ? item.addressee_id : item.requester_id,
          friend_name: userIsRequester ? item.addressee_name : item.requester_name,
          friend_avatar: userIsRequester ? item.addressee_avatar : item.requester_avatar,
          // friend_role: ??? // Determine if needed based on category or other field

          // Include original directional IDs for splitting pending requests later
          requester_id: item.requester_id,
          addressee_id: item.addressee_id
        };
      }) || [];

      console.log('fetchFriends: Processed data:', processedData.length, 'records');
      
      // Split into accepted friends and pending requests (incoming/outgoing)
      processedData.forEach((friend: any) => {
        if (friend.status === 'accepted') {
          acceptedFriends.push(friend);
        } else if (friend.status === 'pending') {
          if (friend.addressee_id === userId) {
            incomingPendingRequests.push(friend);
          } else if (friend.requester_id === userId) {
            outgoingPendingRequests.push(friend);
          }
        }
      });

      setFriends(acceptedFriends);
      setIncomingPendingRequests(incomingPendingRequests);
      setOutgoingPendingRequests(outgoingPendingRequests);
    } catch (e: unknown) {
      console.error('Error fetching friends:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      // Add requester_id and addressee_id to mock data for type safety
      const currentUserMockFriends = mockFriends.map(friend => ({
        ...friend,
        user_id: userId || 'current-user-id',
        requester_id: friend.requester_id || userId || 'current-user-id',
        addressee_id: friend.addressee_id || friend.friend_id || 'mock-friend-id'
      }));
      
      // Filter the mock data the same way we would real data
      const acceptedMockFriends = currentUserMockFriends.filter(f => f.status === 'accepted');
      const incomingPendingMockRequests = currentUserMockFriends.filter(f => f.status === 'pending' && f.addressee_id === userId);
      const outgoingPendingMockRequests = currentUserMockFriends.filter(f => f.status === 'pending' && f.requester_id === userId);
      
      console.log('fetchFriends: Using mock data -', acceptedMockFriends.length, 'friends');
      
      setFriends(acceptedMockFriends);
      setIncomingPendingRequests(incomingPendingMockRequests);
      setOutgoingPendingRequests(outgoingPendingMockRequests);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Filter friends by category
  useEffect(() => {
    console.log('useFriends: Filtering by category:', category);
    
    if (category === 'all') {
      setFilteredFriends(friends);
    } else {
      setFilteredFriends(friends.filter(friend => friend.category === category));
    }
    
    console.log('useFriends: Filtered friends:', 
      category === 'all' ? friends.length : friends.filter(friend => friend.category === category).length);
  }, [friends, category]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      console.log('useFriends: User ID available, calling fetchFriends');
      fetchFriends();
    } else {
      console.log('useFriends: No user ID available yet');
    }
  }, [fetchFriends, userId]);

  // Function to send a friend request
  const sendFriendRequest = async (addresseeId: string, category: string = 'friend') => {
    if (!userId) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .insert([
          {
            requester_id: userId,
            addressee_id: addresseeId,
            status: 'pending',
            category
          }
        ]);

      if (error) throw error;

      // Refresh friends list after sending request
      fetchFriends();

      return { success: true };
    } catch (e: unknown) {
      console.error('Error sending friend request:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'Failed to send friend request' };
    }
  };

  // Function to respond to a friend request
  const respondToFriendRequest = async (relationshipId: string, accept: boolean) => {
    try {
      if (accept) {
        // Accept the friend request
        const { data, error } = await supabase
          .from('user_relationships')
          .update({ status: 'accepted' })
          .eq('user_relationships_id', relationshipId);

        if (error) throw error;
      } else {
        // Reject the friend request (delete it)
        const { data, error } = await supabase
          .from('user_relationships')
          .delete()
          .eq('user_relationships_id', relationshipId);

        if (error) throw error;
      }

      // Refresh friends list after response
      fetchFriends();

      return { success: true };
    } catch (e: unknown) {
      console.error('Error responding to friend request:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'Failed to respond to friend request' };
    }
  };

  // Function to change friend category
  const changeFriendCategory = async (relationshipId: string, newCategory: string) => {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .update({ category: newCategory })
        .eq('user_relationships_id', relationshipId);

      if (error) throw error;

      // Refresh friends list after category change
      fetchFriends();

      return { success: true };
    } catch (e: unknown) {
      console.error('Error changing friend category:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'Failed to change friend category' };
    }
  };

  // Function to remove a friend
  const removeFriend = async (relationshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('user_relationships_id', relationshipId);

      if (error) throw error;

      // Refresh friends list after removal
      fetchFriends();

      return { success: true };
    } catch (e: unknown) {
      console.error('Error removing friend:', e instanceof Error ? e.message : 'Unknown error');
      return { error: e instanceof Error ? e.message : 'Failed to remove friend' };
    }
  };

  // Function to handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends: filteredFriends, // Return filtered friends based on category
    incomingPendingRequests,
    outgoingPendingRequests,
    loading,
    error,
    refreshing,
    onRefresh,
    sendFriendRequest,
    respondToFriendRequest,
    changeFriendCategory,
    removeFriend
  };
};
