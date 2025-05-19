import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
// Import types from useFriends but exclude the ones we'll redefine
import { useFriends } from '../../../hooks/useFriends';

// Import the mock friend type
import type { FriendWithProfile as MockFriendWithProfile } from '../../../lib/__mocks__/friends';

// Define our own FriendCategory type that doesn't include 'all'
type FriendCategory = 'friend' | 'provider' | 'family';

// Define our local FriendWithProfile type
type FriendWithProfile = {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  category: FriendCategory;  // Always a valid category, defaults to 'friend'
  relationship_id: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  friend_id: string;
  friend_name: string | null;
  friend_avatar: string | null;
  requester_id: string;
  addressee_id: string;
  created_at?: string;
  updated_at?: string;
};

// Type guard to check if an object matches our FriendWithProfile type
function isFriendWithProfile(friend: any): friend is FriendWithProfile {
  return (
    friend &&
    typeof friend.id === 'string' &&
    ['pending', 'accepted', 'rejected'].includes(friend.status) &&
    ['friend', 'provider', 'family', 'all'].includes(friend.category) &&
    typeof friend.relationship_id === 'string' &&
    typeof friend.user_id === 'string' &&
    (friend.user_name === null || typeof friend.user_name === 'string') &&
    (friend.user_avatar === null || typeof friend.user_avatar === 'string') &&
    typeof friend.friend_id === 'string' &&
    (friend.friend_name === null || typeof friend.friend_name === 'string') &&
    (friend.friend_avatar === null || typeof friend.friend_avatar === 'string') &&
    typeof friend.requester_id === 'string' &&
    typeof friend.addressee_id === 'string'
  );
}

// Function to transform any friend object to our FriendWithProfile type
function toFriendWithProfile(friend: any): FriendWithProfile {
  // Default to 'friend' if category is null or invalid
  const category = (friend.category && ['friend', 'provider', 'family'].includes(friend.category))
    ? friend.category as FriendCategory
    : 'friend';

  return {
    id: friend.id || '',
    status: ['pending', 'accepted', 'rejected'].includes(friend.status) 
      ? friend.status as 'pending' | 'accepted' | 'rejected' 
      : 'pending', // Default to 'pending' if status is invalid
    category,
    relationship_id: friend.relationship_id || '',
    user_id: friend.user_id || '',
    user_name: friend.user_name || null,
    user_avatar: friend.user_avatar || null,
    friend_id: friend.friend_id || '',
    friend_name: friend.friend_name || null,
    friend_avatar: friend.friend_avatar || null,
    requester_id: friend.requester_id || '',
    addressee_id: friend.addressee_id || '',
    created_at: friend.created_at,
    updated_at: friend.updated_at
  };
}
import { User, ChevronRight, UserPlus, AlertCircle, MoreVertical, Check, MessageCircle, UserMinus, ChevronDown } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import { Menu, Provider as PaperProvider } from 'react-native-paper';

const styles = StyleSheet.create({
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  friendCategory: {
    fontSize: 14,
    color: '#666',
  },
  friendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  container: { flex: 1, backgroundColor: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyStateIcon: { marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  emptyStateText: { fontSize: 15, color: '#666', marginBottom: 16, textAlign: 'center' },
  findFriendsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginTop: 12 },
  findFriendsButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#4F46E5' },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#EF4444', marginTop: 12 },
  errorStateText: { color: '#EF4444', fontSize: 15, marginVertical: 8, textAlign: 'center' },
  retryButton: { backgroundColor: '#4F46E5', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 20, marginTop: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 32 },
  requestsSection: { backgroundColor: '#F9FAFB', borderRadius: 8, margin: 16, padding: 12 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#222' },
  categoryTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#4F46E5' },
  categoryTabText: { fontSize: 15, color: '#666' },
  activeTabText: { color: '#4F46E5', fontWeight: 'bold' },
  requestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  requestHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  requestActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  acceptButton: { backgroundColor: '#22C55E', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  acceptButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  rejectButton: { backgroundColor: '#EF4444', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  rejectButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  // --- ADDED/MISSING STYLES ---
  requestInfo: { flex: 1, marginLeft: 10 },
  requestName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  requestText: { fontSize: 14, color: '#666' },
  categoryTabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, marginHorizontal: 16, marginTop: 12 },
  removeButton: {
    backgroundColor: '#4F46E5', // Blue background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff', // White text
    fontSize: 14,
  },
  modalOverlay: { // Style for semi-transparent background
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: { // Style for modal container
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000', // Black text
  },
  modalButton: {
    backgroundColor: '#eee', // Light grey button background
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000', // Black text
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc', // Darker grey for cancel
    marginTop: 5, 
  },
  cancelButtonText: {
     color: '#000', // Black text
  },
  categoryContainer: { // Style for category text + icon container
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2, // Add some space below name
  },
});

interface FriendsScreenProps {}

interface SelectedFriendData {
  relationship_id: string;
  friend_id: string;
  friend_name: string;
  category: FriendCategory | 'all' | null;  // Include 'all' as a possible value
}

export default function FriendsScreen({}: FriendsScreenProps) {
  // Define a type for the filter category that includes 'all'
  type FilterCategory = FriendCategory | 'all';
  
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Local state to track friends list
  const [localFriends, setLocalFriends] = useState<FriendWithProfile[]>([]);
  
  // Refs
  const initialLoadRef = useRef(true);
  
  // Only initialize filter from params on first mount
  const hasInitializedFilter = useRef(false);
  useEffect(() => {
    if (!hasInitializedFilter.current) {
      if (params?.category) {
        // Only set the active category if it's a valid FriendCategory
        const category = params.category as string;
        if (['friend', 'provider', 'family', 'all'].includes(category)) {
          setActiveCategory(category as FilterCategory);
        } else {
          setActiveCategory('all');
        }
      } else {
        setActiveCategory('all');
      }
      hasInitializedFilter.current = true;
    }
  }, [params]);
  
  // Store the current filter in a ref to avoid dependency issues
  const currentFilterRef = useRef<FilterCategory>(activeCategory);
  
  // Keep the ref in sync with state
  useEffect(() => {
    currentFilterRef.current = activeCategory;
  }, [activeCategory]);

  const {
    friends: fetchedFriends,
    incomingPendingRequests,
    loading,
    error,
    refreshing,
    onRefresh,
    respondToFriendRequest,
    fetchFriends,
    removeFriend,
    updateFriendCategory,
  } = useFriends();

  // Update local friends when fetchedFriends changes
  useEffect(() => {
    const transformedFriends = fetchedFriends.map(friend => toFriendWithProfile(friend));
    setLocalFriends(transformedFriends);
  }, [fetchedFriends]);
  
  // Fetch friends on initial load
  useEffect(() => {
    if (initialLoadRef.current) {
      fetchFriends();
      initialLoadRef.current = false;
    }
  }, [fetchFriends]);
  
  // Filter friends based on the active category
  const filteredFriends = useMemo(() => {
    if (activeCategory === 'all') {
      return localFriends;
    }
    return localFriends.filter(friend => {
      // Default to 'friend' if category is null
      const category = friend.category || 'friend';
      return category === activeCategory;
    });
  }, [localFriends, activeCategory]);
  
  // Debug log filtered results
  if (typeof window !== 'undefined') {
    console.log(`[DEBUG] Filtered ${filteredFriends.length} friends for category '${activeCategory}'`);
  }

  // Handle category change
  const handleCategoryChange = useCallback((category: FilterCategory) => {
    console.log('[DEBUG] Changing category to:', category);
    setActiveCategory(category);
    
    // Update the URL to reflect the current filter
    const newParams = new URLSearchParams(window.location.search);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Navigate to friend profile with enhanced error handling
  const goToFriendDetail = (friendId: string | undefined | null) => {
    console.log('[DEBUG 6] Navigating to friend detail with friendId:', friendId, typeof friendId);
    
    // Enhanced defensive check for friendId
    if (!friendId || friendId === '' || friendId === 'undefined' || typeof friendId !== 'string') {
      console.warn('[fetchFriendDetail] Called with undefined or empty friendId:', friendId);
      Alert.alert('Error', 'Unable to open friend profile. Invalid friend ID.');
      return;
    }
    
    // Ensure we're passing a clean, trimmed ID
    const cleanId = friendId.trim();
    console.log('[goToFriendDetail] Navigating to clean ID:', cleanId);
    
    router.push({
      pathname: '/profile/[id]',
      params: { id: cleanId }
    });
  };

  const handleChat = (friendId: string, fullName: string) => {
    router.push(`/chat/new?friendId=${friendId}&name=${encodeURIComponent(fullName)}`);
  };

  const handleAcceptRequest = (requestId: string) => {
    Alert.alert(
      'Accept Friend Request',
      'Are you sure you want to accept this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            const result = await respondToFriendRequest(requestId, true);
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const handleRejectRequest = (requestId: string) => {
    Alert.alert(
      'Reject Friend Request',
      'Are you sure you want to reject this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            const result = await respondToFriendRequest(requestId, false);
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const [showFindFriends, setShowFindFriends] = useState(false);
  const [findFriendsLoading, setFindFriendsLoading] = useState(false);
  const [findFriendsError, setFindFriendsError] = useState<string|null>(null);
  const [findFriendsResults, setFindFriendsResults] = useState<any[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const handleShowFindFriends = async () => {
    setShowFindFriends(true);
    setFindFriendsLoading(true);
    setFindFriendsError(null);
    try {
      // Fetch all users except current user and existing friends
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, role')
        .neq('id', user?.id || 'no-user-id');
      if (error) throw error;
      // Filter out already-friends
      const friendIds = localFriends.map((f: FriendWithProfile) => f.friend_id);
      const filtered = (users || []).filter((u: {id: string}) => !friendIds.includes(u.id));
      setFindFriendsResults(filtered);
    } catch (e: any) {
      setFindFriendsError(e.message || 'Failed to load users');
    } finally {
      setFindFriendsLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    const result = await respondToFriendRequest(friendId, true);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setPendingIds(prev => [...prev, friendId]);
      Alert.alert('Success', 'Friend request sent!');
    }
  };

  // State for category change modal
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<SelectedFriendData | null>(null);

  // Function to open category change modal
  const openCategoryModal = (friend: any) => { 
    if (friend && friend.relationship_id && friend.friend_name && friend.friend_id) { 
       setSelectedFriend({
        relationship_id: friend.relationship_id,
        friend_id: friend.friend_id,
        friend_name: friend.friend_name,
        category: friend.category
      });
      setIsCategoryModalVisible(true);
    } else {
      console.error("Cannot open category modal: Missing friend data", friend);
      Alert.alert("Error", "Could not load friend details for category change.");
    }
  };

  // Handle category update
  const handleUpdateCategory = async (newCategory: FriendCategory | 'all') => {
    // If 'all' is passed, default to 'friend' since 'all' is not a valid category
    const categoryToSet = newCategory === 'all' ? 'friend' : newCategory;
    
    if (!selectedFriend) {
      Alert.alert('Error', 'No friend selected');
      setIsCategoryModalVisible(false);
      return;
    }

    // Store the current category for potential rollback
    const previousCategory = selectedFriend.category || 'friend';
    
    // Close the modal immediately for better UX
    setIsCategoryModalVisible(false);
    
    // Update the selected friend's category immediately for better UX
    setLocalFriends(prevFriends => 
      prevFriends.map(friend => 
        friend.relationship_id === selectedFriend.relationship_id
          ? { ...friend, category: categoryToSet as FriendCategory }
          : friend
      )
    );
    
    // Clear the selected friend
    setSelectedFriend(null);
    
    try {
      // Update the category in the database
      const result = await updateFriendCategory(selectedFriend.relationship_id, categoryToSet);
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // If we're currently filtered by the old category, update the filter
      if (currentFilterRef.current === previousCategory) {
        setActiveCategory(categoryToSet as FilterCategory);
      }
    } catch (e) {
      console.error('Error updating category:', e);
      
      // Revert the UI change if the update fails
      setLocalFriends(prevFriends => 
        prevFriends.map(friend => 
          friend.relationship_id === selectedFriend.relationship_id
            ? { ...friend, category: previousCategory as FriendCategory }
            : friend
        )
      );
      
      Alert.alert('Error', `Failed to update category: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleRemoveFriend = async (relationshipId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    const result = await removeFriend(relationshipId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
    // No need for success alert, list will refresh
    return result;
  };

const renderRequestItem = ({ item }: { item: any }) => {
  console.log('[DEBUG 5] Rendering friend request:', item);
  return (
    <View style={styles.requestItem}>
      <TouchableOpacity
        style={styles.requestItem}
        activeOpacity={0.85}
      >
        <View style={styles.avatarContainer}>
          {item.friend_avatar ? (
            <Image source={{ uri: item.friend_avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={24} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.friend_name || 'Unknown'}</Text>
          <Text style={styles.requestText}>Sent you a friend request</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Render each friend item for FlatList
const renderFriendItem = ({ item }: { item: any }) => {
  console.log('[DEBUG 2] Rendering friend item:', item);
  // Ensure we have a valid friend_id - defensive programming
  const friendId = item?.friend_id || null;
  
  return (
    <View style={styles.friendItemRow}>
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => {
          console.log('[DEBUG 4] Friend card pressed:', item);
          goToFriendDetail(friendId);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.avatarContainer}>
          {item.friend_avatar ? (
            <Image source={{ uri: item.friend_avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={24} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.friend_name || 'Unknown'}</Text>
          <TouchableOpacity
            style={styles.categoryContainer}
            onPress={() => openCategoryModal(item)}
          >
            <Text style={styles.friendCategory}>{item.category || 'friend'}</Text>
            <ChevronDown size={16} color="#000000" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
        <View style={styles.friendActions}>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => handleChat(item.friend_id, item.friend_name)}
            accessibilityLabel={`Chat with ${item.friend_name}`}
          >
            <MessageCircle size={22} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.removeButton, { marginLeft: 8 }]}
            onPress={() => {
              Alert.alert(
                'Remove Friend',
                `Are you sure you want to remove ${item.friend_name || 'this friend'}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                      const result = await handleRemoveFriend(item.relationship_id);
                      if (result?.error) {
                        Alert.alert('Error', result.error);
                      }
                    },
                  },
                ]
              );
            }}
            accessibilityLabel={`Remove ${item.friend_name}`}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Render category tabs
const renderCategoryTabs = () => (
  <View style={styles.categoryTabs}>
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory === 'all' && styles.activeTab
      ]}
      onPress={() => handleCategoryChange('all')}
    >
      <Text
        style={[
          styles.categoryTabText,
          activeCategory === 'all' && styles.activeTabText
        ]}
      >
        All
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory === 'friend' && styles.activeTab
      ]}
      onPress={() => handleCategoryChange('friend')}
    >
      <Text
        style={[
          styles.categoryTabText,
          activeCategory === 'friend' && styles.activeTabText
        ]}
      >
        Friends
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory === 'provider' && styles.activeTab
      ]}
      onPress={() => handleCategoryChange('provider')}
    >
      <Text
        style={[
          styles.categoryTabText,
          activeCategory === 'provider' && styles.activeTabText
        ]}
      >
        Providers
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory === 'family' && styles.activeTab
      ]}
      onPress={() => handleCategoryChange('family')}
    >
      <Text
        style={[
          styles.categoryTabText,
          activeCategory === 'family' && styles.activeTabText
        ]}
      >
        Family
      </Text>
    </TouchableOpacity>
  </View>
);

// Render empty state
const renderEmptyState = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIcon}>
      <User size={48} color="#6B7280" />
    </View>
    <Text style={styles.emptyStateTitle}>No friends yet</Text>
    <Text style={styles.emptyStateText}>
      Start connecting with friends, family, and service providers
    </Text>
    <TouchableOpacity
      style={styles.findFriendsButton}
      onPress={handleShowFindFriends}
    >
      <UserPlus size={22} color="#000000" />
      <Text style={styles.findFriendsButtonText}>Find People</Text>
    </TouchableOpacity>
  </View>
);

// Main render
return (
  <PaperProvider>
    <View style={styles.container}>
    <AppHeader 
      title="Friends" 
      showBackButton={true} 
      onBackPress={() => router.push('/(tabs)/profile' as any)} 
    />

    {/* Find Friends Button and Inline Panel */}
    <View style={{padding:16, backgroundColor:'#fff'}}>
      <TouchableOpacity 
        style={styles.findFriendsButton}
        onPress={handleShowFindFriends}
      >
        <UserPlus size={22} color="#000000" />
        <Text style={styles.findFriendsButtonText}>Find People</Text>
      </TouchableOpacity>
      {showFindFriends && (
  <View style={{marginTop:16, backgroundColor:'#fff', borderRadius:8, padding:8, elevation:2}}>
    {findFriendsLoading ? (
      <ActivityIndicator size="small" color="#4F46E5" />
    ) : findFriendsError ? (
      <Text style={{color:'#EF4444'}}>{findFriendsError}</Text>
    ) : (
      <FlatList
        data={findFriendsResults}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={{flexDirection:'row',alignItems:'center',paddingVertical:6}}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={{width:32,height:32,borderRadius:16,backgroundColor:'#eee',marginRight:8}} />
            ) : (
              <View style={{width:32,height:32,borderRadius:16,backgroundColor:'#9CA3AF',justifyContent:'center',alignItems:'center',marginRight:8}}>
                <User size={16} color="#fff" />
              </View>
            )}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{fontSize:15,color:'#222'}} numberOfLines={1}>{item.full_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={()=>handleChat(item.id, item.full_name)} 
                style={{padding: 4, marginRight: 6}}
              >
                <MessageCircle size={22} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={pendingIds.includes(item.id)}
                style={{backgroundColor:pendingIds.includes(item.id)?'#D1D5DB':'#4F46E5',borderRadius:6,paddingVertical:4,paddingHorizontal:10}}
                onPress={()=>handleSendRequest(item.id)}
              >
                <View>
                  <Text style={{color:'#fff',fontSize:13}}>{pendingIds.includes(item.id)?'Pending':'Add'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={()=> <View style={{height:1,backgroundColor:'#F3F4F6'}} />} 
        style={{maxHeight:260}}
      />
    )}
  </View>
)}
      </View>

      {/* Category Filter */}
      {renderCategoryTabs()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorStateTitle}>Something went wrong</Text>
          <Text style={styles.errorStateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => onRefresh()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item, index) => {
            // Robust key extraction with multiple fallbacks
            const key = item?.relationship_id?.toString() || 
                       item?.id?.toString() || 
                       item?.friend_id?.toString() || 
                       `friend-${index}`;
            console.log('[DEBUG 3] FlatList keyExtractor:', key, item);
            return key;
          }}
          renderItem={renderFriendItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            incomingPendingRequests.length > 0 ? (
              <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                {incomingPendingRequests.map((request, idx) => {
                  console.log('[DEBUG 5] Rendering friend request:', request, 'Key:', request.id || request.relationship_id || idx);
                  return (
                    <View key={request.id || request.relationship_id || `request-${idx}`}>
                      {renderRequestItem({ item: request })}
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>

    {/* Category Change Modal */}
    <Modal
      animationType="fade"
      transparent={true}
      visible={isCategoryModalVisible}
      onRequestClose={() => {
        setIsCategoryModalVisible(!isCategoryModalVisible);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Category for {selectedFriend?.friend_name}</Text>
          {/* Placeholder for Category Options */}
          <TouchableOpacity style={styles.modalButton} onPress={() => handleUpdateCategory('friend')}>
            <Text style={styles.modalButtonText}>Friend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => handleUpdateCategory('provider')}>
            <Text style={styles.modalButtonText}>Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => handleUpdateCategory('family')}>
            <Text style={styles.modalButtonText}>Family</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={() => setIsCategoryModalVisible(false)}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </PaperProvider>
  );
}
