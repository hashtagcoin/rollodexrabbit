import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, Animated, PanResponder, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Star, Users, Heart, X, BadgeCheck, Clock } from 'lucide-react-native';
import { ListingItem, HousingListing, Service } from '../types';
import { supabase } from '../../../../lib/supabase';
import { ShadowCard } from './ShadowCard';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

// FIX: Export the interface
export interface SwipeCardProps {
  item: ListingItem;
  isNext?: boolean;
  // FIX: Add missing utility function props needed for rendering
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  isServiceListing: (item: ListingItem) => item is Service;
  renderServiceProvider: (item: ListingItem) => React.ReactElement | null;
  isTopCard: boolean; // FIX: Add missing property
  onTap?: () => void;
  onSwipe?: (direction: string) => void;
  onCardLeftScreen?: (direction: string) => void;
  onSwipeProgress?: (progress: number, direction: string) => void;
  hasHousingGroup?: (item: ListingItem) => boolean;
  showActionButtons?: boolean;
  // FIX: Correct the type for isFavorite
  isFavorite: boolean; // Check if the item is favorited
  onToggleFavorite?: (item: ListingItem) => void;
}

const SwipeCardComponent: React.FC<SwipeCardProps> = ({ 
  item,
  isNext = false,
  isTopCard,
  onTap,
  onSwipe,
  onCardLeftScreen,
  onSwipeProgress,
  getItemImage,
  getItemPrice,
  isHousingListing,
  isServiceListing,
  renderServiceProvider,
  hasHousingGroup,
  showActionButtons = false,
  isFavorite,
  onToggleFavorite,
}) => {
  // DEBUG: Log incoming item data
  console.log(`[SwipeCard Render] Rendering card for ID: ${item?.id}, Title: ${item?.title}, Type: ${isHousingListing(item) ? 'Housing' : 'Service'}, isTopCard: ${isTopCard}`);

  const [hasGroup, setHasGroup] = useState(false);
  const [isCheckingGroups, setIsCheckingGroups] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false); // <-- Add state for image load error
  
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  
  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isNext,
      onMoveShouldSetPanResponder: () => !isNext,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 });
        rotate.setValue(gesture.dx / 15);
        
        // Calculate swipe progress (0-1) and direction
        if (onSwipeProgress) {
          const progress = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
          const direction = gesture.dx > 0 ? 'right' : 'left';
          onSwipeProgress(progress, direction);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          finishSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          finishSwipe('left');
        } else {
          resetPosition();
          // Reset swipe progress when card returns to center
          if (onSwipeProgress) {
            onSwipeProgress(0, 'none');
          }
        }
      },
    })
  ).current;

  const finishSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? width + 100 : -width - 100;
    
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: false
    }).start(() => {
      if (onSwipe) onSwipe(direction);
      if (onCardLeftScreen) onCardLeftScreen(direction);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 40,
      useNativeDriver: false
    }).start();
  };

  // Get rotation interpolation for the swipe animation
  const rotateCard = rotate.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    // Check if item is defined before proceeding
    if (!item) return;

    // If hasHousingGroup prop is provided, use it directly
    if (hasHousingGroup && isHousingListing(item)) {
      setHasGroup(hasHousingGroup(item));
    } 
    // Otherwise fallback to database query
    else if (isHousingListing(item)) {
      checkForHousingGroups(item.id);
    } else {
      setHasGroup(false);
    }
    
    // Reset position when item changes
    position.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    setImageLoadError(false); // <-- Reset error state
  }, [item, hasHousingGroup]);

  const checkForHousingGroups = async (listingId: string) => {
    if (isCheckingGroups) return;
    
    try {
      setIsCheckingGroups(true);
      console.log('Checking housing groups for listing:', listingId);
      
      const { data, error } = await supabase
        .from('housing_groups')
        .select('id')
        .eq('listing_id', listingId)
        .limit(1);
      
      if (error) {
        console.error('Error checking for housing groups:', error);
        setHasGroup(false);
        return;
      }
      
      console.log('Housing groups query result:', { data, error });
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Found housing group for listing:', listingId);
        setHasGroup(true);
      } else {
        console.log('No housing groups found for listing:', listingId);
        setHasGroup(false);
      }
    } catch (error) {
      console.error('Error checking for housing groups:', error);
      setHasGroup(false);
    } finally {
      setIsCheckingGroups(false);
    }
  };

  // If item is undefined, render a placeholder card
  if (!item) {
    return (
      <View style={styles.swipeCard}>
        <View style={styles.placeholderBackground}>
          <Text style={styles.placeholderText}>No listing available</Text>
        </View>
      </View>
    );
  }

  // Action buttons component
  const ActionButtons = () => (
    <>
      {/* Action Buttons - only shown for top card if enabled */} 
      {isTopCard && showActionButtons && (
        <Animated.View style={[styles.buttonContainer]}>
          <TouchableOpacity
            style={[styles.button, styles.dislikeButton]}
            onPress={() => onSwipe && onSwipe('left')}
          >
            <X size={36} color="#ff3b30" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.likeButton]}
            onPress={() => onSwipe && onSwipe('right')}
            disabled={!onToggleFavorite} // Disable if handler not provided
          >
            <Heart size={36} color={isFavorite ? '#4CAF50' : '#4CAF50'} fill={isFavorite ? '#4CAF50' : 'none'} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );

  // Determine if the item is a service (using the passed prop)
  const isService = isServiceListing(item);

  // Card Content Component
  const CardContent = () => (
    <>
      <View style={styles.swipeContent}>
        <View style={styles.swipeDetails}>
          <Text style={styles.swipeTitle} numberOfLines={2} selectable={false}>{item.title}</Text>
          {/* Provider Name + Verified Badge */}
          <View style={styles.providerContainerSwipe}>
            {renderServiceProvider(item)} 
            {item.provider?.verified && (
              <View style={styles.verifiedBadgeSwipe}>
                <BadgeCheck size={16} color="white" />
                <Text style={styles.verifiedTextSwipe} selectable={false}>NDIS Certified</Text>
              </View>
            )}
          </View>
          
          {/* Display specific details based on type */}
          {isHousingListing(item) ? (
            <>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText} selectable={false}>
                  {item.suburb || 'Unknown'}, {item.state || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.housingFeatures}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureText} selectable={false}>
                    {item.bedrooms || 0} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureText} selectable={false}>
                    {item.bathrooms || 0} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.serviceProviderContainer} /> // Render empty view or adjust layout if needed
          )}
          
          <Text style={styles.swipeDescription} numberOfLines={3} selectable={false}>
            {item.description || 'No description available'}
          </Text>
          
          <View style={styles.swipeMeta}>
            <View style={styles.serviceRating}>
              <Star size={16} color="#FFB800" fill="#FFB800" />
              <Text style={styles.ratingText} selectable={false}>4.9</Text>
            </View>
            {/* Price with unit and icon */}
            <View style={styles.priceContainerSwipe}>
              {isService && <Clock size={14} color="white" style={styles.priceIconSwipe}/>}
              <Text style={styles.priceTextSwipe} selectable={false}>
                ${getItemPrice(item)}
                {isHousingListing(item) ? '/week' : (isService ? '/ hour' : '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons - only shown for top card if enabled */}
        <ActionButtons />
      </View>
    </>
  );

  // --- Render Logic --- 
  // FIX: Use 'media_urls' instead of 'images' based on type definition
  console.log(`[SwipeCard ${item.id}] Is Housing? ${isHousingListing(item)}`);
  if (isHousingListing(item)) {
    console.log(`[SwipeCard ${item.id}] Media URLs:`, item.media_urls);
  }
  // FIX: Show image if media_urls exist, regardless of item type
  const shouldShowImage = !!(item.media_urls && item.media_urls.length > 0);
  console.log(`[SwipeCard ${item.id}] Should Show Image? ${shouldShowImage}`);
  const imageUri = shouldShowImage ? item.media_urls![0] : null; // Use non-null assertion since shouldShowImage checks

  // Determine if we should render the image or the placeholder
  const renderImage = shouldShowImage && imageUri && !imageLoadError; // <-- Check error state here

  return (
    <Pressable onPress={onTap} style={styles.cardTouchable}>
      <Animated.View style={[styles.swipeCard, { opacity: 1 }]}>
        {renderImage ? ( // <-- Use the new renderImage flag
          <ImageBackground
            source={{ uri: imageUri }} // Safely use imageUri which handles null
            style={styles.imageBackground} // Keep existing style
            resizeMode="cover" // Move resizeMode here
            onError={(e) => {
              console.error(`[SwipeCard] Image load error for ${item.id}:`, e.nativeEvent.error);
              setImageLoadError(true); // <-- Set error state on failure
            }}
          >
            {/* Group Match Badge - Positioned relative to ImageBackground */}
            {isHousingListing(item) && hasGroup && (
              // FIX: Ensure this style is defined and referenced correctly
              <View style={styles.groupMatchBadgeOverlay}>
                <Users size={14} color="white" />
                <Text style={styles.groupMatchText}>Group Match</Text>
              </View>
            )}
            <View style={styles.overlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']} // Intensified Gradient
                style={styles.gradient}
              >
                <CardContent />
              </LinearGradient>
            </View>
          </ImageBackground>
        ) : (
          // Placeholder for Services or Housing without images OR if image failed to load
          <View style={[styles.imageBackground, styles.placeholderBackground]}>
            <CardContent /> 
            {/* Optional: Add a placeholder text if needed */}
            {/* <Text style={styles.placeholderText}>Details Below</Text> */} 
          </View>
        )}
        {/* Action Buttons are outside the Image/Placeholder but inside the Animated.View */}
        <ActionButtons /> 
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  swipeCard: {
    width: '100%', // Use full width of the container
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end', // Align content (gradient/text) to the bottom
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
  },
  imageBackground: {
    width: '100%',
    aspectRatio: 3 / 4, // Maintain aspect ratio
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end', // Align content (gradient/text) to the bottom
  },
  placeholderBackground: {
    backgroundColor: '#e0e0e0', 
    alignItems: 'center',
    justifyContent: 'center', 
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Adjust height as needed
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomLeftRadius: 15, // Match card radius
    borderBottomRightRadius: 15,
  },
  swipeContent: {
    padding: 16,
    backgroundColor: 'transparent', // Content itself shouldn't have a background
  },
  swipeDetails: {
    flex: 1,
  },
  swipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white', // White text
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 12,
    color: 'white', // White text
  },
  groupMatchText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  housingFeatures: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: 'white', // White text
  },
  swipeDescription: {
    fontSize: 14,
    color: 'white', // White text
    marginBottom: 12,
    lineHeight: 20,
    flex: 1,
  },
  swipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16, // Add space between rating and price
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white', // White text
  },
  providerContainerSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Try to space out provider name and badge
    marginTop: 4,
    marginBottom: 8,
    flexWrap: 'wrap', // Allow wrapping if needed
  },
  verifiedBadgeSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF', // Blue background
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8, // Space between provider name and badge
  },
  verifiedTextSwipe: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: 'white', // White text
  },
  priceContainerSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIconSwipe: {
    marginRight: 4,
  },
  priceTextSwipe: { // Need a text style for the price itself if nested
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white', // White text
  },


  serviceProviderContainer: {
    marginBottom: 8, 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    position: 'absolute', // Position buttons over the card content
    bottom: 15,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    // backgroundColor: 'rgba(0,0,0,0.1)', // Optional background for visibility
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 50, // Make them circular
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  likeButton: {
    // Specific styles if needed
  },
  dislikeButton: {
    // Specific styles if needed
  },
  groupMatchBadgeOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  providerNameText: {
    color: 'white', 
    // Add other existing styles if any
    fontWeight: '600', // Example style
    fontSize: 16, // Example style
  },
});

export default React.memo(SwipeCardComponent); // Export the memoized component