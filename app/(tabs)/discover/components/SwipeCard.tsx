import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, PanResponder } from 'react-native';
import { MapPin, Star, Users } from 'lucide-react-native';
import { ListingItem, HousingListing } from '../types';
import { supabase } from '../../../../lib/supabase';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

interface SwipeCardProps {
  item: ListingItem;
  isNext?: boolean;
  onTap?: () => void;
  onSwipe?: (direction: string) => void;
  onCardLeftScreen?: (direction: string) => void;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  renderServiceProvider: (item: ListingItem) => JSX.Element;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  item,
  isNext,
  onTap,
  onSwipe,
  onCardLeftScreen,
  getItemImage,
  getItemPrice,
  isHousingListing,
  renderServiceProvider,
}) => {
  const [hasHousingGroup, setHasHousingGroup] = useState(false);
  
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
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          finishSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          finishSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const finishSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? width + 100 : -width - 100;
    
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: true
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
      useNativeDriver: true
    }).start();
  };

  // Get rotation interpolation for the swipe animation
  const rotateCard = rotate.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    // Check if this housing listing has associated housing groups
    if (isHousingListing(item)) {
      checkForHousingGroups(item.id);
    } else {
      setHasHousingGroup(false);
    }
    
    // Reset position when item changes
    position.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
  }, [item]);

  const checkForHousingGroups = async (listingId: string) => {
    try {
      const { data, error } = await supabase
        .from('housing_groups')
        .select('id')
        .eq('listing_id', listingId)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setHasHousingGroup(true);
      } else {
        setHasHousingGroup(false);
      }
    } catch (error) {
      console.error('Error checking for housing groups:', error);
      setHasHousingGroup(false);
    }
  };

  const CardContent = () => (
    <>
      <Image
        source={{ uri: getItemImage(item) }}
        style={styles.swipeImage}
      />
      <View style={styles.swipeContent}>
        <Text style={styles.swipeTitle}>{item.title}</Text>
        
        {isHousingListing(item) ? (
          <>
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#666" />
              <Text style={styles.locationText}>
                {item.suburb}, {item.state}
              </Text>
              {hasHousingGroup && (
                <View style={styles.groupMatchBadge}>
                  <Users size={12} color="#fff" />
                  <Text style={styles.groupMatchText}>Group Match</Text>
                </View>
              )}
            </View>
            
            <View style={styles.housingFeatures}>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>
                  {item.bedrooms} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>
                  {item.bathrooms} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          renderServiceProvider(item)
        )}
        
        <Text style={styles.swipeDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.swipeMeta}>
          <View style={styles.serviceRating}>
            <Star size={16} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
          <Text style={styles.swipePrice}>
            ${getItemPrice(item)}
            {isHousingListing(item) ? '/week' : ''}
          </Text>
        </View>
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
  swipeImage: {
    width: '100%',
    height: 280,
  },
  swipeContent: {
    padding: 16,
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
  groupMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4cd964',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
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
  swipePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
});

// Export the component as both a named export and a default export
export { SwipeCard };
export default SwipeCard;