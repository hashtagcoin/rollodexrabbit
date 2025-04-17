import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export interface ModernImagePickerProps {
  imageUri?: string | null;
  onImagePicked: (uri: string | null) => void;
  size?: number;
  shape?: 'circle' | 'rounded' | 'square';
  label?: string;
  disabled?: boolean;
  aspect?: [number, number]; // e.g. [1,1] or [16,9]
  crop?: boolean; // enables allowsEditing
  style?: any; // extra style for container/image
  icon?: React.ReactNode; // optional overlay icon
}

export default function ModernImagePicker({
  imageUri,
  onImagePicked,
  size = 120,
  shape = 'circle',
  label = 'Upload',
  disabled = false,
  aspect = [1, 1],
  crop = true,
  style,
  icon,
}: ModernImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (disabled) return;
    try {
      setUploading(true);
      let permissionResult;
      if (Platform.OS === 'web') {
        // Web: no permissions needed
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Camera roll permission is needed.');
          setUploading(false);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: crop,
        aspect: aspect,
        quality: 0.85,
        base64: false,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagePicked(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        style={[
          styles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? size / 2 : shape === 'rounded' ? 16 : 4,
            borderWidth: imageUri ? 0 : 1,
            borderColor: '#e1e1e1',
            backgroundColor: '#fafbfc',
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        onPress={pickImage}
        activeOpacity={0.85}
        disabled={disabled || uploading}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: shape === 'circle' ? size / 2 : shape === 'rounded' ? 16 : 0 }} />
        ) : uploading ? (
          <ActivityIndicator style={styles.activityIndicator} size="small" color="#007AFF" />
        ) : (
          <Ionicons name="camera" size={size / 2} color="#bbb" />
        )}
        {icon && (
          <View style={styles.iconOverlay}>
            {icon}
          </View>
        )}
      </TouchableOpacity>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 2,
    zIndex: 10,
  },
  activityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});
