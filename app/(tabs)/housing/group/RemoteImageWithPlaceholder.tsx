import React from 'react';
import { Image, Animated, ActivityIndicator, View } from 'react-native';

interface RemoteImageWithPlaceholderProps {
  uri: string;
  style?: any;
}

// No longer needed: const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/400x300?text=Loading...';
const BROKEN_IMAGE_ICON = 'https://via.placeholder.com/400x300?text=Image+Not+Available';

export const RemoteImageWithPlaceholder: React.FC<RemoteImageWithPlaceholderProps> = ({ uri, style }) => {
  console.log('RemoteImageWithPlaceholder uri:', uri);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Reset loading, error, and fadeAnim whenever the uri changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    fadeAnim.setValue(0);
  }, [uri]);

  // Animate fade-in when loading completes and no error
  React.useEffect(() => {
    if (!loading && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error, fadeAnim]);

  // Ensure style always has width and height
  const imageStyle = style && style.width && style.height
    ? style
    : { ...style, width: 300, height: 200 };

  // Debug logs for uri, loading, error
  console.log('RemoteImageWithPlaceholder uri:', uri, 'loading:', loading, 'error:', error);

  return (
    <>
      {loading && !error && (
        <View style={[imageStyle, { justifyContent: 'center', alignItems: 'center', position: 'absolute', zIndex: 2 }]}> 
          <ActivityIndicator size="large" color="#888" />
        </View>
      )}
      {error && (
        <Image
          source={{ uri: BROKEN_IMAGE_ICON }}
          style={imageStyle}
          accessibilityLabel={'Image failed to load'}
          accessible
        />
      )}
      <Animated.Image
        source={{ uri }}
        style={[imageStyle, { opacity: loading || error ? 0 : fadeAnim, position: 'absolute', zIndex: 1 }]}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
          console.log('RemoteImageWithPlaceholder: onLoadStart');
        }}
        onLoadEnd={() => {
          setLoading(false);
          console.log('RemoteImageWithPlaceholder: onLoadEnd');
        }}
        onError={() => {
          setLoading(false);
          setError(true);
          console.log('RemoteImageWithPlaceholder: onError');
        }}
        accessibilityLabel="Loaded image"
        accessible
      />
    </>
  );
};
