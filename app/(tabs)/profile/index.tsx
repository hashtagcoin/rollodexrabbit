import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Settings, CreditCard as Edit, BadgeCheck, User as User2, LogOut, Users as CommunityIcon, Calendar, MessageSquare, Wallet, ChevronRight, Award, House, Heart, Wrench, FileCheck, UserPlus, Plus, Clock } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { RewardsService } from '../../../lib/rewardsService';
import { resetScrollPosition } from '../../../lib/navigationHelpers';
import { useFriends, FriendCategory } from '../../../hooks/useFriends';

const { width } = Dimensions.get('window');

type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  ndis_number: string | null;
  ndis_verified: boolean;
  comfort_traits: string[] | null;
  preferred_categories: string[] | null;
  role: string;
};

type HousingGroupMembership = {
  id: string; // housing_group_members ID
  status: 'pending' | 'approved';
  group: {
    id: string; // housing_groups ID
    name: string | null;
    description: string | null;
    listing: {
      title: string;
      media_urls: string[] | null;
    } | null;
  } | null;
};

type TabType = 'posts' | 'groups' | 'bookings' | 'friends';

export default function ProfileScreen() {
  const { newPost, postId } = useLocalSearchParams<{ newPost: string, postId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [housingGroups, setHousingGroups] = useState<HousingGroupMembership[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isProvider, setIsProvider] = useState(false);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const { 
    friends, 
    loading: friendsLoading, 
    error: friendsError, 
    refreshing: friendsRefreshing, 
    onRefresh: refreshFriends 
  } = useFriends('all');

  useEffect(() => {
    loadProfile();
  }, []);

  // Reset scroll position when component mounts
  useEffect(() => {
    resetScrollPosition();
    // For ScrollView specifically, we need to explicitly scroll to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, []);

  // This will run whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset scroll position when screen comes into focus
      resetScrollPosition();
      
      // Explicitly scroll to top - with a slight delay to ensure DOM is ready
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 50);
      
      return () => {}; // Clean up if needed
    }, [])
  );

  // Refresh posts when returning from creating a new post
  useEffect(() => {
    if (newPost === 'true' && postId) {
      loadPosts();
    }
  }, [newPost, postId]);

  async function loadPosts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user posts
      const { data: postsData } = await supabase
        .from('posts_with_users')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setPosts(postsData || []);
      return postsData;
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Check if user is a provider
      const { data: providerData } = await supabase
        .from('service_providers')
        .select('id')
        .eq('id', user.id)
        .single();
      
      setIsProvider(!!providerData);

      // Load user posts
      await loadPosts();

      // Load user groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          group:groups (
            id,
            name,
            type,
            description
          )
        `)
        .eq('user_id', user.id);
      
      // Handle potential error loading community groups
      if (groupsError) console.error('Error loading community groups:', groupsError);
      setGroups(groupsData || []);

      // --- Load user's housing groups --- 
      const { data: housingGroupsData, error: housingGroupsError } = await supabase
        .from('housing_group_members')
        .select(`
          id,
          status,
          group:housing_groups!inner (
            id,
            name,
            description,
            listing:housing_listings!inner (
              title,
              media_urls
            )
          )
        `)
        .eq('user_id', user.id); // Filter by current user

      if (housingGroupsError) {
        console.error('Error loading housing groups:', housingGroupsError);
        // Decide if you want to throw or just log, setting empty array for now
        setHousingGroups([]);
      } else {
        // Assert type to help TypeScript, similar to previous fix
        setHousingGroups((housingGroupsData as any[] || []) as HousingGroupMembership[]);
      }

      // Load user bookings
      const { data: bookingsData } = await supabase
        .from('service_bookings')
        .select(`
          id,
          scheduled_at,
          status,
          total_price,
          service:services (
            title,
            category,
            provider:service_providers (
              business_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      
      setBookings(bookingsData || []);

      // Load recent badges
      try {
        try {
          const userBadges = await RewardsService.getUserBadges(user.id);
          setRecentBadges(userBadges.slice(0, 3).map(badge => badge.badge?.name || 'Unknown Badge'));
          
          // Only attempt to track achievements if badges loaded successfully
          // Check if profile is complete and track achievement
          const isProfileComplete = checkProfileCompletion(profileData);
          if (isProfileComplete) {
            try {
              await RewardsService.updateAchievementProgress(user.id, 'profile_complete', 1, 1);
              
              // Track profile update activity
              await RewardsService.trackActivity(user.id, 'profile_update', {
                isComplete: true,
                timestamp: new Date().toISOString()
              });
            } catch (achievementError: unknown) {
              // Don't let achievement tracking errors affect the profile loading
              console.error('Error tracking profile achievement:', 
                achievementError instanceof Error ? achievementError.message : 'Unknown error');
            }
          }
          
          // Track group membership achievements
          if (groupsData && groupsData.length > 0) {
            try {
              await RewardsService.updateAchievementProgress(
                user.id, 
                'groups_joined_count', 
                groupsData.length, 
                3
              );
              
              if (groupsData.length >= 3) {
                await RewardsService.updateAchievementProgress(user.id, 'groups_joined', 1, 1);
              }
              
              // Track group membership activity
              await RewardsService.trackActivity(user.id, 'join_group', {
                totalGroups: groupsData.length,
                timestamp: new Date().toISOString()
              });
            } catch (groupError: unknown) {
              // Don't let group achievement tracking errors affect the profile loading
              console.error('Error tracking group achievements:', 
                groupError instanceof Error ? groupError.message : 'Unknown error');
            }
          }
          
          // Track booking achievements
          if (bookingsData && bookingsData.length > 0) {
            try {
              await RewardsService.updateAchievementProgress(
                user.id, 
                'services_booked_count', 
                bookingsData.length, 
                5
              );
              
              if (bookingsData.length >= 5) {
                await RewardsService.updateAchievementProgress(user.id, 'services_booked', 1, 1);
              }
              
              // Track booking activity
              await RewardsService.trackActivity(user.id, 'book_service', {
                totalBookings: bookingsData.length,
                timestamp: new Date().toISOString()
              });
            } catch (bookingError: unknown) {
              // Don't let booking achievement tracking errors affect the profile loading
              console.error('Error tracking booking achievements:', 
                bookingError instanceof Error ? bookingError.message : 'Unknown error');
            }
          }
        } catch (badgesError: unknown) {
          console.error('Error loading badges:', badgesError instanceof Error ? badgesError.message : 'Unknown error');
          
          // Fallback: Create some mock badges for demonstration
          setRecentBadges(['Profile Complete', 'Community Member', 'Service Booker']);
        }
      } catch (err: unknown) {
        // Don't let rewards errors affect the profile loading
        console.error('Error loading rewards:', err instanceof Error ? err.message : 'Unknown error');
      }
    } catch (err: unknown) {
      console.error('Error loading profile:', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Check if profile is complete (has all required fields)
  const checkProfileCompletion = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    
    return !!(
      profile.full_name && 
      profile.username && 
      profile.bio && 
      (profile.comfort_traits && profile.comfort_traits.length > 0) &&
      (profile.preferred_categories && profile.preferred_categories.length > 0)
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadPosts()]);
    setRefreshing(false);
  }, []);

  // Award badges based on profile completion and activities
  const getBadges = () => {
    if (recentBadges.length > 0) {
      return recentBadges;
    }
    
    // Fallback to legacy badge calculation if no badges from rewards system
    const badges = [];
    
    if (profile?.full_name) badges.push('Profile Complete');
    if (profile?.bio) badges.push('Bio Added');
    if (profile?.ndis_verified) badges.push('NDIS Verified');
    if (posts.length > 0) badges.push('First Post');
    if (groups.length > 0) badges.push('Community Member');
    if (bookings.length > 0) badges.push('Service Booker');
    
    // Return top 3 badges
    return badges.slice(0, 3);
  };

  const handleProviderDashboard = () => {
    router.push('/provider');
  };
  
  const navigateToRewards = () => {
    // Immediately navigate to rewards screen without waiting
    router.push({
      pathname: '/rewards' as any,
      params: { 
        preload: 'true' // Parameter to indicate this is a preloaded navigation
      }
    });
  };

  // Memoize the combined group list
  const combinedGroupsList = useMemo(() => {
    console.log('DEBUG [ProfileScreen - useMemo]: Raw groups state:', groups);
    console.log('DEBUG [ProfileScreen - useMemo]: Raw housingGroups state:', housingGroups);

    const communityGroupItems = (groups || [])
      .filter(cg => cg.group) // Ensure group data exists
      .map(cg => ({
        id: cg.group!.id,
        name: cg.group!.name || 'Unnamed Group',
        // Assign type based on the actual group type from the database
        type: cg.group!.type === 'housing' ? 'housing' as const : 'community' as const,
        description: cg.group!.description || '',
        avatar_url: cg.group!.avatar_url || null,
        role: cg.role || 'member',
        source: 'groups' // Indicate source table
      }));

    const housingGroupItems = (housingGroups || [])
      .filter(hg => hg.group) // Ensure group data exists
      .map(hg => ({
        id: hg.group!.id,
        name: hg.group!.name || hg.group!.listing?.title || 'Housing Group',
        type: 'housing' as const, // Explicitly type as housing
        description: hg.group!.description || '',
        // Use first listing image as avatar, or null
        avatar_url: hg.group!.listing?.media_urls?.[0] || null,
        status: hg.status || 'unknown',
        source: 'housing_groups' // Indicate source table
      }));

    // Combine and remove potential duplicates based on ID
    const combined = [...communityGroupItems, ...housingGroupItems];
    const uniqueGroups = Array.from(new Map(combined.map(item => [item.id, item])).values());

    console.log('DEBUG [ProfileScreen - useMemo]: Final combinedGroupsList:', uniqueGroups);
    return uniqueGroups;
  }, [groups, housingGroups]); // Recalculate only when groups or housingGroups change

  // Render all other tabs' content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <View style={styles.tabContent}>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageSquare size={48} color="#e1e1e1" />
                <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
                <Text style={styles.emptyStateText}>
                  Share your experiences with the community
                </Text>
                <TouchableOpacity
                  style={styles.createPostButton}
                  onPress={() => router.push('/community/create')}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.createPostButtonText}>Create Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                <Text style={styles.debugInfo}>Posts count: {posts.length}</Text>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push({
                    pathname: '/profile/posts' as any,
                    params: { userId: profile?.id }
                  })}
                >
                  <Text style={styles.viewAllText}>View All Posts</Text>
                </TouchableOpacity>
                {posts.map((post: any) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.gridPostCard}
                    onPress={() => router.push({
                      pathname: '/(tabs)/community/post' as any,
                      params: { id: post.id }
                    })}
                  >
                    {post.media_urls && post.media_urls[0] ? (
                      <Image
                        source={{ uri: post.media_urls[0] }}
                        style={styles.gridPostImage}
                      />
                    ) : (
                      <View style={styles.noImageContainer}>
                        <MessageSquare size={24} color="#666" />
                      </View>
                    )}
                    <View style={styles.gridPostFooter}>
                      <View style={styles.metricItem}>
                        <Heart size={14} color="#666" />
                        <Text style={styles.metricText}>{post.likes_count || 0}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MessageSquare size={14} color="#666" />
                        <Text style={styles.metricText}>{post.comments_count || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
        
      case 'groups':
        if (combinedGroupsList.length === 0) {
          return (
            <View style={styles.emptyState}>
              <CommunityIcon size={48} color="#e1e1e1" />
              <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
              <Text style={styles.emptyStateText}>
                Join community or housing groups to see them here.
              </Text>
              <TouchableOpacity
                style={styles.browseGroupsButton}
                onPress={() => router.push('/(tabs)/community/groups')}
              >
                <Text style={styles.browseGroupsButtonText}>Browse Groups</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <FlatList
            data={combinedGroupsList}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupListItem}
                onPress={() => router.push(item.navigatePath as any)}
              >
                <Image
                  source={item.avatarUrl ? { uri: item.avatarUrl } : require('../../../assets/images/default-group.png')}
                  style={styles.groupListAvatar}
                />
                <View style={styles.groupListInfo}>
                  <Text style={styles.groupListName}>{item.name}</Text>
                  <Text style={styles.groupListType}>
                    {item.type === 'housing' ? 'Housing Group' : 'Community Group'}
                  </Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.pendingIndicator}>
                    <Clock size={16} color="orange" />
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabContent}
          />
        );

      case 'bookings':
        return (
          <View style={styles.tabContent}>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#e1e1e1" />
                <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
                <Text style={styles.emptyStateText}>
                  Book services to see your appointments here
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/discover')}
                >
                  <Text style={styles.emptyStateButtonText}>Find Services</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookings.map((booking: any) => (
                <View key={booking.id} style={styles.listCard}>
                  <View style={styles.listIconContainer}>
                    <Calendar size={24} color="#007AFF" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>
                      {booking.service?.title || 'Unknown Service'}
                    </Text>
                    <Text style={styles.listSubtitle}>
                      {booking.service?.provider?.business_name || 'Unknown Provider'}
                    </Text>
                    <View style={styles.bookingDetails}>
                      <Text style={styles.bookingDate}>
                        {new Date(booking.scheduled_at).toLocaleDateString()} at {new Date(booking.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        booking.status === 'confirmed' && styles.statusConfirmed,
                        booking.status === 'completed' && styles.statusCompleted,
                        booking.status === 'cancelled' && styles.statusCancelled,
                      ]}>
                        <Text style={styles.statusText}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </View>
              ))
            )}
          </View>
        );
        
      case 'friends':
        return (
          <View style={styles.tabContent}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <CommunityIcon size={48} color="#e1e1e1" />
                <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
                <Text style={styles.emptyStateText}>
                  Connect with others in the community
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/profile/friends/find')}
                >
                  <Text style={styles.emptyStateButtonText}>Find Friends</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push('/profile/friends')}
                >
                  <Text style={styles.viewAllText}>View All Friends</Text>
                </TouchableOpacity>

                {friends.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listCard}
                    onPress={() => router.push(`/profile/friends/${item.id}`)}
                  >
                    <View style={styles.listIconContainer}>
                      {item.friend_avatar ? (
                        <Image source={{ uri: item.friend_avatar }} style={styles.friendAvatar} />
                      ) : (
                        <View style={[styles.friendAvatar, styles.avatarPlaceholder]}>
                          <User2 size={20} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.listContent}>
                      <Text style={styles.listTitle}>{item.friend_name || 'Unknown'}</Text>
                      <Text style={styles.listSubtitle}>
                        {item.category && item.category.charAt(0).toUpperCase() + item.category.slice(1) || 'Friend'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.container}>
          <AppHeader title="Profile" showBackButton={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <AppHeader title="Profile" showBackButton={true} />
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Profile and badges section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <User2 size={40} color="#999" />
                </View>
              )}
            </View>
            
           {/* Wrapper View for Name and Badge */}
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileNameText}>
                {(profile?.full_name || 'User').trim()}
              </Text>
              {profile?.ndis_verified && (
                <BadgeCheck size={16} color="#007AFF" style={styles.verifiedBadgeIcon} />
              )}
            </View>
            
            <Text style={styles.username}>@{profile?.username?.trim() || 'user'}</Text>
            
            {profile?.bio && (
              <Text style={styles.bio}>{profile.bio.trim()}</Text>
            )}
            
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Edit size={16} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.walletButton}
                onPress={() => router.push('/wallet')}
              >
                <Wallet size={16} color="#fff" />
                <Text style={styles.walletButtonText}>Wallet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.ndisButton}
                onPress={() => router.push('/ndis-plan')}
              >
                <FileCheck size={16} color="#fff" />
                <Text style={styles.ndisButtonText}>NDIS</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Provider Mode Section */}
          {profile?.role === 'provider' || isProvider ? (
            <View style={styles.providerSection}>
              <TouchableOpacity 
                style={styles.providerButton}
                onPress={handleProviderDashboard}
              >
                <Wrench size={20} color="#fff" />
                <Text style={styles.providerButtonText}>Provider Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          
          {/* Badges Section */}
          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges & Achievements</Text>
              {profile?.role !== 'provider' && (
                <TouchableOpacity 
                  style={styles.rewardsButtonSmall}
                  onPress={navigateToRewards}
                >
                  <Award size={16} color="#007AFF" />
                  <Text style={styles.rewardsButtonSmallText}>Rewards</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.badgesScrollView} 
              contentContainerStyle={[styles.badgesContainer, { alignItems: 'flex-start' }]}
            >
              {getBadges().map((badge, index) => (
                <View key={index} style={styles.badgeItem}>
                  <View style={styles.badgeIcon}>
                    <Award size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.badgeName}>{badge}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          
          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
              onPress={() => setActiveTab('posts')}
            >
              <MessageSquare 
                size={20} 
                color={activeTab === 'posts' ? '#007AFF' : '#666'} 
              />
              <Text 
                style={[
                  styles.tabButtonText, 
                  activeTab === 'posts' && styles.activeTabButtonText
                ]}
              >
                Posts
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton]}
              onPress={() => setActiveTab('groups')}
            >
              <CommunityIcon 
                size={20} 
                color={activeTab === 'groups' ? '#007AFF' : '#666'} 
              />
              <Text 
                style={[
                  styles.tabButtonText, 
                  activeTab === 'groups' && styles.activeTabButtonText
                ]}
              >
                Groups
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'bookings' && styles.activeTabButton]}
              onPress={() => setActiveTab('bookings')}
            >
              <Calendar 
                size={20}
                color={activeTab === 'bookings' ? '#007AFF' : '#666'} 
              />
              <Text 
                style={[
                  styles.tabButtonText, 
                  activeTab === 'bookings' && styles.activeTabButtonText
                ]}
              >
                Bookings
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'friends' && styles.activeTabButton]}
              onPress={() => setActiveTab('friends')}
            >
              <User2 
                size={20} 
                color={activeTab === 'friends' ? '#007AFF' : '#666'} 
              />
              <Text 
                style={[
                  styles.tabButtonText, 
                  activeTab === 'friends' && styles.activeTabButtonText
                ]}
              >
                Friends
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab content */}
          {renderTabContent()}
        </ScrollView>
      </View>
    );
  };

  return renderMainContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  verifiedBadgeIcon: {
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  walletButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  ndisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#4CD964',
    borderRadius: 20,
  },
  ndisButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  providerSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#5856D6',
    borderRadius: 12,
  },
  providerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  badgesSection: {
    padding: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  rewardsButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  rewardsButtonSmallText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  badgesScrollView: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  badgesContainer: {
    paddingRight: 24,
    paddingVertical: 12,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeItem: {
    alignItems: 'center',
    width: 80,
    height: 90, // Fixed height for consistency
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#1a1a1a',
    textAlign: 'center',
    height: 32, // Fixed height for text to ensure alignment
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
    paddingBottom: 80, // Added padding for scrollable lists
  },
  emptyState: {
    flex: 1, // Ensure it takes up space
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseGroupsButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  browseGroupsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  groupListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  groupListInfo: {
    flex: 1,
  },
  groupListName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  groupListType: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  pendingText: {
    marginLeft: 4,
    fontSize: 12,
    color: 'orange',
    fontStyle: 'italic',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  gridPostCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  gridPostImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  noImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#fff',
  },
  debugInfo: {
    width: '100%',
    padding: 4,
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  viewAllButton: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsListContent: {
    paddingBottom: 80,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  createPostButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 12,
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bookingDetails: {
    marginTop: 8,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#e1f0ff',
  },
  statusCompleted: {
    backgroundColor: '#e6f7e9',
  },
  statusCancelled: {
    backgroundColor: '#ffe6e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    // Colors based on status can be added here if needed
  },
});