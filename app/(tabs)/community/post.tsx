import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react-native';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
};

export default function PostDetails() {
  const params = useLocalSearchParams();
  console.log("[SCREEN] Loaded community/post.tsx", { params });
  console.log("[DEBUG] Params received in community/post.tsx", params);
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadPost() {
    console.log('[loadPost] Called with id:', id);
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      console.log('[loadPost] Fetching from posts_with_users...');
      const { data: enrichedPostData, error: postError } = await supabase
        .from('posts_with_users') // Use the view
        .select('*') // Select all columns from the view
        .eq('post_id', id as string) // Ensure id is correctly typed/used for post_id
        .single(); // Expect a single post

      if (postError) {
        console.error('[loadPost] Supabase error fetching post:', postError);
        throw postError;
      }
      if (!enrichedPostData) {
        console.warn('[loadPost] Post not found in view for id:', id);
        throw new Error('Post not found in view.');
      }

      console.log('[loadPost] enrichedPostData:', enrichedPostData);

      // The enrichedPostData should now contain fields like author_full_name, author_avatar_url directly.
      // Map them to the structure the rest of the component expects for 'post' state.
      const postForState = {
        ...enrichedPostData,
        full_name: enrichedPostData.author_full_name, // Assuming view provides 'author_full_name'
        avatar_url: enrichedPostData.author_avatar_url, // Assuming view provides 'author_avatar_url'
        caption: enrichedPostData.content, // Assuming view provides 'content' for caption
        media_urls: enrichedPostData.media_urls, // Assuming view provides 'media_urls'
        created_at: enrichedPostData.post_created_at, // Assuming view provides 'post_created_at'
        // Ensure all fields expected by the component's render logic for 'post' are present and correctly mapped.
      };
      setPost(postForState);

      // --- Comment loading logic (remains largely the same) ---
      console.log('[loadPost] Fetching comments...');
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('[loadPost] Supabase error fetching comments:', commentsError);
        throw commentsError;
      }
      
      console.log('[loadPost] commentsData:', commentsData);
      // Fetch user profiles separately and join manually for comments
      if (commentsData && commentsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(commentsData.map((comment) => comment.user_id))];
        
        // Fetch user profiles
        const { data: userProfiles, error: userError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (userError) {
          console.error('[loadPost] Supabase error fetching user profiles:', userError);
          throw userError;
        }
        
        // Create a lookup map for user profiles
        const userMap: { [key: string]: { id: string, full_name: string, avatar_url: string | null } } = {};
        userProfiles?.forEach(profile => {
          userMap[profile.id] = profile;
        });
        
        // Join the data manually
        const enrichedComments = commentsData.map(comment => ({
          ...comment,
          full_name: userMap[comment.user_id]?.full_name || 'Unknown User',
          avatar_url: userMap[comment.user_id]?.avatar_url || null
        }));
        
        console.log('[loadPost] Enriched comments:', enrichedComments);
        setComments(enrichedComments);
      } else {
        console.log('[loadPost] No comments found.');
        setComments([]);
      }
    } catch (e: unknown) {
      console.error('Error loading post and comments:', e); // Updated error message
      const errorMessage = e instanceof Error ? e.message : 'Failed to load post details';
      setError(errorMessage);
    } finally {
      console.log('[loadPost] Finally block reached, setLoading to false.');
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('[useEffect] Detected id:', id);
    if (id && typeof id === 'string') { // Ensure id is a string as expected by Supabase
      loadPost();
    } else {
      console.warn('[useEffect] Post ID is missing or not a string. ID:', id);
      setError("Post ID is missing or invalid.");
      setLoading(false); // Stop loading if ID is missing/invalid
    }
  }, [id]);

  const handleComment = async () => {
    try {
      if (!newComment.trim()) {
        setError('Please write something to comment');
        return;
      }

      setSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (commentError) throw commentError;

      setNewComment('');
      loadPost();
    } catch (e: unknown) {
      console.error('Error creating post:', e);
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.postCard}>
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
            <TouchableOpacity style={styles.actionButton}>
              <Send size={24} color="#666" />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Image
                source={
                  comment.avatar_url
                    ? { uri: comment.avatar_url }
                    : require('../../../assets/rollodex-icon-lrg.png')
                }
                style={styles.commentAvatar}
                resizeMode="cover"
              />
              <View style={styles.commentContent}>
                <Text style={styles.commentUserName}>
                  {comment.full_name}
                </Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInput}>
        {error && (
          <View style={styles.error}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
            onPress={handleComment}
            disabled={submitting}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff3b30',
    marginTop: 24,
  },
  postCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
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
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentInput: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
});