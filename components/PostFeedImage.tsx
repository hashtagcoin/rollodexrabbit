import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust path as necessary

interface PostFeedImageProps {
  imagePath: string;
  bucketName?: string; // Optional, defaults to 'postsimages'
  style?: ImageStyle;
  placeholderStyle?: ImageStyle;
}

const PostFeedImage: React.FC<PostFeedImageProps> = ({ 
  imagePath,
  bucketName = 'postsimages',
  style,
  placeholderStyle 
}) => {
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define a default placeholder image (optional, could also be passed as prop)
  const placeholderImage = require('../assets/rollodex-icon-lrg.png'); // Adjust path

  useEffect(() => {
    let isMounted = true;
    setLoading(true); // Start loading
    setError(null);   // Reset error
    setDisplayImageUrl(null); // Reset image URL

    if (!imagePath) {
      if (isMounted) {
        setError('No image path provided');
        setLoading(false);
      }
      return;
    }

    if (imagePath.startsWith('data:image/')) { // Case 1: imagePath is a base64 data URI
      if (isMounted) {
        // console.log('[PostFeedImage] Path is a data URI, using directly.');
        setDisplayImageUrl(imagePath);
        setLoading(false);
      }
    } else if (imagePath.startsWith('file:///')) { // Case 2: imagePath is a local file URI
      if (isMounted) {
        // console.warn(`[PostFeedImage] Path is a local file URI: ${imagePath}. Using placeholder.`);
        setError('Cannot load local file URI.'); // Or set a specific placeholder image URL
        setLoading(false);
      }
    } else { // Case 3: imagePath is assumed to be a Supabase storage path
      // console.log('[PostFeedImage] Path is a Supabase path, fetching public URL for:', imagePath);
      const fetchSupabaseUrl = async () => {
        let pathForSupabase = imagePath;
        // Ensure bucketName is valid, otherwise default or handle error
        const currentBucketName = bucketName || 'postsimages'; // Example default

        const prefix = `${currentBucketName}/`;
        if (pathForSupabase.startsWith(prefix)) {
          pathForSupabase = pathForSupabase.substring(prefix.length);
        }
        
        // console.log(`[PostFeedImage] Using bucket: ${currentBucketName} for final path: ${pathForSupabase}`);

        const publicUrlResult = await supabase.storage
          .from(currentBucketName)
          .getPublicUrl(pathForSupabase);
        
        const data = publicUrlResult.data;
        const urlError = publicUrlResult.error;

        if (!isMounted) return;

        if (urlError) {
          // console.error('[PostFeedImage] Error fetching public URL:', urlError.message);
          setError(urlError.message);
        } else if (data && data.publicUrl) {
          // console.log('[PostFeedImage] Fetched public URL:', data.publicUrl);
          setDisplayImageUrl(data.publicUrl);
        } else {
          // console.warn('[PostFeedImage] No public URL data and no error.');
          setError('Failed to get public URL.');
        }
        setLoading(false);
      };

      fetchSupabaseUrl();
    }

    return () => {
      isMounted = false;
    };
  }, [imagePath, bucketName]);

  if (loading) {
    const loadingViewStyles: ViewStyle[] = [styles.loadingContainer];
    if (style?.width) loadingViewStyles.push({ width: style.width });
    if (style?.height) loadingViewStyles.push({ height: style.height });

    return (
      <View style={loadingViewStyles}>
        <ActivityIndicator size="small" color="#888" />
      </View>
    );
  }

  if (error || !displayImageUrl) {
    return <Image source={placeholderImage} style={[styles.placeholder, style, placeholderStyle]} resizeMode="cover" />;
  }

  return <Image source={{ uri: displayImageUrl }} style={style} resizeMode="cover" />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Light grey background for loading
  },
  placeholder: {
    // Styles for the placeholder image if needed, often same as main image style
  },
});

export default PostFeedImage;
