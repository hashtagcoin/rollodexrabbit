import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Animated, 
  PanResponder, 
  PanResponderInstance, 
  PanResponderGestureState, 
  GestureResponderEvent 
} from 'react-native'; 
import { MapPin, Star, Users, Heart, X, BadgeCheck, Clock } from 'lucide-react-native';
import { ListingItem, HousingListing, Service } from '../types';
import { ShadowCard } from './ShadowCard';

// Using Animated instead of Reanimated for compatibility
const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.15; // Reduced threshold for easier swiping
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

interface SwipeListViewProps {
  listings: ListingItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onCardTap: (item: ListingItem) => void;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  isServiceListing: (item: ListingItem) => item is Service;
  renderServiceProvider: (item: ListingItem) => JSX.Element;
  hasHousingGroup?: (item: ListingItem) => boolean;
  onSwipe?: (direction: string) => void;
  onCardLeftScreen?: (direction: string) => void;
}

const SwipeListView: React.FC<SwipeListViewProps> = ({
  listings,
  currentIndex,
  setCurrentIndex,
  onCardTap,
  getItemImage,
  getItemPrice,
  isHousingListing,
  isServiceListing,
  renderServiceProvider,
  hasHousingGroup,
  onSwipe,
  onCardLeftScreen,
}) => {
  // Add a state to track if the current card is being swiped
  const [isCardSwiping, setIsCardSwiping] = useState(false);
  // Add a state to track swipe progress for animating the next card
  const [swipeProgress, setSwipeProgress] = useState(0);
  // Add a state to track swipe direction for visual effects
  const [swipeDirection, setSwipeDirection] = useState<'none' | 'left' | 'right'>('none');
  
  // Animation values for the next card
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardOpacity = useRef(new Animated.Value(1)).current; // Full opacity
  const nextCardTranslateY = useRef(new Animated.Value(20)).current;
  const nextCardTranslateX = useRef(new Animated.Value(0)).current; // Add horizontal offset
  const nextCardWidth = useRef(new Animated.Value(width - 70)).current; // Wider initial size
  const nextCardHeight = useRef(new Animated.Value(530)).current;
  
  // Animation values for the third card (the one behind the next card)
  const thirdCardScale = useRef(new Animated.Value(0.84)).current;
  const thirdCardOpacity = useRef(new Animated.Value(0.8)).current; // Increased opacity
  const thirdCardTranslateY = useRef(new Animated.Value(40)).current;
  const thirdCardTranslateX = useRef(new Animated.Value(0)).current; // Add horizontal offset

  // Animation values for the current card (moved outside renderCard)
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Reset all card animations to their initial values
  const resetCardAnimations = useCallback(() => {
    // Next card
    nextCardScale.setValue(0.9);
    nextCardOpacity.setValue(0.9); // Set initial opacity to 0.9
    nextCardTranslateY.setValue(20); // Keep bottom offset
    nextCardTranslateX.setValue(20); // Align right edge ( (w-40) - (w-80) ) / 2 = 20
    nextCardWidth.setValue(width - 80); 
    nextCardHeight.setValue(500);      
    
    // Third card
    thirdCardScale.setValue(0.8);
    thirdCardOpacity.setValue(0.2); // Start third card slightly visible to smooth transition
    thirdCardTranslateY.setValue(40);
    thirdCardTranslateX.setValue(0); // Centered initially far behind
    
    // Reset states
    setIsCardSwiping(false);
    setSwipeProgress(0);
    setSwipeDirection('none');
  }, [position, rotate, nextCardScale, nextCardOpacity, nextCardTranslateY, nextCardTranslateX, nextCardWidth, nextCardHeight, thirdCardScale, thirdCardOpacity, thirdCardTranslateY, thirdCardTranslateX]);

  const animateNextCardToFront = useCallback(() => {
    // First animate the third card to become the next card
    Animated.parallel([
      Animated.timing(thirdCardScale, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(thirdCardOpacity, {
        toValue: 0.9, // Target next card's resting opacity
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(thirdCardTranslateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(thirdCardTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Then animate the next card to become the top card
    Animated.parallel([
      Animated.timing(nextCardScale, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: false, // Can't use native driver for dimension changes
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardWidth, {
        toValue: width - 40, // Target width of top card
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardHeight, {
        toValue: 550, // Target height of top card
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Once next card is in place, update the index
      const prevIndex = currentIndex;
      const nextIndex = (prevIndex + 1) % listings.length;
      setCurrentIndex(nextIndex);
      // Reset only necessary animations for the next cards
      nextCardScale.setValue(0.9);
      nextCardOpacity.setValue(1);
      thirdCardScale.setValue(0.8);
      thirdCardOpacity.setValue(1);

      // Also reset swipe interaction state for the new top card
      setSwipeProgress(0);
      setSwipeDirection('none');
    });
  }, [currentIndex, listings.length, nextCardScale, nextCardOpacity, nextCardTranslateY, nextCardTranslateX, nextCardWidth, nextCardHeight, thirdCardScale, thirdCardOpacity, thirdCardTranslateY, thirdCardTranslateX, setCurrentIndex]);

  // Renamed handleSwipe to finalizeSwipe and removed state setting
  const finalizeSwipe = useCallback((direction: string) => {
    animateNextCardToFront();
  }, [animateNextCardToFront]);

  // Handler for pressing the Dislike (X) button
  const handleDislike = useCallback(() => {
    if (isCardSwiping) return; // Prevent double actions
    setIsCardSwiping(true);
    // Animate card off screen left
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 50 }, // Approximate exit Y
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      finalizeSwipe('left');
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
    });
  }, [isCardSwiping, position, rotate, finalizeSwipe]); // Added dependencies

  // Handler for pressing the Like (Heart) button
  const handleLike = useCallback(() => {
    if (isCardSwiping) return; // Prevent double actions
    setIsCardSwiping(true);
    // Animate card off screen right
    Animated.timing(position, {
      toValue: { x: width + 100, y: 50 }, // Approximate exit Y
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      finalizeSwipe('right');
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
    });
  }, [isCardSwiping, position, rotate, finalizeSwipe]); // Added dependencies

  const handleSwipeProgress = useCallback((progress: number, direction: string) => {
    // Update swipe progress state
    setSwipeProgress(progress);
    
    // Update swipe direction for visual feedback
    if (direction !== 'none') {
      setSwipeDirection(direction as 'left' | 'right');
    } else {
      setSwipeDirection('none');
    }
    
    // Dynamically adjust next card position based on swipe progress
    // This creates the effect of the next card "rising up" as the top card is swiped
    nextCardScale.setValue(0.9 + (progress * 0.1)); // Scale from 0.9 to 1.0
    nextCardOpacity.setValue(0.9 + (progress * 0.1)); // Opacity from 0.9 to 1.0
    nextCardTranslateY.setValue(20 - (progress * 20)); // Move up from 20 to 0
    nextCardTranslateX.setValue(20 - (progress * 20)); // Move left from 20 to 0
    nextCardWidth.setValue((width - 80) + (progress * 40)); // Width from w-80 to w-40
    nextCardHeight.setValue(500 + (progress * 50));      // Height from 500 to 550
    
    // Also adjust the third card
    thirdCardScale.setValue(0.84 + (progress * 0.11)); // Scale from 0.84 to 0.95
    thirdCardOpacity.setValue(0.2 + (progress * 0.7)); // Opacity from 0.2 to 0.9
    thirdCardTranslateY.setValue(40 - (progress * 20)); // Move up from 40 to 20
    thirdCardTranslateX.setValue((progress * 10)); // Move horizontally
  }, [nextCardScale, nextCardOpacity, nextCardTranslateY, nextCardTranslateX, nextCardWidth, nextCardHeight, thirdCardScale, thirdCardOpacity, thirdCardTranslateY, thirdCardTranslateX]);

  const getCurrentItem = () => {
    if (listings.length === 0) return null;
    return listings[currentIndex];
  };

  const getNextItem = () => {
    if (listings.length <= 1) return null;
    return listings[(currentIndex + 1) % listings.length];
  };
  
  const getThirdItem = () => {
    if (listings.length <= 2) return null;
    return listings[(currentIndex + 2) % listings.length];
  };

  // Create pan responder for swipe gestures (moved outside renderCard)
  const handlePanMove = useCallback((_: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (isCardSwiping) return; // Prevent move if already swiping off

    position.setValue({ x: gesture.dx, y: gesture.dy });

    // Rotation based on horizontal movement
    const rotation = gesture.dx / (width / 2) * 15; // Adjust multiplier for sensitivity
    rotate.setValue(rotation);

    // Calculate swipe progress (0-1) and direction
    const progress = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
    const swipeDirection = gesture.dx > 0 ? 'right' : 'left';
    handleSwipeProgress(progress, swipeDirection);

  }, [isCardSwiping, position, rotate, handleSwipeProgress]); // Dependencies: state and functions read/called

  const handlePanRelease = useCallback((_: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (isCardSwiping) return; // Already handled or swipe in progress

    // Check if we swiped far enough or fast enough
    const swipedRight = gesture.dx > SWIPE_THRESHOLD || (gesture.dx > 0 && gesture.vx > 0.3);
    const swipedLeft = gesture.dx < -SWIPE_THRESHOLD || (gesture.dx < 0 && gesture.vx < -0.3);

    if (swipedRight || swipedLeft) {
      const direction = swipedRight ? 'right' : 'left';
      setIsCardSwiping(true); // Block further gestures

      // Animate the card off screen first
      Animated.timing(position, {
        toValue: {
          x: swipedRight ? width + 100 : -width - 100,
          y: gesture.dy * 0.2 + 50
        },
        duration: 250, // Faster animation
        useNativeDriver: false,
      }).start(() => {
        // Now that card is visually gone, finalize the swipe logic
        finalizeSwipe(direction);
        // Manually reset position/rotation for the *next* card's animation start state
        // Position is reset in resetCardAnimations called by finalizeSwipe's chain
        // rotate.setValue(0); // Rotation also reset there
      });
    } else {
      // Return to center (No swipe occurred)
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        tension: 20,
        friction: 4,
        useNativeDriver: false,
      }).start();
      // Reset swipe progress visual feedback
      handleSwipeProgress(0, 'none');
    }
  }, [isCardSwiping, finalizeSwipe, position, handleSwipeProgress]); // Dependencies: state and functions read/called

  const resetNextCardAnimations = useCallback(() => {
    nextCardScale.setValue(0.9);
    nextCardOpacity.setValue(1);
    thirdCardScale.setValue(0.8);
    thirdCardOpacity.setValue(1);
  }, [nextCardScale, nextCardOpacity, thirdCardScale, thirdCardOpacity]);

  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCardSwiping, // Only start if not already swiping
      onMoveShouldSetPanResponder: (_, gesture) => { // Re-add move check
        // Only capture if not already swiping and there's significant movement
        return !isCardSwiping && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5);
      },
      onPanResponderGrant: () => {
        console.log('PanResponder Grant: Resetting pan position');
        // Reset pan position *only* when a new touch begins on the top card
        position.setValue({ x: 0, y: 0 });
        // Also reset next/third card scales here in case they were interrupted
        resetNextCardAnimations();
      },
      onPanResponderMove: handlePanMove, // Use the useCallback version
      onPanResponderRelease: handlePanRelease, // Use the useCallback version
    })
  );

  // Function to render a card
  const renderCard = (item: ListingItem, isNext: boolean) => {
    if (!item) return null;

    // For the next and third cards (static)
    if (isNext) {
      return (
        <View style={styles.staticCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getItemImage(item) || DEFAULT_IMAGE }}
              style={styles.swipeImage}
            />
            
            {/* Group Match Badge - On top of image */}
            {isHousingListing(item) && hasHousingGroup && hasHousingGroup(item) && (
              <View style={styles.groupMatchBadgeOverlay}>
                <Users size={14} color="#fff" />
                <Text style={styles.groupMatchText}>Group Match</Text>
              </View>
            )}
          </View>
          
          <View style={styles.swipeContent}>
            <Text style={styles.swipeTitle} numberOfLines={2}>{item.title || 'Untitled Listing'}</Text>
            
            {isHousingListing(item) ? (
              <>
                <View style={styles.locationContainer}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.locationText}>
                    {item.suburb || 'Unknown'}, {item.state || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.housingFeatures}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureText}>
                      {item.bedrooms || 0} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureText}>
                      {item.bathrooms || 0} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.providerContainerSwipe}>
                {renderServiceProvider(item)}
                {item.provider?.verified && (
                  <View style={styles.verifiedBadgeSwipe}>
                    <BadgeCheck size={16} color="#007AFF" />
                    <Text style={styles.verifiedTextSwipe}>NDIS Certified</Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.swipeDescription} numberOfLines={3}>
              {item.description || 'No description available'}
            </Text>
            
            <View style={styles.swipeMeta}>
              <View style={styles.serviceRating}>
                <Star size={16} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
              <View style={styles.priceContainerSwipe}>
                {isServiceListing(item) && <Clock size={14} color="#666" style={styles.priceIconSwipe}/>}
                <Text style={styles.priceTextSwipe}>
                  ${getItemPrice(item)}
                  {isHousingListing(item) ? '/week' : (isServiceListing(item) ? '/ hour' : '')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // For the current (top) card with swipe functionality
    const rotateCard = rotate.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeCard,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotateCard },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          activeOpacity={isCardSwiping ? 1 : 0.9}
          onPress={() => onCardTap(item)}
          style={styles.cardTouchable}
          delayPressIn={150} // Add a delay before recognizing press
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getItemImage(item) || DEFAULT_IMAGE }}
              style={styles.swipeImage}
            />
            
            {/* Group Match Badge - On top of image */}
            {isHousingListing(item) && hasHousingGroup && hasHousingGroup(item) && (
              <View style={styles.groupMatchBadgeOverlay}>
                <Users size={14} color="#fff" />
                <Text style={styles.groupMatchText}>Group Match</Text>
              </View>
            )}
          </View>
          
          <View style={styles.swipeContent}>
            <Text style={styles.swipeTitle} numberOfLines={2}>{item.title || 'Untitled Listing'}</Text>
            
            {isHousingListing(item) ? (
              <>
                <View style={styles.locationContainer}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.locationText}>
                    {item.suburb || 'Unknown'}, {item.state || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.housingFeatures}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureText}>
                      {item.bedrooms || 0} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureText}>
                      {item.bathrooms || 0} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.providerContainerSwipe}>
                {renderServiceProvider(item)}
                {item.provider?.verified && (
                  <View style={styles.verifiedBadgeSwipe}>
                    <BadgeCheck size={16} color="#007AFF" />
                    <Text style={styles.verifiedTextSwipe}>NDIS Certified</Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.swipeDescription} numberOfLines={3}>
              {item.description || 'No description available'}
            </Text>
            
            <View style={styles.swipeMeta}>
              <View style={styles.serviceRating}>
                <Star size={16} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
              <View style={styles.priceContainerSwipe}>
                {isServiceListing(item) && <Clock size={14} color="#666" style={styles.priceIconSwipe}/>}
                <Text style={styles.priceTextSwipe}>
                  ${getItemPrice(item)}
                  {isHousingListing(item) ? '/week' : (isServiceListing(item) ? '/ hour' : '')}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Action buttons - directly on the card */}
          <View style={styles.actionButtonsContainer}>
            <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
              <TouchableOpacity 
                style={styles.swipeActionLeft}
                onPress={handleDislike} // Use direct handler
              >
                <X size={36} color="#ff3b30" />
              </TouchableOpacity>
            </ShadowCard>
            
            <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
              <TouchableOpacity 
                style={styles.swipeActionRight}
                onPress={handleLike} // Use direct handler
              >
                <Heart size={36} color="#4cd964" fill="#4cd964" />
              </TouchableOpacity>
            </ShadowCard>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // If no listings are available
  if (listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No listings available</Text>
      </View>
    );
  }

  useEffect(() => {
    console.log(`[useEffect] currentIndex changed to: ${currentIndex}`);
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        {/* Third card - shown far behind */}
        {listings.length > 2 && (
          <Animated.View
            style={[
              styles.cardContainer,
              styles.thirdCardContainer,
              {
                transform: [
                  { scale: thirdCardScale },
                  { translateY: thirdCardTranslateY },
                  { translateX: thirdCardTranslateX }
                ],
                opacity: thirdCardOpacity,
                zIndex: 0
              }
            ]}
          >
            {getThirdItem() && renderCard(getThirdItem()!, true)}
          </Animated.View>
        )}
        
        {/* Next card - shown behind current card */}
        <Animated.View
          style={[
            styles.cardContainer,
            styles.nextCardContainer,
            {
              transform: [
                { scale: nextCardScale },
                { translateY: nextCardTranslateY },
                { translateX: nextCardTranslateX }
              ],
              opacity: nextCardOpacity,
              width: nextCardWidth,
              height: nextCardHeight,
              zIndex: 1
            }
          ]}
        >
          {getNextItem() && renderCard(getNextItem()!, true)}
        </Animated.View>
        
        {/* Current card - shown on top */}
        <Animated.View 
          style={[styles.cardContainer, styles.currentCardContainer]}
          {...panResponder.current.panHandlers} // ADDED panHandlers here
        >
          {getCurrentItem() && renderCard(
            getCurrentItem()!, 
            false
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: '100%',
    paddingBottom: 0,
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: 'transparent', // Use transparent background for container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentCardContainer: {
    width: width - 40,
    height: 550,
    zIndex: 2, // Ensure current card is above next card
    elevation: 5, // Higher elevation for current card
  },
  nextCardContainer: {
    // Next card is initially slightly smaller and positioned behind current card
    // Adding an offset to make the next card initially visible
    top: 20, // Shift down a bit
    left: 10, // Shift slightly to the right to be visible
    zIndex: 1,
    elevation: 2, // Lower elevation for next card
  },
  thirdCardContainer: {
    // Third card is even smaller and positioned behind next card
    // Adding an offset to create staggered effect
    width: width - 100,
    height: 510,
    top: 40, // Shift down more
    left: 20, // Shift slightly more to the right
    zIndex: 0,
    elevation: 1, // Lowest elevation for third card
  },
  swipeCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  staticCard: {
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
    width: '100%',
    height: 280,
  },
  swipeImage: {
    width: '100%',
    height: '100%',
  },
  groupMatchBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 217, 100, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
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
  priceContainerSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIconSwipe: {
    marginRight: 4,
  },
  priceTextSwipe: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  providerContainerSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  verifiedBadgeSwipe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 230, 230, 0.9)', // Slightly darker background for contrast
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  verifiedTextSwipe: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
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
});

export { SwipeListView };
export default SwipeListView;
