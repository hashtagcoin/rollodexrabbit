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
const SCROLL_THRESHOLD = 50;

export default function UserPostsScreen2() {
  const params = useLocalSearchParams();
  console.log("[SCREEN] Loaded profile/posts.tsx", { params });
  console.log('[FAB DEBUG] UserPostsScreen component rendered'); // Basic render log
  const { userId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [fabVisible, setFabVisible] = useState(false);
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
    console.log('[FAB DEBUG] isFocused listener. Value:', isFocused);
    if (!isFocused) {
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

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: postsData, error: postsError } = await supabase
        .from('posts_with_users')
        .select('*')
        .eq('author_profile_id', userId)
        .order('post_created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

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

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    console.log('[FAB DEBUG] handleScroll - currentOffset:', currentOffset);
    if (currentOffset > SCROLL_THRESHOLD) {
      if (isFocused) {
        console.log('[FAB DEBUG] Scroll threshold breached and screen focused, attempting to show FAB.');
        setFabVisible(true);
      } else {
        console.log('[FAB DEBUG] Scroll threshold breached BUT screen NOT focused.');
        setFabVisible(false); // Ensure it's false if not focused, even if scrolled
      }
    } else {
      console.log('[FAB DEBUG] Scroll threshold NOT breached, attempting to hide FAB.');
      setFabVisible(false);
    }
  };

  const handleGoBack = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <Text style={{fontSize: 24, color: 'purple', textAlign: 'center', padding: 20, fontWeight: 'bold'}}>!! POSTS2 TEST !!</Text>
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
        onScroll={handleScroll}
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
                      {new Date(post.created_at).toLocaleDateString()}
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
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  postsContainer: {
    padding: 16,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postCaption: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: width * 0.7,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
});
