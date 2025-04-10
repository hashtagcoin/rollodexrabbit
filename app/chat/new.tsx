import { useState, useEffect } from 'react';
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
import { supabase } from '../../lib/supabase';
import { useConversations } from '../../hooks/useChat';
import { mockSearchUsers } from '../../lib/__mocks__/friends';
import { User, Search, ArrowLeft, Check, X } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import AppHeader from '../../components/AppHeader';

interface UserProfile {
  id: string;
  full_name: string;
  username?: string;
  avatar_url: string | null;
  role: string | null;
  selected?: boolean;
}

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createConversation } = useConversations();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  // Search for users based on query
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Search for users where name or username contains the query
      // Exclude the current user and already selected users from results
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, role')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', userId);

      if (error) throw error;

      // Filter out already selected users
      const selectedIds = selectedUsers.map(user => user.id);
      const filteredResults = (data || []).filter(user => !selectedIds.includes(user.id));
      
      setSearchResults(filteredResults);
    } catch (e: unknown) {
      console.error('Error searching users:', e instanceof Error ? e.message : 'Unknown error');
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      
      // Use mock data as fallback
      const mockResults = mockSearchUsers(query);
      // Filter out already selected users
      const selectedIds = selectedUsers.map(user => user.id);
      const filteredMockResults = mockResults.filter(user => !selectedIds.includes(user.id));
      
      setSearchResults(filteredMockResults);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (user: UserProfile) => {
    const isAlreadySelected = selectedUsers.some(u => u.id === user.id);
    
    if (isAlreadySelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Remove selected user
  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Create new conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user to chat with.');
      return;
    }

    setCreating(true);
    
    try {
      const participantIds = selectedUsers.map(user => user.id);
      const result = await createConversation(participantIds);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        // Navigate to the new conversation
        const conversationId = result.data?.conversationId;
        router.push(`/chat/${conversationId}` as any);
      }
    } catch (e) {
      console.error('Error creating conversation:', e);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Render search results
  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isSelected = selectedUsers.some(user => user.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item)}
      >
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
        <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="#ffffff" />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render selected users
  const renderSelectedUser = ({ item }: { item: UserProfile }) => (
    <View style={styles.selectedChip}>
      <Text style={styles.selectedChipText} numberOfLines={1}>
        {item.full_name}
      </Text>
      <TouchableOpacity onPress={() => removeSelectedUser(item.id)}>
        <X size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={60} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>Search for people</Text>
      <Text style={styles.emptyStateText}>
        Find friends, providers, or family members to start a conversation with.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title="New Conversation" 
        showBackButton={true} 
        onBackPress={() => router.push('/(tabs)/chat' as any)} 
      />

      <View style={styles.content}>
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

        {selectedUsers.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedLabel}>Selected ({selectedUsers.length}):</Text>
            <FlatList
              data={selectedUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderSelectedUser}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedList}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => searchUsers(searchQuery)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ListEmptyComponent={renderEmptyState()}
            contentContainerStyle={styles.listContent}
          />
        )}

        {selectedUsers.length > 0 && (
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateConversation}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Start Conversation</Text>
              )}
            </TouchableOpacity>
          </View>
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
  headerButton: {
    marginRight: 16,
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
  selectedContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  selectedList: {
    paddingRight: 12,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: {
    fontSize: 14,
    color: '#4F46E5',
    marginRight: 4,
    maxWidth: 100,
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
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorText: {
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
  selectedUserItem: {
    backgroundColor: '#F5F3FF',
    borderColor: '#818CF8',
    borderWidth: 1,
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
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
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
  createButtonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
