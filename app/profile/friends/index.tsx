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
  Alert
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useFriends, FriendCategory } from '../../../hooks/useFriends';
import { User, ChevronRight, UserPlus, AlertCircle } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

interface FriendsScreenProps {}

export default function FriendsScreen({}: FriendsScreenProps) {
  const [activeCategory, setActiveCategory] = useState<FriendCategory>('all');
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
    pendingRequests, 
    loading, 
    error, 
    refreshing, 
    onRefresh,
    respondToFriendRequest
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
    router.push(`/profile/friends/${friendId}`);
  };

  // Navigate to find friends screen
  const goToFindFriends = () => {
    router.push('/profile/friends/find');
  };

  // Handle responding to friend requests
  const handleAcceptRequest = (requestId: string) => {
    Alert.alert(
      'Accept Friend Request',
      'Are you sure you want to accept this friend request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
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
        {
          text: 'Cancel',
          style: 'cancel'
        },
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

  // Render friend item
  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => goToFriendDetail(item.id)}
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
        <Text style={styles.friendCategory}>{item.category || 'friend'}</Text>
      </View>
      <ChevronRight size={20} color="#6B7280" />
    </TouchableOpacity>
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
        onPress={goToFindFriends}
      >
        <UserPlus size={20} color="#ffffff" />
        <Text style={styles.findFriendsButtonText}>Find People</Text>
      </TouchableOpacity>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
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
  );

  console.log('FriendsScreen render - Friends count:', friends?.length || 0);
  console.log('FriendsScreen render - Pending requests:', pendingRequests?.length || 0);
  console.log('FriendsScreen render - Active category:', activeCategory);

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Friends" 
        showBackButton={true} 
        onBackPress={() => router.push('/(tabs)/profile' as any)} 
      />

      {/* Add Find Friends Button */}
      <View style={styles.headerButtonContainer}>
        <TouchableOpacity 
          style={styles.addFriendButton}
          onPress={goToFindFriends}
        >
          <UserPlus size={20} color="#ffffff" />
          <Text style={styles.addFriendButtonText}>Find Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {renderCategoryTabs()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            pendingRequests.length > 0 ? (
              <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                {pendingRequests.map((request) => (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTab: {
    paddingVertical: 16,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  categoryTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
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
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  friendCategory: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  requestsSection: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  requestItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestText: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rejectButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 32,
  },
  emptyStateIcon: {
    backgroundColor: '#F3F4F6',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 300,
  },
  findFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findFriendsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  headerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
  },
});
