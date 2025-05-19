import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../providers/AuthProvider'; 
import { Ionicons } from '@expo/vector-icons'; 
import GroupPostImage from './GroupPostImage'; 

const POSTS_PER_PAGE = 10;

export interface GroupPostDisplay {
  group_post_id: string;
  group_id: string;
  author_profile_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  post_created_at: string;
  author_username: string | null;
  author_full_name: string | null;
  author_avatar_url: string | null;
  author_bio: string | null;
  likes_count: number;
  comments_count: number;
}

interface GroupPostsSectionProps {
  groupId: string;
  // isGroupAdmin: boolean; 
}

const GroupPostsSection: React.FC<GroupPostsSectionProps> = ({ groupId }) => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<GroupPostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const fetchPosts = useCallback(async (currentPage: number, isRefreshing = false) => {
    if (!isRefreshing && loadingMore) return; 
    if (isRefreshing) {
        setLoading(true);
    } else {
        setLoadingMore(true);
    }
    setError(null);

    try {
      const from = currentPage * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error: fetchError } = await supabase
        .from('group_posts_with_users')
        .select('*')
        .eq('group_id', groupId)
        .order('post_created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error('Error fetching group posts:', fetchError);
        throw fetchError;
      }

      const newPosts = data?.map(p => {
        // Fallback for avatar URL, similar to community feed (MEMORY[5968f7ec-...])
        let finalAvatarUrl = p.author_avatar_url;
        if (finalAvatarUrl && finalAvatarUrl.startsWith('file:///')) {
          finalAvatarUrl = 'https://placekitten.com/g/200/200'; // Fallback avatar
        }

        return {
          group_post_id: p.post_id,
          group_id: groupId,
          author_profile_id: p.author_profile_id,
          content: p.content,
          media_url: p.media_url ?? null,
          media_type: p.media_type ?? null,
          post_created_at: p.post_created_at,
          author_username: p.author_username ?? null,
          author_full_name: p.author_full_name ?? null,
          author_avatar_url: finalAvatarUrl ?? null,
          author_bio: p.author_bio ?? null,
          likes_count: p.likes_count ?? 0,
          comments_count: p.comments_count ?? 0,
        };
      }) || [];

      setPosts(prevPosts => currentPage === 0 ? newPosts : [...prevPosts, ...newPosts]);
      setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      setPage(currentPage);

    } catch (err: any) {
      setError(err.message || 'Failed to load posts.');
      console.error('Catch block error fetching posts:', err);
    } finally {
      if (isRefreshing) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [groupId, loadingMore]);

  useEffect(() => {
    if (groupId) {
      setPosts([]); 
      setPage(0);
      setHasMorePosts(true);
      fetchPosts(0, true); 
    }
  }, [groupId]); 

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePosts) {
      fetchPosts(page + 1);
    }
  };

  const renderPostItem = ({ item }: { item: GroupPostDisplay }) => {
    const screenWidth = Dimensions.get('window').width;
    const imageHeight = item.media_url && item.media_type === 'image' ? screenWidth * 0.75 : 0; 

    return (
      <View style={styles.postItemContainer}>
        <View style={styles.postHeader}>
          <Image 
            source={{ uri: item.author_avatar_url || 'https://placehold.co/40x40/e1f0ff/333333?text=User' }} 
            style={styles.authorAvatar}
          />
          <Text style={styles.authorName}>{item.author_full_name || 'Anonymous'}</Text>
          {/* Timestamp could go here */}
        </View>
        {item.content && <Text style={styles.postContent}>{item.content}</Text>}
        {item.media_url && item.media_type === 'image' && (
          <GroupPostImage 
            imagePath={item.media_url} 
            imageStyle={[styles.postImage, { width: screenWidth - 32, height: imageHeight }]}
            resizeMode="cover"
          />
        )}
        {item.media_url && item.media_type === 'video' && (
          <View style={[styles.postImage, { width: screenWidth - 32, height: imageHeight, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{color: '#fff'}}>Video: {item.media_url}</Text>
          </View>
          // <VideoPlayer source={{ uri: item.media_url }} style={styles.postVideo} />
        )}
        <View style={styles.postFooter}>
          <Text style={styles.postTimestamp}>{new Date(item.post_created_at).toLocaleDateString()}</Text>
          {/* Placeholder for Likes and Comments */}
          {/* <TouchableOpacity style={styles.actionButton}><Ionicons name="heart-outline" size={24} color="#333" /><Text> {item.likes_count || 0}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="chatbubble-outline" size={24} color="#333" /><Text> {item.comments_count || 0}</Text></TouchableOpacity> */}
        </View>
      </View>
    );
  };

  const ListFooter = () => {
    if (loadingMore) return <ActivityIndicator style={{ marginVertical: 20 }} size="small" color="#007AFF" />;
    if (!hasMorePosts && posts.length > 0) return <Text style={styles.noMorePosts}>No more posts</Text>;
    return null;
  };

  if (loading && posts.length === 0) { 
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchPosts(0, true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Placeholder for Post Creation Input - To be added later */}
      {/* <View style={styles.createPostInputArea}>
        <TextInput placeholder={`What's on your mind, ${currentUser?.user_metadata?.full_name}?`} />
        <TouchableOpacity><Text>Post</Text></TouchableOpacity>
      </View> */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.group_post_id}
        contentContainerStyle={styles.listContentContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooter}
        onRefresh={() => fetchPosts(0, true)} 
        refreshing={loading && posts.length > 0} 
        ListEmptyComponent={() => (
            !loading && !error && posts.length === 0 ? (
              <View style={styles.center}><Text>No posts in this group yet. Be the first to share!</Text></View>
            ) : null
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  postItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 12,
    padding: 12,
    shadowColor: "#000",
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
    marginBottom: 8,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    color: '#1c1e21',
  },
  postImage: {
    borderRadius: 8,
    marginBottom: 10,
    // width set dynamically
    // height set dynamically
  },
  postVideo: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 8,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBEEF0',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#606770',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  noMorePosts: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
  // Styles for create post area - to be refined
  createPostInputArea: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  }
});

export default GroupPostsSection;
