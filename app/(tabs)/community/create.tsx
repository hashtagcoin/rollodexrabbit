import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Image as ImageIcon,
  Camera,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import ModernImagePicker from '../../../components/ModernImagePicker';
import { decode as base64ToArrayBuffer } from '../../../lib/base64Utils'; // Import utility
import * as FileSystem from 'expo-file-system'; // Import FileSystem

export default function CreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const handlePost = async () => {
    try {
      if (!caption && !mediaUrl) {
        setError('Please write something or add an image to post');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let supabaseMediaUrl: string | null = null;

      if (mediaUrl) {
        console.log('Media URL selected:', mediaUrl);
        const fileExtMatch = mediaUrl.match(/\.([a-zA-Z0-9]+)$/);
        const fileExt = fileExtMatch ? fileExtMatch[1].toLowerCase() : 'jpg';
        const baseFileName = `${user.id}_post_${Date.now()}.${fileExt}`;
        const pathInBucket = `post_media/${user.id}/${baseFileName}`; // Store in user-specific folder within post_media

        let uploadBody: FormData | ArrayBuffer;
        let uploadContentType: string;

        if (Platform.OS === 'web') {
          console.log('Fetching media URL for blob (Web):', mediaUrl);
          const response = await fetch(mediaUrl);
          const webBlob = await response.blob();
          if (!webBlob || webBlob.size === 0) {
            console.error('Failed to create blob or blob is empty');
            throw new Error('Failed to process image data or image is empty.');
          }
          uploadContentType = webBlob.type || `image/${fileExt}`;

          const formData = new FormData();
          formData.append('file', webBlob, baseFileName);
          uploadBody = formData;
          console.log('Using FormData for Web post. Blob Size:', webBlob.size, 'Type:', uploadContentType);
        } else {
          // Native (iOS/Android): Read file as base64, then convert to ArrayBuffer
          console.log('Reading media file as base64 (Native):', mediaUrl);
          const base64String = await FileSystem.readAsStringAsync(mediaUrl, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (!base64String) {
            console.error('Failed to read media file as base64 string');
            throw new Error('Failed to read media file as base64 string');
          }

          try {
            uploadBody = base64ToArrayBuffer(base64String);
          } catch (e) {
            console.error('Error converting base64 to ArrayBuffer:', e);
            throw new Error('Failed to convert media data');
          }

          uploadContentType = `image/${fileExt}`; // Crucial for ArrayBuffer upload
          console.log('Created ArrayBuffer for post (Native). Size:', uploadBody.byteLength, 'Type:', uploadContentType);

          if (!uploadBody || uploadBody.byteLength === 0) {
            console.error('Could not process media data to ArrayBuffer or ArrayBuffer is empty');
            throw new Error('Could not process media data to ArrayBuffer or ArrayBuffer is empty');
          }
        }

        console.log('Uploading post media to Supabase. Path:', pathInBucket, 'Content-Type:', uploadContentType);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post_media')
          .upload(pathInBucket, uploadBody, {
            contentType: uploadContentType,
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase post media upload error:', uploadError);
          throw uploadError;
        }

        console.log('Supabase post media upload successful:', uploadData);

        const { data: publicUrlData } = supabase.storage
          .from('post_media')
          .getPublicUrl(pathInBucket);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to get public URL for post media');
        }
        supabaseMediaUrl = publicUrlData.publicUrl;
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption,
          media_urls: supabaseMediaUrl ? [supabaseMediaUrl] : [],
        });

      if (postError) throw postError;

      router.back();
    } catch (e: unknown) {
      console.error('Error creating post:', e);
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={loading}
        >
          <Text style={styles.postButtonText}>
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.error}>
          <AlertCircle size={20} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        value={caption}
        onChangeText={setCaption}
        placeholder="What's on your mind?"
        multiline
        numberOfLines={4}
      />

      <ModernImagePicker
        imageUri={mediaUrl}
        onImagePicked={setMediaUrl}
        label="Add Photo"
        aspect={[4,3]}
        crop={true}
      />

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
    justifyContent: 'space-between',
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
    flex: 1,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    margin: 24,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ff3b30',
    flex: 1,
  },
  input: {
    padding: 24,
    fontSize: 16,
    color: '#1a1a1a',
    height: 120,
    textAlignVertical: 'top',
  },
  preview: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
  },
});