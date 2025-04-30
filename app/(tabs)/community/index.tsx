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
  caption: string;
  media_urls: string[];
  post_created_at: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
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
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('post_id, caption, media_urls, created_at, user_id')
        .order('created_at', { ascending: false });
      if (postsError) throw postsError;

      // Fetch author profiles
      const userIds = [...new Set(postsData.map((post) => post.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      if (profilesError) throw profilesError;
      const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      profiles.forEach((profile) => {
        profileMap[profile.id] = profile;
      });

      // Enrich posts with profile data
      const enrichedPosts = postsData.map((post) => ({
        post_id: post.post_id,
        caption: post.caption,
        media_urls: post.media_urls,
        post_created_at: post.created_at,
        user_id: post.user_id,
        full_name: profileMap[post.user_id]?.full_name || '',
        avatar_url: profileMap[post.user_id]?.avatar_url || null,
        likes_count: 0,
        comments_count: 0,
      }));
      setPosts(enrichedPosts);
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

      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
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
             onPress={() => router.push('/profile/friends')}
           >
             <UserPlus size={24} color="#000" />
             <Text style={styles.buttonLabel}>Friends</Text>
           </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push({
              pathname: "/(tabs)/community",
              params: { screen: "events" }
            })}
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
                    post.avatar_url
                      ? { uri: post.avatar_url }
                      : require('../../../assets/rollodex-icon-lrg.png')
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.userName}>{post.full_name}</Text>
                  <Text style={styles.postTime}>
                    {new Date(post.post_created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text style={styles.caption}>
                <Text style={styles.userName}>{post.full_name} </Text>
                {post.caption}
              </Text>

              {post.media_urls && post.media_urls.length > 0 && (
                <Image
                  source={{ uri: post.media_urls[0] }}
                  style={styles.postImage}
                />
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
    zIndex: 90, // Lower than AppHeader's zIndex
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