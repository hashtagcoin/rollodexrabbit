import React, { useState } from 'react';
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, X, Upload, Camera } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../providers/AuthProvider';
// Import the full RewardsService upfront to avoid dynamic imports
import { RewardsService } from '../../lib/rewardsService';

// Add TypeScript declaration for uuid
declare module 'uuid' {
  export function v4(): string;
}
import { v4 as uuidv4 } from 'uuid';

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Request permissions to access the photo library
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library to upload images.');
      return false;
    }
    return true;
  };

  // Pick image from library
  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      // Make sure we don't exceed 5 images total
      const newImages = result.assets.map(asset => asset.uri);
      if (selectedImages.length + newImages.length > 5) {
        Alert.alert('Limit Exceeded', 'You can only upload up to 5 images per post.');
        return;
      }
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      if (selectedImages.length >= 5) {
        Alert.alert('Limit Exceeded', 'You can only upload up to 5 images per post.');
        return;
      }
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  // Remove an image from the selection
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  // Upload images to storage and get the URLs
  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadPromises = selectedImages.map(async (uri, index) => {
      try {
        const fileExt = uri.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `posts/${user?.id}/${fileName}`;

        // Fetch the image data
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Update progress
        setProgress(((index + 1) / selectedImages.length) * 50);
        
        return publicUrlData.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter(url => url !== null) as string[];
  };

  // Create the post in the database
  const createPost = async () => {
    if (!caption.trim() && selectedImages.length === 0) {
      Alert.alert('Empty Post', 'Please add some text or an image to your post.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'You need to be logged in to create a post.');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Upload images first if any
      const mediaUrls = await uploadImages();
      setProgress(50);

      // Create post in the database
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim(),
          media_urls: mediaUrls,
        })
        .select()
        .single();

      setProgress(100);

      if (error) throw error;

      // Award points for creating a post
      try {
        if (user) {
          await RewardsService.trackActivity(user.id, 'post_created', {
            post_type: selectedImages.length > 0 ? 'media' : 'text',
          });
        }
      } catch (rewardError) {
        console.log('Rewards not awarded:', rewardError);
      }

      // Success! Navigate back to where the user came from
      setTimeout(() => {
        // Store successfully created post in router.params
        // This way both the community feed and profile can refresh if needed
        router.push({
          pathname: '/(tabs)/community',
          params: { 
            newPost: 'true',
            postId: data?.id || 'unknown'
          }
        });
      }, 500); // Small delay to show completion
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.container}>
        <AppHeader 
          title="Create Post" 
          showBackButton={true} 
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <TextInput
            style={styles.captionInput}
            placeholder="What would you like to share?"
            placeholderTextColor="#999"
            multiline
            value={caption}
            onChangeText={setCaption}
            maxLength={1000}
          />
          
          {selectedImages.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageScrollContainer}
              >
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.selectedImageContainer}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.addMediaContainer}>
            <Text style={styles.addMediaLabel}>Add to Your Post</Text>
            <View style={styles.mediaButtons}>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={pickImage}
                disabled={loading}
              >
                <ImageIcon size={24} color="#007AFF" />
                <Text style={styles.mediaButtonText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={takePhoto}
                disabled={loading}
              >
                <Camera size={24} color="#FF9500" />
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.mediaLimit}>
              {selectedImages.length}/5 images selected
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>
                {progress < 50 ? 'Uploading images...' : 'Creating post...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.postButton,
                (!caption.trim() && selectedImages.length === 0) && styles.postButtonDisabled
              ]}
              onPress={createPost}
              disabled={(!caption.trim() && selectedImages.length === 0) || loading}
            >
              <Upload size={20} color="#fff" />
              <Text style={styles.postButtonText}>Publish Post</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedImagesContainer: {
    marginBottom: 16,
  },
  imageScrollContainer: {
    paddingRight: 8,
  },
  selectedImageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 16,
    marginBottom: 16,
  },
  addMediaLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  mediaLimit: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  postButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
