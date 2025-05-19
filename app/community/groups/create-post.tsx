import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadMedia } from '../../../lib/mediaService'; // Assuming this path and function
import AppHeader from '../../../components/AppHeader'; // Corrected path
// import EmojiPicker from 'rn-emoji-keyboard'; // We'll add this later

export default function CreateGroupPostScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (!groupId) {
      Alert.alert('Error', 'Group ID is missing. Cannot create post.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [groupId, router]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) {
      Alert.alert('Empty Post', 'Please add some content or an image to your post.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    if (!groupId) {
      Alert.alert('Error', 'Group ID is missing. Cannot submit post.');
      return;
    }

    setIsSubmitting(true);
    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | null = null;

    try {
      if (image && image.uri) {
        const uriParts = image.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1] || 'jpg'; // Default to jpg if no extension
        
        // This will be the path within the Supabase bucket, including the filename
        const storagePath = `${user.id}/group_post_${groupId}_${user.id}_${Date.now()}.${fileExtension}`;

        // Convert ImagePickerAsset URI to a Blob
        const response = await fetch(image.uri);
        const blob = await response.blob();

        // Ensure the blob has a type, fallback if necessary (though fetch usually sets it)
        const blobWithType = blob.type && blob.type !== 'application/octet-stream' 
          ? blob 
          : new Blob([blob], { type: image.mimeType || `image/${fileExtension}` });

        const uploadedUrl = await uploadMedia(
          blobWithType,       // file: File | Blob
          'group-posts',      // bucket: BucketName
          storagePath,        // path: string (full path in bucket)
          'image',            // fileType: 'image' | 'video' | 'document'
          true                // isPublic: boolean (group posts are public)
        );
        
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
          mediaType = 'image'; 
        } else {
          throw new Error('Failed to upload image.');
        }
      }

      const postDataToInsert = {
        group_id: groupId,
        user_id: user.id,
        content: content.trim() || null, // Store null if content is just whitespace
        media_url: mediaUrl,
        media_type: mediaType,
        // status: 'approved', // Or 'pending_approval' based on group settings/moderation rules
      };

      const { error: insertError } = await supabase
        .from('group_posts')
        .insert([postDataToInsert]);

      if (insertError) {
        console.error('Error inserting post:', insertError);
        throw new Error(`Failed to save post: ${insertError.message}`);
      }

      Alert.alert('Post Created!', 'Your post has been successfully submitted.');
      router.back(); // Navigate back after successful submission

    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader 
        title="Create Group Post"
        showBackButton={router.canGoBack()}
        onBackPress={router.back}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          multiline
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={24} color="#007AFF" />
          <Text style={styles.imagePickerText}>{image ? 'Change Image' : 'Add Image'}</Text>
        </TouchableOpacity>

        {image && image.uri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit} 
          disabled={isSubmitting || !groupId}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 250,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
});