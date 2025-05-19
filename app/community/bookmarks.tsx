import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { supabase } from '../../lib/supabase';
import { Post } from '../../lib/types';
import PostItem from '../../components/PostItem';
import { router } from 'expo-router';
import { User } from '@supabase/supabase-js';

export default function BookmarksScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUserAndPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchBookmarkedPosts(user.id);
      } else {
        setError('You must be logged in to see your bookmarks.');
        setBookmarkedPosts([]);
        setLoading(false);
      }
    };
    loadUserAndPosts();
  }, []);

  const fetchBookmarkedPosts = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: bookmarkEntries, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId);

      if (bookmarksError) throw bookmarksError;

      if (!bookmarkEntries || bookmarkEntries.length === 0) {
        setBookmarkedPosts([]);
        setLoading(false);
        return;
      }

      const postIds = bookmarkEntries.map(b => b.post_id);

      const { data: postsData, error: postsError } = await supabase
        .from('posts_with_users')
        .select('*')
        .in('post_id', postIds)
        .order('post_created_at', { ascending: false });

      if (postsError) throw postsError;
      setBookmarkedPosts(postsData as Post[] || []);
    } catch (err: any) {
      console.error('Error fetching bookmarked posts:', err);
      setError(err.message || 'Failed to load bookmarks');
      setBookmarkedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbookmarkFromList = async (postId: string) => {
    if (!currentUser) {
      Alert.alert("Error", "User not found.");
      return;
    }

    const originalPosts = [...bookmarkedPosts];
    // Optimistically remove from UI
    setBookmarkedPosts(prevPosts => prevPosts.filter(p => p.post_id !== postId));

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .match({ user_id: currentUser.id, post_id: postId });

      if (error) throw error;
      // Optionally, show a success message or simply rely on UI change

    } catch (error: any) {
      console.error('Error unbookmarking post:', error.message);
      Alert.alert("Error", "Could not unbookmark. Please try again.");
      // Revert optimistic update
      setBookmarkedPosts(originalPosts);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My Bookmarks" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading && <ActivityIndicator size="large" color="#007AFF" />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && bookmarkedPosts.length === 0 && (
          <Text style={styles.emptyText}>You haven't bookmarked any posts yet.</Text>
        )}
        {!loading && !error && bookmarkedPosts.map(post => (
          <PostItem
            key={post.post_id}
            post={post}
            onLike={(postId, liked) => console.log('Like TBD on bookmarks screen', postId, liked)}
            onBookmark={() => handleUnbookmarkFromList(post.post_id)}
            onCommentPress={(postId) => router.push({ pathname: '/community/post', params: { id: postId } })}
            onSharePress={(postId) => console.log('Share TBD on bookmarks screen', postId)}
            onOpenPostImage={(postId) => router.push({ pathname: '/community/post', params: { id: postId } })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
