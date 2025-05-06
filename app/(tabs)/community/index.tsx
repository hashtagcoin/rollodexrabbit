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
  UserPlus
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

// Constants for header heights
const APP_HEADER_HEIGHT = 100; // Further increased app header height to prevent overlap
const NAV_HEADER_HEIGHT = 70; // Navigation header height

type Post = {
  post_id: string;
  content: string;
  media_urls: string[];
  post_created_at: string;
  author_profile_id: string;
  author_full_name: string;
  author_avatar_url: string | null;
  likes_count: number;
  comments_count: number;
};

export default function CommunityFeed() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Animation refs and states for the sticky header
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYValue = useRef(0);
  const lastScrollDirection = useRef<'up' | 'down'>('up');
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  
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
        .from('posts_with_users') // Query the view
        .select('*') // Select all columns from the view (adjust if specific columns needed)
        .order('post_created_at', { ascending: false }); // CORRECTED: Use post_created_at

      if (postsError) throw postsError;

      // The view should already contain post_id, content, media_urls, created_at (as post_created_at or created_at),
      // author_profile_id, author_full_name, author_avatar_url, likes_count, comments_count.
      // We need to ensure the field names match what the Post type expects.
      // For now, let's assume the view provides compatible names or we adjust the Post type/mapping here.
      
      // Map data if necessary to match the Post type structure, especially for created_at if names differ.
      // For simplicity, if posts_with_users provides fields like post_id, content, media_urls, author_profile_id, 
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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingLike, error: fetchError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
      }

      let actionTaken: 'liked' | 'unliked';

      if (existingLike) {
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });

        if (deleteError) throw deleteError;
        console.log('Post unliked');
        actionTaken = 'unliked';
      } else {
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        if (insertError) throw insertError;
        console.log('Post liked');
        actionTaken = 'liked';
      }

      // Update local state instead of reloading all posts
      setPosts(currentPosts =>
        currentPosts.map(p => {
          if (p.post_id === postId) {
            return {
              ...p,
              likes_count: p.likes_count + (actionTaken === 'liked' ? 1 : -1),
            };
          }
          return p;
        })
      );

    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  // Render the sticky navigation header
  const renderStickyHeader = () => (
    <Animated.View 
      style={[
        styles.stickyHeader,
        {
          transform: [{ translateY: headerTranslateY }],
          shadowOpacity: scrollYValue.current > 0 ? 0.3 : 0,
          top: APP_HEADER_HEIGHT // Position it with more space below the main header
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
      <AppHeader title="Community" showBackButton={true} />
      
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
            { paddingTop: APP_HEADER_HEIGHT } // Padding only for main header
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
            <View key={post.post_id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={
                    post.author_avatar_url
                      ? { uri: post.author_avatar_url }
                      : require('../../../assets/rollodex-icon-lrg.png')
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.userName}>{post.author_full_name}</Text>
                  <Text style={styles.postTime}>
                    {new Date(post.post_created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text style={styles.caption}>
                <Text style={styles.userName}>{post.author_full_name} </Text>
                {post.content}
              </Text>

              {post.media_urls && post.media_urls.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/community/post',
                    params: { id: post.post_id }
                  })}
                >
                  <Image
                    source={{ uri: post.media_urls[0] }}
                    style={styles.postImage}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={() => handleLike(post.post_id)}
                >
                  <Heart size={24} color="#666" />
                  <Text style={styles.actionText}>{post.likes_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={() => router.push({
                    pathname: '/community/post',
                    params: { id: post.post_id }
                  })}
                >
                  <MessageCircle size={24} color="#666" />
                  <Text style={styles.actionText}>{post.comments_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.postActionButton}>
                  <Share2 size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.postActionButton}>
                  <Smile size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        </Animated.ScrollView>
      </View>
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
    gap: 24,
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
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postTime: {
    fontSize: 14,
    color: '#666',
  },
  caption: {
    fontSize: 16,
    color: '#333',
    marginVertical: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
});