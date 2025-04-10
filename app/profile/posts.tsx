import { useState, useEffect } from 'react';
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
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Heart, MessageSquare } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

const { width } = Dimensions.get('window');

export default function UserPostsScreen() {
  const { userId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadData();
    
    // Set up custom back handler
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If going back to profile tab, prevent default and use router
      router.push('/(tabs)/profile');
    });
    
    return unsubscribe;
  }, [userId, navigation]);

  async function loadData() {
    try {
      setLoading(true);
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load user posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts_with_users')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
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
                key={post.id} 
                style={styles.postCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/community/post' as any,
                  params: { id: post.id }
                })}
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
});
