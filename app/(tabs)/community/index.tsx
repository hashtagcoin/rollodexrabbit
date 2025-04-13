import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
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
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

type Post = {
  id: string;
  caption: string;
  media_urls: string[];
  created_at: string;
  full_name: string;
  avatar_url: string;
  likes_count: number;
  comments_count: number;
};

export default function CommunityFeed() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  async function loadPosts() {
    try {
      setLoading(true);
      // Use the posts_with_users view instead of complex joins
      const { data, error } = await supabase
        .from('posts_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  return (
    <View style={styles.container}>
      <AppHeader title="Community" showBackButton={true} />
      
      <View style={styles.content}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/community/groups')} 
          >
            <Users size={24} color="#007AFF" />
            <Text style={styles.actionText}>groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/community/create')}
          >
            <Plus size={20} color="#333" />
            <Text style={styles.actionButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
        
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
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: post.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' }}
                  style={styles.avatar}
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.userName}>{post.full_name}</Text>
                  <Text style={styles.postTime}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text style={styles.caption}>{post.caption}</Text>

              {post.media_urls && post.media_urls.length > 0 && (
                <Image
                  source={{ uri: post.media_urls[0] }}
                  style={styles.postImage}
                />
              )}

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(post.id)}
                >
                  <Heart size={24} color="#666" />
                  <Text style={styles.actionText}>{post.likes_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/community/post',
                    params: { id: post.id }
                  })}
                >
                  <MessageCircle size={24} color="#666" />
                  <Text style={styles.actionText}>{post.comments_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Share2 size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Smile size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  actionButtonText: {
    color: '#333',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
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
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 300,
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