import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder, Pressable } from 'react-native';
import { MapPin, Star, Users, Heart, X, BadgeCheck, Clock } from 'lucide-react-native';
import { ListingItem, HousingListing, Service } from '../types';
import { supabase } from '../../../../lib/supabase';
import { ShadowCard } from './ShadowCard';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

interface SwipeCardProps {
  item: ListingItem;
  isNext?: boolean;
  onTap?: () => void;
  onSwipe?: (direction: string) => void;
  onCardLeftScreen?: (direction: string) => void;
  onSwipeProgress?: (progress: number, direction: string) => void;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  isServiceListing: (item: ListingItem) => item is Service;
  renderServiceProvider: (item: ListingItem) => JSX.Element;
  hasHousingGroup?: (item: ListingItem) => boolean;
  showActionButtons?: boolean;
  isFavorite: (itemId: string) => boolean;
  onToggleFavorite?: (item: ListingItem) => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  item,
  isNext,
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
  const [hasGroup, setHasGroup] = useState(false);
  const [isCheckingGroups, setIsCheckingGroups] = useState(false);
  
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
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No listing available</Text>
        </View>
      </View>
    );
  }

  // Action buttons component
  const ActionButtons = () => {
    if (!showActionButtons || isNext) return null;
    
    return (
      <View style={styles.actionButtonsContainer}>
        <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
          <TouchableOpacity 
            style={styles.swipeActionLeft}
            onPress={() => onSwipe && onSwipe('left')}
          >
            <X size={36} color="#ff3b30" />
          </TouchableOpacity>
        </ShadowCard>
        
        <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
          <TouchableOpacity 
            style={styles.swipeActionRight}
            onPress={() => onSwipe && onSwipe('right')}
          >
            <Heart size={36} color="#4cd964" fill="#4cd964" />
          </TouchableOpacity>
        </ShadowCard>
      </View>
    );
  };

  // Determine if the item is a service (using the passed prop)
  const isService = isServiceListing(item);

  // Card Content Component
  const CardContent = () => (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: (() => {
            try {
              return getItemImage(item);
            } catch (e) {
              console.error('Error getting image:', e);
              return DEFAULT_IMAGE;
            }
          })() }}
          style={styles.swipeImage}
        />
        {/* Group Match Badge */}
        {isHousingListing(item) && hasGroup && (
          <View style={styles.groupMatchBadgeOverlay}>
            <Users size={14} color="#fff" />
            <Text style={styles.groupMatchText} selectable={false}>Group Match</Text>
          </View>
        )}
        {/* NDIS Badge for Service Listings */}
        {isService && item.provider?.verified && (
          <View style={styles.ndisBadgeSwipe}>
            <BadgeCheck size={14} color="#fff" />
            <Text style={styles.ndisBadgeTextSwipe}>NDIS</Text>
          </View>
        )}
        {/* Favorite Button Overlay */}
        {onToggleFavorite && (
          <Pressable 
            style={styles.favButtonSwipe} 
            onPress={(e) => {
              e.stopPropagation(); // Prevent card tap if tapping button
              onToggleFavorite(item);
            }}
          >
            <Heart 
              size={24} 
              color={isFavorite(item.id) ? "#ff4081" : "#ccc"} 
              fill={isFavorite(item.id) ? "#ff4081" : "none"} 
            />
          </Pressable>
        )}
      </View>
      
      <View style={styles.swipeContent}>
        <View style={styles.swipeDetails}>
          <Text style={styles.swipeTitle} numberOfLines={2} selectable={false}>{item.title}</Text>
          {/* Provider Name + Verified Badge */}
          <View style={styles.providerContainerSwipe}>
            {renderServiceProvider(item)} 
            {item.provider?.verified && (
              <View style={styles.verifiedBadgeSwipe}>
                <BadgeCheck size={16} color="#007AFF" />
                <Text style={styles.verifiedTextSwipe}>NDIS Certified</Text>
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
            <View style={styles.serviceProviderContainer}>
              {renderServiceProvider(item)}
            </View>
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
              {isService && <Clock size={14} color="#666" style={styles.priceIconSwipe}/>}
              <Text style={styles.priceTextSwipe}>
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

  // For the next card, use a standard View without animation
  if (isNext) {
    return <CardContent />;
  }

  // For the current card, use an Animated.View with pan gestures
  return (
    <Animated.View
      style={[
        styles.swipeCard,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotateCard }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onTap}
        style={styles.cardTouchable}
      >
        <CardContent />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swipeCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '80%', // Reduced width
    height: 300, // Keep height consistent
    overflow: 'hidden', // Keep overflow hidden
    padding: 10, // Add padding around the image area
    alignSelf: 'center', // Center the container
  },
  swipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Zoom to fit entire image
    borderRadius: 25,
  },
  groupMatchBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 217, 100, 0.8)', // 80% opacity
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  swipeContent: {
    padding: 16,
    flex: 1,
  },
  swipeDetails: {
    flex: 1,
  },
  swipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#666',
  },
  groupMatchText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
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
    color: '#666',
  },
  swipeDescription: {
    fontSize: 14,
    color: '#333',
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
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8, // Space from provider name
  },
  verifiedTextSwipe: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
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
    color: '#1a1a1a',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  serviceProviderContainer: {
    marginBottom: 8,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    zIndex: 20,
  },
  actionShadow: {
    backgroundColor: 'transparent',
  },
  swipeActionLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  swipeActionRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ndisBadgeSwipe: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)', // App blue
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4, // Add gap for spacing instead of margin
  },
  ndisBadgeTextSwipe: {
    fontSize: 10,
    fontWeight: '500', // Match grid view
    color: '#fff',
  },
  favButtonSwipe: {
    position: 'absolute',
    top: 10,
    right: 10,
    // No background
    padding: 6, 
    borderRadius: 20, // Maintain touch area
    zIndex: 10, // Ensure it's above image but below other potential overlays if needed
  },
});

// Export the component as both a named export and a default export
export { SwipeCard };
export default SwipeCard;