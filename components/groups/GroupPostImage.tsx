import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, View, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjust path as necessary

interface GroupPostImageProps {
  imagePath: string | null;
  imageStyle: StyleProp<ImageStyle>; // Pass image style from parent
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

// Define an interface for the expected Supabase storage response
interface SupabaseStorageResponse {
  data: { publicUrl: string } | null;
  error: Error | { message: string; statusCode?: string; error?: string; } | null; // Allow for SupabaseError structure
}

const GroupPostImage: React.FC<GroupPostImageProps> = ({ imagePath, imageStyle, resizeMode = "cover" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imagePath) {
      setLoading(true);
      setError(null);
      setImageUrl(null); // Reset previous imageURL while loading new one

      const fetchUrl = async () => {
        // Check if imagePath already looks like a full URL or a local URI
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file:///') || imagePath.startsWith('data:')) {
            setImageUrl(imagePath);
            setLoading(false);
            return;
        }

        const bucketName = 'group-posts';
        let pathToUse = imagePath;

        // Remove leading slash if present, as Supabase paths typically don't start with one
        if (pathToUse.startsWith('/')) {
          pathToUse = pathToUse.substring(1);
        }

        console.log(`[GroupPostImage] Fetching public URL for path: ${pathToUse} in bucket: ${bucketName}`);

        // Store the whole result first and use type assertion
        const urlResult = await supabase.storage 
          .from(bucketName)
          .getPublicUrl(pathToUse) as SupabaseStorageResponse; // Type assertion here

        // Check for error property on the result
        if (urlResult.error) {
          console.error(`[GroupPostImage] Error fetching public URL for ${pathToUse}:`, urlResult.error);
          setError(`Failed to load image.`); 
          setImageUrl(null);
        } else if (urlResult.data && urlResult.data.publicUrl) {
          console.log(`[GroupPostImage] Public URL for ${pathToUse}: ${urlResult.data.publicUrl}`);
          setImageUrl(urlResult.data.publicUrl);
        } else {
          console.warn(`[GroupPostImage] No public URL returned for ${pathToUse}, data:`, urlResult.data);
          setError('Image not found.');
          setImageUrl(null);
        }
        setLoading(false);
      };
      fetchUrl();
    } else {
      setImageUrl(null);
      setLoading(false);
      setError(null);
    }
  }, [imagePath]);

  // Flatten the imageStyle to extract width and height for container views
  const flatImageStyle = StyleSheet.flatten(imageStyle);
  const containerViewStyle = {
    width: flatImageStyle.width,
    height: flatImageStyle.height,
  };

  if (loading) {
    return <View style={[containerViewStyle, styles.centerContent, styles.loadingContainer]}><ActivityIndicator color="#007AFF"/></View>;
  }

  if (error) {
    return <View style={[containerViewStyle, styles.centerContent, styles.errorContainer]}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!imageUrl) {
    // Return a styled placeholder if there's no image path or if URL fetch failed silently
    return <View style={[containerViewStyle, styles.centerContent, styles.placeholderContainer]}><Text style={styles.placeholderText}>No Image</Text></View>;
  }

  return <Image source={{ uri: imageUrl }} style={imageStyle} resizeMode={resizeMode} onError={(e) => {
    console.error("[GroupPostImage] Image load error:", e.nativeEvent.error, "for URL:", imageUrl);
    setError('Could not display image.');
    setImageUrl(null); // Prevent trying to load a broken image again
  }}/>;
};

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    backgroundColor: '#ffe0e0',
    padding: 5,
  },
  errorText: {
    color: '#D8000C',
    fontSize: 12,
    textAlign: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
  }
});

export default GroupPostImage;
