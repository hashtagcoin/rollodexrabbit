import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Heart } from 'lucide-react-native';

export default function PostDetailScreen() {
  const { postId: rawPostId } = useLocalSearchParams();
  const postId = Array.isArray(rawPostId) ? rawPostId[0] : rawPostId;

  const navigation = useNavigation();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Condition to call loadPostAndComments: postId must be a string, not empty, and not the literal string "undefined"
    if (typeof postId === 'string' && postId.trim() !== '' && postId !== 'undefined') {
      loadPostAndComments(postId);
    } else {
      // Handle all other cases:
      // - postId is truly undefined (route params might be loading)
      // - postId is the string "undefined"
      // - postId is an empty string or only whitespace
      // - postId is some other non-string type (less likely with current derivation)

      if (postId === undefined) {
        // postId is truly undefined. Params might still be loading.
        // The UI will show a loading spinner because `loading` is true by default.
        // If postId never resolves, and loading eventually becomes false, the "Post not found" message will appear.
        console.log('PostDetailScreen: postId is undefined, waiting for route params to resolve.');
      } else {
        // postId is defined but invalid (e.g., it's the string "undefined", or an empty string).
        // In this case, we know it won't become a valid post ID for fetching.
        console.error('PostDetailScreen: Invalid or unusable postId received (e.g., "undefined" string, empty string):', postId);
        setLoading(false); // Stop loading spinner
        setPost(null);     // Ensure no stale data and trigger "Post not found" UI
      }
    }
  }, [postId]);

  async function loadPostAndComments(currentPostId: string) {
    console.log(`Loading post and comments for postId: ${currentPostId}`);
    setLoading(true);
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, user_profiles (id, full_name, avatar_url)')
        .eq('post_id', currentPostId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        if (postError.code === 'PGRST116') {
          setPost(null);
        } else {
          throw postError;
        }
      } else {
        setPost(postData);
      }

      const { data: commentData, error: commentError } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('post_id', currentPostId)
        .order('created_at', { ascending: true });

      if (commentError) {
        console.error('Error fetching comments:', commentError);
        throw commentError;
      }
      setComments(commentData || []);
    } catch (e: any) {
      console.error('Failed to load post or comments:', e.message);
      setPost(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAddComment() {
    if (typeof postId !== 'string' || postId.trim() === '') {
      console.error('Cannot add comment: postId is invalid.', postId);
      Alert.alert('Error', 'Cannot add comment: Post ID is missing.');
      return;
    }
    if (!commentText.trim()) {
      Alert.alert('Empty Comment', 'Please enter some text for your comment.');
      return;
    }

    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // This error will be caught by the generic catch block below
        throw new Error('User not authenticated. Please log in to comment.');
      }

      const { error: insertError } = await supabase
        .from('comments')
        .insert([{ post_id: postId, content: commentText.trim(), user_id: user.id }]);

      if (insertError) {
        // Handle Supabase insert error specifically
        console.error('Error adding comment (Supabase insert):', insertError);
        Alert.alert('Commenting Failed', insertError.message);
        // Do not re-throw if this is considered a final handling for this specific error type
      } else {
        // Success
        setCommentText('');
        await loadPostAndComments(postId); // Refresh comments and post
      }
    } catch (e: any) {
      // This catch block handles errors from supabase.auth.getUser(), !user check, or other unexpected errors.
      // It will NOT handle `insertError` if `insertError` is not re-thrown above.
      console.error('Failed to add comment (generic error):', e.message);
      Alert.alert('Error', e.message); // Display the message from the thrown error (e.g., auth error message)
    } finally {
      setPosting(false);
    }
  }

  async function handleRefresh() {
    if (typeof postId === 'string' && postId.trim() !== '') {
      setRefreshing(true);
      await loadPostAndComments(postId);
    } else {
      console.warn('Cannot refresh: postId is invalid.');
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.containerLoadingOrError}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.containerLoadingOrError}>
        <View style={styles.errorPageHeader}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/community')} style={styles.backButtonErrorPage}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.errorPageTitle}>Error</Text>
        </View>
        <Text style={styles.errorText}>Post not found or could not be loaded.</Text>
        {typeof postId === 'string' && postId.trim() !== '' && (
          <TouchableOpacity onPress={() => loadPostAndComments(postId)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/community')}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{post.user_profiles?.full_name || 'Post'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        ListHeaderComponent={() => (
          <View style={styles.postContainer}>
            {post.media_urls && post.media_urls[0] && (
              <Image source={{ uri: post.media_urls[0] }} style={styles.postImage} />
            )}
            <View style={styles.postInfo}>
              <Text style={styles.postCaption}>{post.caption}</Text>
            </View>
          </View>
        )}
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <View style={styles.commentHeader}>
              {item.user_profiles?.avatar_url && (
                <Image source={{ uri: item.user_profiles.avatar_url }} style={styles.commentAvatar} />
              )}
              <Text style={styles.commentAuthor}>{item.user_profiles?.full_name || 'User'}</Text>
            </View>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.comment_id?.toString() || Math.random().toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
        )}
      />
      <View style={styles.commentInputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          value={commentText}
          onChangeText={(text) => setCommentText(text)}
          placeholder="Add a comment..."
          placeholderTextColor="#8E8E93"
          multiline
        />
        <TouchableOpacity onPress={handleAddComment} disabled={posting} style={styles.commentButtonContainer}>
          {posting ? <ActivityIndicator color="#007AFF" /> : <Text style={styles.commentButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerLoadingOrError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  errorPageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    zIndex: 10,
  },
  backButtonErrorPage: {
    padding: 8,
  },
  errorPageTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginRight: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F8F8F8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  postContainer: {
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  postInfo: {
    padding: 16,
  },
  postCaption: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1C1C1E',
  },
  commentsContainer: {
  },
  comment: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#D8D8D8',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
  },
  noCommentsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    color: '#8E8E93',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F8F8F8',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#D1D1D6',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  commentButtonContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  commentButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
