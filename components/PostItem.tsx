import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { MessageCircle, Share2, Bookmark as BookmarkIcon } from 'lucide-react-native';
import PostFeedImage from './PostFeedImage'; // Assuming PostFeedImage is in the same components directory
import { Post } from '../lib/types';

interface PostItemProps {
  post: Post;
  onLike: (postId: string, liked?: boolean) => void;
  onBookmark: (postId: string, bookmarked?: boolean) => void;
  onCommentPress: (postId: string) => void;
  onSharePress: (postId: string) => void;
  onOpenPostImage?: (postId: string) => void; 
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  onLike,
  onBookmark,
  onCommentPress,
  onSharePress,
  onOpenPostImage,
}) => {
  const handleOpenImage = () => {
    if (onOpenPostImage) {
      onOpenPostImage(post.post_id);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={
            post.author_avatar_url && !post.author_avatar_url.startsWith('file:///')
              ? { uri: post.author_avatar_url }
              : require('../assets/rollodex-icon-lrg.png') // Adjusted path
          }
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.userName}>{post.author_full_name}</Text>
          <Text style={styles.postTime}>
            {new Date(post.post_created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.caption}>
        <Text style={styles.userName}>{post.author_full_name} </Text>
        {post.content}
      </Text>

      {post.media_urls &&
        post.media_urls.length > 0 &&
        post.media_urls[0] &&
        !post.media_urls[0].startsWith('file:///') && (
        <TouchableOpacity onPress={handleOpenImage}>
          <PostFeedImage 
            imagePath={post.media_urls[0]}
            style={styles.postImage} 
          />
        </TouchableOpacity>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postActionButton}
          onPress={() => onLike(post.post_id, post.current_user_has_liked)}
        >
          <AntDesign 
            name={post.current_user_has_liked ? "heart" : "hearto"} 
            size={24} 
            color={post.current_user_has_liked ? "red" : "grey"} 
          />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postActionButton}
          onPress={() => onCommentPress(post.post_id)}
        >
          <MessageCircle size={24} color="#666" />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.postActionButton} 
          onPress={() => onSharePress(post.post_id)}
        > 
          <Share2 size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.postActionButton}
          onPress={() => onBookmark(post.post_id, post.current_user_has_bookmarked)}
        >
          <BookmarkIcon 
            size={24} 
            color={post.current_user_has_bookmarked ? "#FFC107" : "#666"} 
            fill={post.current_user_has_bookmarked ? "#FFC107" : "none"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    padding: 16,
    backgroundColor: '#fff', // Added for distinct background if needed
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
    color: '#333',
    marginVertical: 8,
    lineHeight: 22, // Added for better readability
  },
  postImage: {
    width: '100%',
    height: 300, // Increased height for better visual impact
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0', // Placeholder background for images
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Added padding for easier touch
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6, // Adjusted spacing
  },
});

export default PostItem;
