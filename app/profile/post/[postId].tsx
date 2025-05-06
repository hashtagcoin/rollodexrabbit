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
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Heart } from 'lucide-react-native';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  console.log('--- PostDetailScreen (app/profile/post/[postId].tsx) ---');
  console.log('Received postId for detail screen:', postId);
  const navigation = useNavigation();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadPostAndComments();
  }, [postId]);

  useEffect(() => {
    console.log('Post state updated:', post);
  }, [post]);

  async function loadPostAndComments() {
    setLoading(true);
    console.log('loadPostAndComments called with postId:', postId);
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('post_id', postId)
        .single();

      console.log('Attempting to fetch post with post_id (actual query):', postId);
      console.log('Fetched postData from Supabase:', postData);
      console.log('Error fetching post from Supabase:', postError);

      if (postError) {
        console.error('Detailed Supabase post fetch error:', postError);
      }
      setPost(postData);

      // Fetch comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      console.log('Fetched commentData from Supabase:', commentData);
      console.log('Error fetching comments from Supabase:', commentError);

      if (commentError) {
        console.error('Detailed Supabase comment fetch error:', commentError);
      }
      setComments(commentData || []);
    } catch (e) {
      console.error('Error in loadPostAndComments function catch block:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, content: commentText }]);
      if (error) throw error;
      setCommentText('');
      inputRef.current?.clear();
      loadPostAndComments();
    } catch (e) {
      // TODO: handle error
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>
      {post && (
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <Image source={{ uri: post.avatar_url }} style={styles.avatar} />
            <Text style={styles.username}>{post.full_name}</Text>
          </View>
          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          )}
          <Text style={styles.postContent}>{post.content}</Text>
        </View>
      )}
      <FlatList
        data={comments}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Image source={{ uri: item.avatar_url }} style={styles.commentAvatar} />
            <View style={styles.commentBody}>
              <Text style={styles.commentUser}>{item.full_name}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={loadPostAndComments}
        ListEmptyComponent={<Text style={styles.emptyComments}>No comments yet.</Text>}
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
      />
      <View style={styles.commentInputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          accessible
          accessibilityLabel="Add a comment"
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={posting || !commentText.trim()}
          style={styles.sendButton}
          accessibilityLabel="Send comment"
        >
          <Text style={{ color: posting || !commentText.trim() ? '#aaa' : '#007AFF', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginVertical: 12,
    backgroundColor: '#eee',
  },
  postContent: {
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#222',
  },
  emptyComments: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 32,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
