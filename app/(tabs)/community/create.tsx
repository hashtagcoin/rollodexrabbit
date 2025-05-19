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
  const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);

  const handlePost = async () => {
    try {
      if (!caption && !mediaUrl) {
        setError('Please write something or add an image to post');
        return;
      }

      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[DIAG] user:', user);
      console.log('[DIAG] supabase.auth.getSession() result:', session);
      if (supabase && supabase.auth) {
        supabase.auth.getUser().then(u => console.log('[DIAG] supabase.auth.getUser()', u));
      }
      if (!user) throw new Error('Not authenticated');

      let supabaseMediaUrl: string | null = null;

      if (mediaUrl) {
        console.log('Media URL selected:', mediaUrl);

        // Utility: Map MIME type to extension
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

        let uploadBody: FormData | Blob | ArrayBuffer;
        let uploadContentTypeFinal = '';
        let baseFileName = '';
        let pathInBucket = '';

        if (Platform.OS === 'web') {
          console.log('Fetching media URL for blob (Web):', mediaUrl);
          const response = await fetch(mediaUrl);
          const webBlob = await response.blob();
          if (!webBlob || webBlob.size === 0) {
            console.error('Failed to create blob or blob is empty');
            throw new Error('Failed to process image data or image is empty.');
          }
          uploadContentTypeFinal = mediaMimeType || webBlob.type || 'image/jpeg';
          const ext = getExtensionFromMimeType(uploadContentTypeFinal);
          baseFileName = `${user.id}_post_${Date.now()}.${ext}`;
          pathInBucket = `${user.id}/${baseFileName}`;

          const formData = new FormData();
          formData.append('file', webBlob, baseFileName);
          uploadBody = formData;
          console.log('Using FormData for Web post. Blob Size:', webBlob.size, 'Type:', uploadContentTypeFinal);
        } else {
          // Native: read as base64 and convert to ArrayBuffer
          const fileInfo = await FileSystem.getInfoAsync(mediaUrl);
          if (!fileInfo.exists) {
            throw new Error('File does not exist at provided URI');
          }
          const base64String = await FileSystem.readAsStringAsync(mediaUrl, { encoding: FileSystem.EncodingType.Base64 });
          if (!base64String) {
            throw new Error('Failed to read image as base64 string');
          }
          // Guess content type from URI extension if possible
          let ext = 'jpg';
          let contentType = 'image/jpeg';
          const uriMatch = mediaUrl.match(/\.([a-zA-Z0-9]+)$/);
          if (uriMatch) {
            ext = uriMatch[1].toLowerCase();
            if (ext === 'png') contentType = 'image/png';
            else if (ext === 'webp') contentType = 'image/webp';
            else if (ext === 'gif') contentType = 'image/gif';
            else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
          }
          baseFileName = `${user.id}_post_${Date.now()}.${ext}`;
          pathInBucket = `${user.id}/${baseFileName}`;
          uploadContentTypeFinal = mediaMimeType || contentType;
          uploadBody = base64ToArrayBuffer(base64String);
          console.log('Using ArrayBuffer for Native post. Size:', uploadBody.byteLength, 'Type:', uploadContentTypeFinal);
        }

        console.log('Uploading post media to Supabase. Path:', pathInBucket, 'Content-Type:', uploadContentTypeFinal);
        let uploadData = null;
        let uploadError = null;
        // Patch: On web, manually upload with Authorization header.
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
          // Web platform
          const session = await supabase.auth.getSession();
          const accessToken = session.data.session?.access_token;
          // Get Supabase project URL from config/env
          const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || (globalThis as any).expo?.constants?.manifest?.extra?.supabaseUrl || '';
          const uploadUrl = `${SUPABASE_URL}/storage/v1/object/postsimages/${pathInBucket}`;
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'cache-control': '3600',
          };
          try {
            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers,
              body: uploadBody,
            });
            if (!response.ok) {
              uploadError = { statusCode: response.status, error: response.statusText, message: await response.text() };
            } else {
              const respJson = await response.json();
              uploadData = respJson;
              // Ensure supabaseMediaUrl is pathInBucket for web, consistent with native
              if (uploadData?.Key && (uploadData.Key === pathInBucket || uploadData.Key === `postsimages/${pathInBucket}`)) {
                supabaseMediaUrl = pathInBucket;
              } else if (uploadData?.Key) {
                console.warn(`[DIAG] Web upload Key '${uploadData.Key}' unexpected. Expected '(${pathInBucket})' or '(postsimages/${pathInBucket})'. Storing Key directly.`);
                supabaseMediaUrl = uploadData.Key; // Fallback, may cause issues if not handled by display logic
              } else {
                // This case should ideally be an error if Key is missing after response.ok
                supabaseMediaUrl = null; 
                uploadError = { error: 'Upload Success, No Key', message: 'Upload seemed to succeed but did not return a Key.'};
              }
            }
          } catch (err) {
            uploadError = { error: 'Network error', message: (err as Error)?.message || String(err) };
          }
        } else {
          // Native (mobile) platform
          const result = await supabase.storage
            .from('postsimages')
            .upload(pathInBucket, uploadBody, {
              cacheControl: '3600',
              upsert: false,
              contentType: uploadContentTypeFinal,
            });
          uploadData = result.data;
          uploadError = result.error;
        }

        if (uploadError) {
          console.error('[DIAG] Supabase upload error:', uploadError?.message ?? JSON.stringify(uploadError));
          throw uploadError;
        }

        // Log upload payload if uploading media
        if (mediaUrl && !uploadError) { // Added !uploadError to ensure we log only for successful pre-flight
          console.log('[DIAG] Preparing to insert post with media. supabaseMediaUrl (relative path):', supabaseMediaUrl);
        } else if (mediaUrl && uploadError) {
          console.log('[DIAG] Media was selected, but upload failed. supabaseMediaUrl:', supabaseMediaUrl);
        }

      }

      const postInsertPayload = {
        user_id: user?.id,
        caption: caption,
        media_urls: supabaseMediaUrl ? [supabaseMediaUrl] : [],
      };
      console.log('[DIAG] About to insert post. Insert payload:', postInsertPayload, 'Current user:', user?.id);
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert(postInsertPayload)
        .select()
        .single();

      if (postError) {
        console.error('[DIAG] Supabase post insert error:', postError, 'Insert payload:', postInsertPayload, 'User:', user, 'Session:', session);
        setError(postError?.message || 'Failed to upload or create post');
        setLoading(false);
        return;
      }

      router.back();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPick = async (data: { uri: string; mimeType: string }) => {
    setMediaUrl(data.uri);
    setMediaMimeType(data.mimeType);
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
        onImagePicked={handleMediaPick}
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