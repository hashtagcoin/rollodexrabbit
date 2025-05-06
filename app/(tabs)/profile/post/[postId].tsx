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
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Heart } from 'lucide-react-native';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
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

  async function loadPostAndComments() {
    setLoading(true);
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (postError) {
        throw postError;
      }
      setPost(postData);

      // Fetch comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments_with_users') // View recommended for user info
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentError) {
        throw commentError;
      }
      setComments(commentData || []);
    } catch (e) {
      // TODO: handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, content: commentText }]);
      if (error) throw error;
      setCommentText('');
      await loadPostAndComments();
    } catch (e) {
      // TODO: handle error
    } finally {
      setPosting(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadPostAndComments();
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>
      <View style={styles.postContainer}>
        <Image source={{ uri: post.image_url }} style={styles.postImage} />
        <View style={styles.postInfo}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postDescription}>{post.description}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity>
              <Heart size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.commentsContainer}>
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Text style={styles.commentAuthor}>{item.user.username}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
      <View style={styles.commentInputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          value={commentText}
          onChangeText={(text) => setCommentText(text)}
          placeholder="Add a comment..."
        />
        <TouchableOpacity onPress={handleAddComment} disabled={posting}>
          <Text style={styles.commentButton}>Post</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postContainer: {
    padding: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  postInfo: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postDescription: {
    fontSize: 16,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  commentsContainer: {
    padding: 16,
  },
  comment: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  commentAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 16,
    color: '#666',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  commentInput: {
    flex: 1,
    height: 40,
    padding: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
  },
  commentButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007aff',
    marginLeft: 10,
  },
});
