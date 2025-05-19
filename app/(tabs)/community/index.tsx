import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Smile,
  Users,
  CalendarHeart,
  UserPlus,
  Bookmark as BookmarkIcon, // Added Bookmark icon import
} from 'lucide-react-native';
import AppHeader, { type HeaderAction } from '../../../components/AppHeader'; // Import HeaderAction type
import SharePostModal from '../../../components/SharePostModal'; // Added import
import { User } from '@supabase/supabase-js'; // Added import
import { Alert } from 'react-native'; // Added import
import { AntDesign } from '@expo/vector-icons'; // Changed import for AntDesign
import PostFeedImage from '../../../components/PostFeedImage'; // Import the new component
import PostItem from '../../../components/PostItem'; // Import PostItem

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post } from '../../../lib/types'; // Import Post from shared types

// Constants for header heights
const BASE_APP_HEADER_HEIGHT = 60; // base height of AppHeader content (excluding safe area)
const NAV_HEADER_HEIGHT = 70; // Navigation header height
// We'll compute APP_HEADER_HEIGHT dynamically in the component using insets.top + BASE_APP_HEADER_HEIGHT


export default function CommunityFeed() {
  const insets = useSafeAreaInsets();
  const APP_HEADER_HEIGHT = insets.top + BASE_APP_HEADER_HEIGHT; // dynamic height for AppHeader including safe area

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserSession, setCurrentUserSession] = useState<User | null>(null); // Added state for current user
  const [isShareModalVisible, setIsShareModalVisible] = useState(false); // Added state for modal visibility
  const [sharingPostId, setSharingPostId] = useState<string | null>(null); // Added state for post to share

  // Animation refs and states for the sticky header
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYValue = useRef(0);
  const lastScrollDirection = useRef<'up' | 'down'>('up');
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  // Define header actions
  const communityHeaderActions: HeaderAction[] = [
    // Removed BookmarkIcon from here
    // Add other right actions here if needed in the future
  ];

  // Track scroll direction and animate header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y;
        const previousY = scrollYValue.current;
        const direction = currentY > previousY ? 'down' : 'up';
        
        // Only animate when scrolled beyond the point where the subheader would naturally disappear
        if (direction !== lastScrollDirection.current) {
          lastScrollDirection.current = direction;
          
          // Animate header based on scroll direction
          Animated.spring(headerTranslateY, {
            toValue: direction === 'down' ? -NAV_HEADER_HEIGHT : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10
          }).start();
        }
        
        scrollYValue.current = currentY;
      }
    }
  );

  async function loadPosts() {
    try {
      setLoading(true);
      // Fetch posts with user details and counts from the view
      const { data: enrichedPostsData, error: postsError } = await supabase
        .from('posts_with_users') // Use posts_with_users for main community feed
        .select('*') // Select all columns from the view (adjust if specific columns needed)
        .order('post_created_at', { ascending: false }); // CORRECTED: Use post_created_at

      if (postsError) throw postsError;

      // The view should already contain post_id, content, media_urls, created_at (as post_created_at or created_at),
      // author_profile_id, author_full_name, author_avatar_url, likes_count, comments_count.
      // We need to ensure the field names match what the Post type expects.
      // For now, let's assume the view provides compatible names or we adjust the Post type/mapping here.
      
      // Map data if necessary to match the Post type structure, especially for created_at if names differ.
      // For group-specific posts, use group_posts_with_users. For the general feed, posts_with_users is correct.
      // author_full_name, author_avatar_url, likes_count, comments_count, and created_at (for post_created_at)
      // then the mapping can be direct or minimal.

      const postsWithCorrectDate = enrichedPostsData?.map(p => ({
        ...p,
        // The Post type expects post_created_at, and the view provides post_created_at.
        // If the view provided it as, say, 'view_created_at', you'd map: post_created_at: p.view_created_at
        // Since both are named post_created_at (or if p already has post_created_at from the view correctly),
        // this specific mapping line might be redundant if ...p already spreads it correctly. Assuming direct match for now.
        post_created_at: p.post_created_at, // ENSURE 'p' has 'post_created_at' from the view
        // If likes_count and comments_count are not in the view, they will be undefined here.
        likes_count: p.likes_count || 0, // Default to 0 if not provided by view
        comments_count: p.comments_count || 0 // Default to 0 if not provided by view
      })) || [];

      setPosts(postsWithCorrectDate as Post[]); // Cast if confident about structure, or validate/map more robustly

    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
      setCurrentUserSession(null);
      return;
    }
    setCurrentUserSession(session?.user ?? null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string, currentlyLiked?: boolean) => {
    if (!currentUserSession) {
      Alert.alert("Error", "You need to be logged in to like posts.");
      return;
    }

    // Optimistically update UI
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.post_id === postId
          ? {
              ...p,
              current_user_has_liked: !currentlyLiked,
              likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );

    try {
      if (currentlyLiked) {
        // User is unliking the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: currentUserSession.id });
        if (error) throw error;
      } else {
        // User is liking the post
        const { error } = await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: currentUserSession.id }]);
        if (error) throw error;
      }
      // No need to re-fetch, optimistic update handles UI. 
      // Can add a silent re-fetch here if strong consistency is paramount after some delay.
    } catch (error: any) {
      console.error('Error liking/unliking post:', error);
      // Revert optimistic update on error
      setPosts(currentPosts =>
        currentPosts.map(p =>
          p.post_id === postId
            ? {
                ...p,
                current_user_has_liked: currentlyLiked, // Revert to original liked status
                likes_count: currentlyLiked ? p.likes_count + 1 : p.likes_count - 1, // Revert count
              }
            : p
        )
      );
      Alert.alert('Error', `Could not update like status: ${error.message}`);
    }
  };

  const handleBookmark = async (postId: string, currentlyBookmarked?: boolean) => {
    if (!currentUserSession) {
      Alert.alert("Error", "You must be logged in to bookmark posts.");
      return;
    }

    // Optimistic UI update
    const originalPosts = [...posts];
    setPosts(prevPosts => 
      prevPosts.map(p => 
        p.post_id === postId ? { ...p, current_user_has_bookmarked: !currentlyBookmarked } : p
      )
    );

    try {
      if (currentlyBookmarked) {
        // Unbookmark: delete from bookmarks table
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .match({ user_id: currentUserSession.id, post_id: postId });
        if (error) throw error;
      } else {
        // Bookmark: insert into bookmarks table
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: currentUserSession.id, post_id: postId });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error handling bookmark:', error.message);
      Alert.alert("Error", "Could not update bookmark. Please try again.");
      // Revert optimistic update
      setPosts(originalPosts);
    }
  };

  // Handlers for SharePostModal
  const handleOpenShareModal = (postId: string) => {
    if (!currentUserSession) {
        console.log('Not Logged In', 'You need to be logged in to share posts.');
        fetchCurrentUser(); // Try to refetch user, maybe session expired
        return;
    }
    setSharingPostId(postId);
    setIsShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalVisible(false);
    setSharingPostId(null);
  };

  const handleConfirmShare = async (postId: string, selectedFriendIds: string[]) => {
    if (!currentUserSession) {
      Alert.alert("Error", "You must be logged in to share posts.");
      return;
    }

    const senderId = currentUserSession.id;
    // Attempt to get sender's name, provide a fallback
    const senderName = currentUserSession.user_metadata?.full_name || currentUserSession.email || "Someone";

    const notificationsToInsert = selectedFriendIds.map(friendId => ({
      user_id: friendId, // Recipient ID
      type: 'post_share',
      title: `${senderName} shared a post with you`,
      body: 'Tap to view the post.',
      content: JSON.stringify({ 
        sender_id: senderId,
        post_id: postId,
        // Future enhancement: could add post caption preview here if available
      }),
      // 'seen' and 'created_at' will use default values in the DB
    }));

    if (notificationsToInsert.length > 0) {
      try {
        const { error } = await supabase.from('notifications').insert(notificationsToInsert);
        if (error) {
          throw error;
        }
        Alert.alert('Shared!', `Post shared successfully with ${selectedFriendIds.length} friend(s).`);
      } catch (error: any) {
        console.error('Error creating notifications:', error);
        Alert.alert('Error', `Could not share the post: ${error.message || 'Unknown error'}`);
      }
    }

    handleCloseShareModal(); // Close modal regardless of notification success for now
  };

  // Render the sticky navigation header
  const renderStickyHeader = () => (
    <Animated.View 
      style={[
        styles.stickyHeader,
        {
          transform: [{ translateY: headerTranslateY }],
          shadowOpacity: scrollYValue.current > 0 ? 0.3 : 0,
          top: APP_HEADER_HEIGHT // Dynamically offset sticky header below AppHeader (safe area + base height)
        }
      ]}
    >
      <View style={styles.headerActions}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/community/groups')} 
          >
            <Users size={24} color="#000" />
            <Text style={styles.buttonLabel}>Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity
             style={styles.iconButton}
             // Change the navigation path to profile friends find
             onPress={() => {
              console.log('Navigating to /profile/friends/find...');
              router.push('/profile/friends/find'); // Fix: Navigate to profile/friends/find
             }}
           >
             <UserPlus size={24} color="#000" />
             <Text style={styles.buttonLabel}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/community/events')}
          >
            <CalendarHeart size={24} color="#000" />
            <Text style={styles.buttonLabel}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/community/bookmarks')}
          >
            <BookmarkIcon size={24} color="#000" />
            <Text style={styles.buttonLabel}>Bookmarks</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/community/create')}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Post</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Community" 
        showBackButton={false} // Set showBackButton to false for main tab screen
        rightActions={communityHeaderActions} // Pass the actions to the header
      />
      
      {/* Sticky Navigation Header */}
      {renderStickyHeader()}
      
      <View style={styles.content}>
        <Animated.ScrollView
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollEndDrag={() => {Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true }).start(); lastScrollDirection.current = 'up';}}
          onMomentumScrollEnd={() => {Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true }).start(); lastScrollDirection.current = 'up';}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: APP_HEADER_HEIGHT } // Padding matches dynamic AppHeader height (safe area + base height)
          ]}
        >
        {loading ? (
          <Text style={styles.loadingText}>Loading posts...</Text>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
            <Text style={styles.emptyStateText}>
              Be the first to share something with the community
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostItem
              key={post.post_id}
              post={post}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onCommentPress={(postId) => router.push({ pathname: '/community/post', params: { id: postId } })}
              onSharePress={handleOpenShareModal}
              onOpenPostImage={(postId) => router.push({ pathname: '/community/post', params: { id: postId } })}
            />
          ))
        )}
        </Animated.ScrollView>
      </View>
      {sharingPostId && currentUserSession && (
        <SharePostModal
          isVisible={isShareModalVisible}
          onClose={handleCloseShareModal}
          postId={sharingPostId}
          onShare={handleConfirmShare} // This will be updated later for notifications
          currentUser={currentUserSession}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 36,
    shadowColor: '#007AFF',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  stickyHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 110, // Increase zIndex from 90 to 110
    height: NAV_HEADER_HEIGHT,
    paddingTop: 8, // Add some padding at the top for extra spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: '100%',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Changed for even spacing
    flex: 1, // Allow navButtons to take full width for space-around to work
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,  // moved down to avoid overlap with AppHeader
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 2, // Reduced from 4px to 2px to move label closer
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});