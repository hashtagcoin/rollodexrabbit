import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Heart, MessageSquare, Plus } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SCROLL_TOP_THRESHOLD = 10; // Threshold to consider as "at the top"

export default function UserPostsScreen2() {
  const params = useLocalSearchParams();
  console.log("[SCREEN] Loaded profile/posts.tsx", { params });
  console.log('[FAB DEBUG] UserPostsScreen component rendered'); // Basic render log
  const { userId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]); // Will be augmented with comments
  const [profile, setProfile] = useState<any>(null);
  const [fabVisible, setFabVisible] = useState(true); // FAB visible by default
  const isFocused = useIsFocused();

  useEffect(() => {
    console.log('[FAB DEBUG] isFocused effect triggered. isFocused:', isFocused);
    loadData();

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      router.push('/(tabs)/profile');
    });

    return unsubscribe;
  }, [userId, navigation]);

  useEffect(() => {
    console.log('[FAB DEBUG] isFocused listener for FAB. Value:', isFocused);
    if (isFocused) {
      // When screen becomes focused, assume not scrolling and show FAB.
      // Scroll events will hide it if user scrolls immediately.
      setFabVisible(true); 
    } else {
      // If screen is not focused, always hide FAB.
      console.log('[FAB DEBUG] Screen not focused, hiding FAB.');
      setFabVisible(false);
    }
  }, [isFocused]);

  async function loadData() {
    try {
      setLoading(true);

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts_with_users')
        .select('*')
        .eq('author_profile_id', userId)
        .order('post_created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch comments for each post
      if (postsData) {
        const postsWithComments = await Promise.all(
          postsData.map(async (post) => {
            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select(`
                id,
                content,
                created_at,
                user_id,
                user_profiles ( username, avatar_url )
              `)
              .eq('post_id', post.post_id)
              .order('created_at', { ascending: true })
              .limit(2); // Fetch top 2 comments

            if (commentsError) {
              console.error(`Error fetching comments for post ${post.post_id}:`, commentsError.message);
              return { ...post, comments: [] };
            }
            return { ...post, comments: commentsData || [] };
          })
        );
        setPosts(postsWithComments);
      } else {
        setPosts([]);
      }

    } catch (e: unknown) {
      console.error('Error loading posts:', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleGoBack = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profile?.username ? `${profile.username}'s Posts` : 'User Posts'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollBeginDrag={() => {
          if (isFocused) {
            console.log('[FAB DEBUG] onScrollBeginDrag - hiding FAB');
            setFabVisible(false);
          }
        }}
        onMomentumScrollEnd={() => {
          if (isFocused) {
            console.log('[FAB DEBUG] onMomentumScrollEnd - showing FAB');
            setFabVisible(true);
          }
        }}
        onScrollEndDrag={(e) => {
          if (isFocused && e.nativeEvent.velocity?.y === 0) {
            console.log('[FAB DEBUG] onScrollEndDrag (no momentum) - showing FAB');
            setFabVisible(true);
          }
        }}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts to display</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            <View style={styles.postsHeader}>
              <Text style={styles.postsCount}>{posts.length} Posts</Text>
            </View>

            {posts.map((post) => (
              <TouchableOpacity 
                key={post.post_id} 
                style={styles.postCard}
                onPress={() => {
                  console.log(`[ProfilePosts] Tapped post_id: ${post.post_id}, for author_profile_id: ${post.author_profile_id}. Navigating to user's post list.`);
                  if (post.author_profile_id) {
                    console.log("[DEBUG] About to navigate to /profile/posts", { userId: post.author_profile_id });
                    console.trace();
                    router.push({
                      pathname: '/profile/posts2', 
                      params: { userId: post.author_profile_id } 
                    });
                  } else {
                    console.error('[ProfilePosts] Cannot navigate: author_profile_id is missing from post object for post_id:', post.post_id);
                  }
                }}
              >
                <View style={styles.postHeader}>
                  <Image
                    source={{ 
                      uri: profile?.avatar_url || 'https://via.placeholder.com/40' 
                    }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.postHeaderText}>
                    <Text style={styles.username}>
                      {profile?.username || 'User'}
                    </Text>
                    <Text style={styles.postDate}>
                      {new Date(post.post_created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.postCaption}>{post.caption}</Text>
                
                {post.media_urls && post.media_urls[0] && (
                  <Image
                    source={{ uri: post.media_urls[0] }}
                    style={styles.postImage}
                  />
                )}
                
                <View style={styles.postActions}>
                  <View style={styles.actionButton}>
                    <Heart size={20} color="#666" />
                    <Text style={styles.actionCount}>{post.likes_count || 0}</Text>
                  </View>
                  <View style={styles.actionButton}>
                    <MessageSquare size={20} color="#666" />
                    <Text style={styles.actionCount}>{post.comments_count || 0}</Text>
                  </View>
                </View>

                {/* Display Comments */}
                {post.comments && post.comments.length > 0 && (
                  <View style={styles.commentsContainer}>
                    <Text style={styles.commentsHeader}>Comments:</Text>
                    {post.comments.map((comment: any) => (
                      <View key={comment.id} style={styles.commentItem}>
                        {comment.user_profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: comment.user_profiles.avatar_url }}
                            style={styles.commentAvatar}
                          />
                        ) : (
                          <View style={styles.commentAvatarPlaceholder} />
                        )}
                        <View style={styles.commentContentContainer}>
                          <Text style={styles.commentUsername}>
                            {comment.user_profiles?.username || 'User'}
                          </Text>
                          <Text style={styles.commentText}>{comment.content}</Text>
                        </View>
                      </View>
                    ))}
                    {/* Optionally, add a 'View all comments' button if post.comments_count > post.comments.length */}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {(() => {
        console.log('[FAB DEBUG] Rendering check: fabVisible =', fabVisible, ', isFocused =', isFocused);
        if (fabVisible && isFocused) {
          return (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push('/community/create')}
              activeOpacity={0.8}
            >
              <Plus size={28} color="#fff" />
            </TouchableOpacity>
          );
        }
        return null;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    marginTop: 50, // Added margin for better visibility
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  postsContainer: {
    padding: 10,
  },
  postsHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postCaption: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 20, 
  },
  postImage: {
    width: '100%',
    height: undefined, // Let aspect ratio define height
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#e1e1e1', // Placeholder color
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  actionCount: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  commentsContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#e1e1e1',
  },
  commentAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#ccc',
  },
  commentContentContainer: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
});
