import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import ModernImagePicker from './ModernImagePicker';
import { Ionicons } from '@expo/vector-icons';
import { uploadMedia, MediaError, MediaErrorType } from '../lib/mediaService';

interface SecureAvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarUploaded: (url: string) => void;
  userId: string;
  size?: number;
  bucketName?: 'avatars' | 'group-avatars' | 'service-providers';
}

export default function SecureAvatarUpload({
  currentAvatarUrl,
  onAvatarUploaded,
  userId,
  size = 120,
  bucketName = 'avatars',
}: SecureAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ModernImagePicker for image selection
  const handleImagePicked = async (uri: string | null) => {
    if (uri) {
      await uploadAvatar(uri);
    }
  };


  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);

      // Generate a unique filename
      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload using our secure media service
      const avatarUrl = await uploadMedia(
        blob,
        bucketName,
        fileName,
        'image',
        true, // Public access for avatars
        { userId }
      );

      // Call the callback with the new URL
      onAvatarUploaded(avatarUrl);
    } catch (err: unknown) {
      console.error('Error uploading avatar:', err);
      
      if (err instanceof MediaError) {
        switch (err.type) {
          case MediaErrorType.UNSUPPORTED_TYPE:
            setError('Please select a JPG, PNG, GIF, or WebP image.');
            break;
          case MediaErrorType.FILE_TOO_LARGE:
            setError('Image too large. Please select an image under 5MB.');
            break;
          default:
            setError(`Upload failed: ${err.message}`);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      }
    } finally {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: '#e1e1e1',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    uploadIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#0055FF',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#fff',
    },
    placeholderText: {
      fontSize: size / 3,
      color: '#888',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: size / 2,
    },
    errorText: {
      color: '#d9534f',
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      maxWidth: size * 1.5,
    },
  });

  return (
    <View style={styles.container}>
      <ModernImagePicker
        imageUri={currentAvatarUrl}
        onImagePicked={handleImagePicked}
        size={size}
        shape="circle"
        label="Upload Avatar"
        disabled={uploading}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
