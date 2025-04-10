import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mockFriends, FriendWithProfile } from '../lib/__mocks__/friends';
import { useAuth } from '../providers/AuthProvider';

export type FriendCategory = 'all' | 'friend' | 'provider' | 'family';

export const useFriends = (category: FriendCategory = 'all') => {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
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
      const { data, error } = await supabase
        .from('friendships_with_profiles')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) {
        console.error('Error fetching friends:', error.message);
        throw error;
      }

      console.log('fetchFriends: Raw data from database:', data?.length || 0, 'records');

      // Process the returned data
      const acceptedFriends: FriendWithProfile[] = [];
      const pendingFriendRequests: FriendWithProfile[] = [];

      // Normalize data to always have the current user as user_id and the friend as friend_id
      const processedData = data?.map(item => {
        if (item.user_id === userId) {
          return item; // Already in the correct format
        } else {
          // Swap user and friend data for friendships where the current user is the friend
          return {
            ...item,
            user_id: item.friend_id,
            friend_id: item.user_id,
            friend_name: item.user_name,
            friend_avatar: item.user_avatar,
            friend_role: item.friend_role || 'participant', // Keep original role or use default
            user_name: item.friend_name,
            user_avatar: item.friend_avatar
          };
        }
      }) || [];

      console.log('fetchFriends: Processed data:', processedData.length, 'records');
      
      // Split into accepted friends and pending requests
      processedData.forEach(friend => {
        if (friend.status === 'accepted') {
          acceptedFriends.push(friend);
        } else if (friend.status === 'pending') {
          pendingFriendRequests.push(friend);
        }
      });

      console.log('fetchFriends: Accepted friends:', acceptedFriends.length, 'Pending requests:', pendingFriendRequests.length);
      
      setFriends(acceptedFriends);
      setPendingRequests(pendingFriendRequests);
    } catch (e: unknown) {
      console.error('Error fetching friends:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      const currentUserMockFriends = mockFriends.map(friend => ({
        ...friend,
        user_id: userId || 'current-user-id'
      }));
      
      // Filter the mock data the same way we would real data
      const acceptedMockFriends = currentUserMockFriends.filter(f => f.status === 'accepted');
      const pendingMockRequests = currentUserMockFriends.filter(f => f.status === 'pending');
      
      console.log('fetchFriends: Using mock data -', acceptedMockFriends.length, 'friends');
      
      setFriends(acceptedMockFriends);
      setPendingRequests(pendingMockRequests);
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
  const sendFriendRequest = async (friendId: string, category: string = 'friend') => {
    if (!userId) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: userId,
            friend_id: friendId,
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
  const respondToFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      if (accept) {
        // Accept the friend request
        const { data, error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);

        if (error) throw error;
      } else {
        // Reject the friend request (delete it)
        const { data, error } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);

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
  const changeFriendCategory = async (friendshipId: string, newCategory: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .update({ category: newCategory })
        .eq('id', friendshipId);

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
  const removeFriend = async (friendshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

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
    pendingRequests,
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
