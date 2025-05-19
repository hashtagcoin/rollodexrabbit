import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert, // Added Alert import
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase'; // Adjusted path
import {
  ArrowLeft,
  Image as ImageIcon,
  Camera,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import ModernImagePicker from '../../../../components/ModernImagePicker'; // Adjusted path
import { decode as base64ToArrayBuffer } from '../../../../lib/base64Utils'; // Restored import
import * as FileSystem from 'expo-file-system';

export default function CreateGroupPost() { // Renamed component
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);

  const { group_id } = useLocalSearchParams<{ group_id?: string }>(); // Get group_id

  const handlePost = async () => {
    try {
      if (!group_id) { // Validate group_id
        setError('Group ID is missing. Cannot create post.');
        setLoading(false);
        return;
      }

      if (!caption && !mediaUrl) {
        setError('Please write something or add an image to post');
        return;
      }

      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let supabaseMediaUrl: string | null = null;

      let actualMediaMimeType: string | undefined = mediaMimeType === null ? undefined : mediaMimeType;

      if (mediaUrl) {
        console.log('Media URL selected:', mediaUrl);

        if (!actualMediaMimeType) { 
          const fileExt = mediaUrl.split('.').pop()?.toLowerCase();
          if (fileExt === 'jpg' || fileExt === 'jpeg') {
            actualMediaMimeType = 'image/jpeg';
          } else if (fileExt === 'png') {
            actualMediaMimeType = 'image/png';
          } else if (fileExt === 'gif') {
            actualMediaMimeType = 'image/gif';
          }
          // Add more common image types if needed

          if (actualMediaMimeType) {
            console.warn(`Media MIME type was undefined, inferred as ${actualMediaMimeType} from URI: ${mediaUrl}`);
          } else {
            Alert.alert('Upload Error', 'Could not determine the media file type. Please select a common image format (JPEG, PNG, GIF).');
            setLoading(false);
            return;
          }
        }

        function getExtensionFromMimeType(mimeType: string): string {
          switch (mimeType) {
            case 'image/png': return 'png';
            case 'image/jpeg': return 'jpg';
            case 'image/jpg': return 'jpg';
            case 'image/webp': return 'webp';
            case 'image/gif': return 'gif';
            default: return 'jpg';
          }
        }

        let uploadBody: FormData | ArrayBuffer | Blob;
        let pathInBucket: string;
        let uploadContentTypeFinal: string; // This will hold the final content type for upload

        if (Platform.OS === 'web') {
          try {
            console.log('Fetching URI for blob (Web):', mediaUrl);
            const response = await fetch(mediaUrl);
            const webBlob = await response.blob();
            if (!webBlob || webBlob.size === 0) {
              Alert.alert('Error', 'Web: Could not read image data or image is empty.');
              setLoading(false);
              return;
            }
            
            // Determine the content type for upload and also use it for extension
            uploadContentTypeFinal = actualMediaMimeType || webBlob.type || 'image/jpeg'; // Default to image/jpeg if unknown
            const ext = getExtensionFromMimeType(uploadContentTypeFinal); // Use helper function

            const baseFileName = `${user.id}_grouppost_${Date.now()}.${ext}`;
            pathInBucket = `${user.id}/${baseFileName}`;
            
            const formData = new FormData();
            formData.append('file', webBlob, baseFileName);
            uploadBody = formData;
            console.log('Using FormData for Web post. Blob Size:', webBlob.size, 'Type:', uploadContentTypeFinal, 'Path:', pathInBucket);
          } catch (e: any) {
            Alert.alert('Error', `Web: Error processing file: ${e.message}`);
            setLoading(false);
            return;
          }
        } else {
          // Native (iOS/Android) - Now using Blob
          try {
            console.log('Fetching URI for blob (Native):', mediaUrl);
            const response = await fetch(mediaUrl); // Expo's fetch can handle local file URIs
            const blob = await response.blob();

            if (!blob || blob.size === 0) {
              Alert.alert('Error', 'Native: Could not read image data as Blob or Blob is empty.');
              setLoading(false);
              return;
            }

            const nativeFileExtMatch = mediaUrl.match(/\.([a-zA-Z0-9]+)$/);
            const nativeFileExtension = nativeFileExtMatch ? nativeFileExtMatch[1].toLowerCase() : 'jpg';
            
            // Standardize native path construction to match web
            const nativeBaseFileName = `${user.id}_grouppost_${Date.now()}.${nativeFileExtension}`;
            pathInBucket = `${user.id}/${nativeBaseFileName}`;
            // Use blob.type if available, otherwise infer. actualMediaMimeType (from picker) might also be an option here if blob.type is generic.
            uploadContentTypeFinal = blob.type && blob.type !== 'application/octet-stream' ? blob.type : `image/${nativeFileExtension}`; 

            console.log('Using Blob for Native post. Size:', blob.size, 'Blob Type:', blob.type, 'Upload Content-Type:', uploadContentTypeFinal, 'Path:', pathInBucket);

            uploadBody = blob; // Use the Blob directly
          } catch (e: any) {
            Alert.alert('Error', `Native: Error processing file to Blob: ${e.message}`);
            setLoading(false);
            return;
          }
        }

        // Common Supabase upload call - MOVED HERE, AFTER platform-specific logic
        console.log('Uploading group post media to Supabase. Path:', pathInBucket, 'Content-Type:', uploadContentTypeFinal);
        
        let uploadTaskError: any = null;
        let uploadTaskData: any = null;

        try {
          const result = await supabase.storage
            .from('group-posts') 
            .upload(pathInBucket, uploadBody, { // uploadBody, pathInBucket, uploadContentTypeFinal are set by platform blocks
              upsert: true,
              contentType: uploadContentTypeFinal,
            });
          uploadTaskData = result.data;
          uploadTaskError = result.error;
        } catch (err) {
          // Handle potential network errors or other synchronous errors from the upload call itself
          console.error('Synchronous error during Supabase upload attempt:', err);
          uploadTaskError = { error: 'Network error', message: (err as Error)?.message || String(err) };
        }
        
        if (uploadTaskError) {
          console.error('Supabase upload error:', uploadTaskError);
          Alert.alert('Upload Error', `Failed to upload media: ${uploadTaskError.message}`);
          setLoading(false);
          return;
        }

        supabaseMediaUrl = uploadTaskData?.path || uploadTaskData?.Key || null;
      }

      const postInsertPayload = {
        user_id: user?.id,
        group_id: group_id, // Use actual group_id
        content: caption, // Changed from caption to content
        media_url: supabaseMediaUrl, // Changed from media_urls to media_url, and ensure it's a single URL string
        media_type: supabaseMediaUrl && actualMediaMimeType ? (actualMediaMimeType.startsWith('image/') ? 'image' : actualMediaMimeType.startsWith('video/') ? 'video' : null) : null,
      };

      console.log('[DIAG] About to insert group post. Insert payload:', postInsertPayload);

      const { data: postData, error: postError } = await supabase
        .from('group_posts') // Changed to group_posts table
        .insert(postInsertPayload)
        .select()
        .single();

      if (postError) {
        console.error('[DIAG] Supabase group post insert error:', postError, 'Insert payload:', postInsertPayload);
        setError(postError?.message || 'Failed to upload or create group post');
        setLoading(false);
        return;
      }

      // Navigate back to the group feed or previous screen
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback if cannot go back (e.g., deep link)
        router.replace(`/community/groups/${group_id}`);
      }
    } catch (err: any) {
      console.error('Error creating group post:', err);
      setError(err?.message || 'Failed to create group post');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicked = async (data: { uri: string; mimeType: string }) => { // Renamed handler
    if (data.uri) {
      setMediaUrl(data.uri);
      setMediaMimeType(data.mimeType);
      setError(null);
    }
  };

  const clearMedia = () => {
    setMediaUrl(null);
    setMediaMimeType(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group Post</Text> {/* Title changed */}
        <TouchableOpacity onPress={handlePost} disabled={loading} style={styles.postButton}>
          <Text style={styles.postButtonText}>{loading ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        <TextInput
          style={styles.captionInput}
          placeholder="What's on your mind?"
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        {mediaUrl && (
          <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: mediaUrl }} style={styles.mediaPreview} />
            <TouchableOpacity onPress={clearMedia} style={styles.clearMediaButton}>
              <Text style={styles.clearMediaButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}

        <ModernImagePicker
          onImagePicked={handleImagePicked} // Changed prop name
          style={styles.imagePickerButton} // Changed prop name from buttonStyle to style
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Adjust for status bar
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    color: '#dc2626',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  mediaPreviewContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  clearMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearMediaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
  },
});
