import { useState, useCallback, useEffect } from 'react';
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
import { useFriends, FriendCategory } from '../../../hooks/useFriends';
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
  category: FriendCategory | null;
}

export default function FriendsScreen({}: FriendsScreenProps) {
  const [activeCategory, setActiveCategory] = useState<FriendCategory>('all');
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Initialize with category from params or default to 'all'
  useEffect(() => {
    const paramCategory = params.category as FriendCategory;
    if (paramCategory && ['all', 'friend', 'provider', 'family'].includes(paramCategory)) {
      setActiveCategory(paramCategory);
    }
  }, [params]);

  const {
    friends,
    incomingPendingRequests,
    loading,
    error,
    refreshing,
    onRefresh,
    respondToFriendRequest,
    removeFriend
  } = useFriends(activeCategory);

  const filteredFriends = friends.filter(friend => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'friend' && friend.friend_role === 'friend') return true;
    if (activeCategory === 'provider' && friend.friend_role === 'provider') return true;
    if (activeCategory === 'family' && friend.friend_role === 'family') return true;
    return false;
  });

  // Handle category change
  const handleCategoryChange = (category: FriendCategory) => {
    setActiveCategory(category);
  };

  // Navigate to friend profile
  const goToFriendDetail = (friendId: string) => {
    if (!friendId || friendId === '' || friendId === 'undefined') {
      console.warn('[goToFriendDetail] Attempted navigation with invalid friendId:', friendId);
      Alert.alert('Error', 'Unable to open friend profile. Invalid friend ID.');
      return;
    }
    router.push({
      pathname: '/profile/[id]',
      params: { id: friendId }
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
      const friendIds = friends.map(f => f.friend_id);
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
  const handleUpdateCategory = async (newCategory: FriendCategory) => {
    if (!selectedFriend || !user) {
      Alert.alert("Error", "Cannot update category. Friend or user data missing.");
      setIsCategoryModalVisible(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_relationships')
        .update({ category: newCategory })
        .eq('id', selectedFriend.relationship_id) 
        .eq('user_id', user.id); 

      if (error) {
        console.error('Error updating category:', error);
        Alert.alert('Error', `Could not update friend category: ${error.message}`);
      } else {
        // Optional: Success alert
        // Alert.alert('Success', `${selectedFriend.friend_name}'s category updated to ${newCategory}.`);
        refetchFriends(); 
      }
    } catch (e) {
      console.error('Exception updating category:', e);
      Alert.alert('Error', 'An unexpected error occurred while updating the category.');
    } finally {
      setIsCategoryModalVisible(false); 
      setSelectedFriend(null); 
    }
  };

  const handleRemoveFriend = async (relationshipId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    const result = await removeFriend(relationshipId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
    // No need for success alert, list will refresh
  };

  const renderFriendItem = ({ item }: { item: any }) => (
  <View style={styles.friendItemRow}>
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => goToFriendDetail(item.friend_id)}
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
        {/* Wrap category text and icon in TouchableOpacity */}
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
                    const result = await removeFriend(item.relationship_id);
                    if (result?.error) { 
                      Alert.alert('Error', result.error);
                    }
                    // No need for success alert, list will refresh
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

  // Render friend request item
  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
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
    </View>
  );

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
          keyExtractor={(item) => item.friend_id}
          renderItem={renderFriendItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            incomingPendingRequests.length > 0 ? (
              <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                {incomingPendingRequests.map((request) => (
                  <View key={request.id}>
                    {renderRequestItem({ item: request })}
                  </View>
                ))}
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
