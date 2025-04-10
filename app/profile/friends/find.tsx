import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useFriends } from '../../../hooks/useFriends';
import { mockSearchUsers } from '../../../lib/__mocks__/friends';
import { User, Search, UserPlus, X, Check } from 'lucide-react-native';
import { useAuth } from '../../../providers/AuthProvider';
import AppHeader from '../../../components/AppHeader';

interface User {
  id: string;
  full_name: string;
  username?: string;
  avatar_url: string | null;
  role: string | null;
}

export default function FindFriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const { sendFriendRequest } = useFriends();
  const router = useRouter();
  const { user } = useAuth();

  // Search for users based on query
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search for users where name or username contains the query
      // Exclude the current user from results
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, role')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', user?.id || 'no-user-id')
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (e: unknown) {
      console.error('Error searching users:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      const mockResults = mockSearchUsers(query);
      setSearchResults(mockResults);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if we already have friend requests pending with these users
  const checkPendingRequests = useCallback(async () => {
    if (!user?.id || searchResults.length === 0) return;

    try {
      // Get a list of friend IDs where a request is pending
      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id, user_id')
        .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      // Create a list of all user IDs that have pending requests
      const pendingUserIds = data?.reduce<string[]>((acc, item) => {
        if (item.user_id === user?.id) {
          acc.push(item.friend_id);
        } else {
          acc.push(item.user_id);
        }
        return acc;
      }, []) || [];

      setPendingIds(pendingUserIds);
    } catch (e: unknown) {
      console.error('Error checking pending requests:', e instanceof Error ? e.message : 'Unknown error');
      // Silently fail, we'll just not show the pending status
    }
  }, [user?.id, searchResults]);

  // When search results change, check for pending requests
  useEffect(() => {
    checkPendingRequests();
  }, [searchResults, checkPendingRequests]);

  // Handle sending a friend request
  const handleSendRequest = async (friendId: string) => {
    const result = await sendFriendRequest(friendId);
    
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      // Update the pending IDs list locally
      setPendingIds(prev => [...prev, friendId]);
      Alert.alert('Success', 'Friend request sent successfully!');
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Render each user in search results
  const renderUserItem = ({ item }: { item: User }) => {
    const isPending = pendingIds.includes(item.id);
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userAvatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={24} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          {item.username && (
            <Text style={styles.userUsername}>@{item.username}</Text>
          )}
          <Text style={styles.userRole}>{item.role || 'Participant'}</Text>
        </View>
        {isPending ? (
          <View style={styles.pendingButton}>
            <Check size={16} color="#6B7280" />
            <Text style={styles.pendingButtonText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(item.id)}
          >
            <UserPlus size={16} color="#ffffff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render empty search state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={60} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>Search for friends</Text>
      <Text style={styles.emptyStateText}>
        Enter a name or username to find friends to connect with.
      </Text>
    </View>
  );

  // Render no results state
  const renderNoResults = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No results found</Text>
      <Text style={styles.emptyStateText}>
        We couldn't find any users matching "{searchQuery}".
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Find Friends" 
        showBackButton={true} 
        onBackPress={() => router.push('/profile/friends' as any)} 
      />
      
      <View style={styles.content}>
        <Stack.Screen options={{ title: 'Find Friends' }} />
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => searchUsers(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => searchUsers(searchQuery)}
            disabled={searchQuery.trim().length < 2}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorStateTitle}>Something went wrong</Text>
            <Text style={styles.errorStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => searchUsers(searchQuery)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ListEmptyComponent={
              searchQuery.length > 0 ? renderNoResults() : renderEmptyState()
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  searchButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pendingButtonText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
