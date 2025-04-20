import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { ListingItem, HousingListing, Service } from '../types';
import SwipeCard from './SwipeCard';
import { ErrorBoundary } from './ErrorBoundary';
import { Heart, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SwipeViewProps {
  listings: ListingItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onCardTap: (item: ListingItem) => void;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  renderServiceProvider: (item: ListingItem) => JSX.Element;
  hasHousingGroup?: (item: ListingItem) => boolean;
  isServiceListing: (item: ListingItem) => item is Service;
  isFavorite?: (itemId: string) => boolean;
}

const SwipeView: React.FC<SwipeViewProps> = ({
  listings,
  currentIndex,
  setCurrentIndex,
  onCardTap,
  getItemImage,
  getItemPrice,
  isHousingListing,
  renderServiceProvider,
  hasHousingGroup,
  isServiceListing = (item: ListingItem): item is Service => false,
  isFavorite = () => false,
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
  const nextCardElevation = useRef(new Animated.Value(2)).current;
  
  // Animation values for the third card (the one behind the next card)
  const thirdCardScale = useRef(new Animated.Value(0.84)).current;
  const thirdCardOpacity = useRef(new Animated.Value(0.8)).current; // Increased opacity
  const thirdCardTranslateY = useRef(new Animated.Value(40)).current;
  const thirdCardTranslateX = useRef(new Animated.Value(0)).current; // Add horizontal offset

  // Reset all card animations to their initial values
  const resetCardAnimations = () => {
    // Next card
    nextCardScale.setValue(0.95);
    nextCardOpacity.setValue(1);
    nextCardTranslateY.setValue(20);
    nextCardTranslateX.setValue(0);
    nextCardWidth.setValue(width - 70);
    nextCardHeight.setValue(530);
    nextCardElevation.setValue(2);
    
    // Third card
    thirdCardScale.setValue(0.84);
    thirdCardOpacity.setValue(0.8);
    thirdCardTranslateY.setValue(40);
    thirdCardTranslateX.setValue(0);
    
    // Reset states
    setIsCardSwiping(false);
    setSwipeProgress(0);
    setSwipeDirection('none');
  };

  const animateNextCardToFront = () => {
    // First animate the third card to become the next card
    Animated.parallel([
      Animated.timing(thirdCardScale, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(thirdCardOpacity, {
        toValue: 1,
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
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // Can't use native driver for dimension changes
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1,
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
      Animated.timing(nextCardElevation, {
        toValue: 5, // Target elevation of top card
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // After animation completes, update the index
      if (currentIndex < listings.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      
      // Reset all animations to prepare for next swipe
      resetCardAnimations();
    });
  };

  const handleSwipe = (direction: string) => {
    // Set the swiping flag to prevent double-swipes
    if (isCardSwiping) return;
    setIsCardSwiping(true);
    setSwipeDirection(direction as 'left' | 'right');

    // Animate the next card to become the current card
    animateNextCardToFront();
  };

  const handleSwipeProgress = (progress: number, direction: string) => {
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
    nextCardScale.setValue(0.95 + (progress * 0.05)); // Scale from 0.95 to 1.0
    nextCardOpacity.setValue(1); // Opacity remains at 1
    nextCardTranslateY.setValue(20 - (progress * 20)); // Move up from 20 to 0
    nextCardTranslateX.setValue((progress * 10)); // Move horizontally
    nextCardWidth.setValue((width - 70) + (progress * 30)); // Width from smaller to larger
    nextCardHeight.setValue(530 + (progress * 20)); // Height from smaller to larger
    nextCardElevation.setValue(2 + (progress * 3)); // Elevation from 2 to 5
    
    // Also adjust the third card
    thirdCardScale.setValue(0.84 + (progress * 0.11)); // Scale from 0.84 to 0.95
    thirdCardOpacity.setValue(0.8 + (progress * 0.2)); // Opacity from 0.8 to 1.0
    thirdCardTranslateY.setValue(40 - (progress * 20)); // Move up from 40 to 20
    thirdCardTranslateX.setValue((progress * 10)); // Move horizontally
  };

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

  // If no listings are available
  if (listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No listings available</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
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
              {getThirdItem() && (
                <SwipeCard
                  item={getThirdItem()!}
                  isNext={true}
                  isServiceListing={(item: ListingItem): item is Service => false}
                  isTopCard={false} // Placeholder (Third card is not top)
                  isFavorite={false} // Placeholder
                  getItemImage={getItemImage}
                  getItemPrice={getItemPrice}
                  isHousingListing={isHousingListing}
                  renderServiceProvider={renderServiceProvider}
                />
              )}
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
                elevation: nextCardElevation,
                zIndex: 1
              }
            ]}
          >
            {getNextItem() && (
              <SwipeCard
                item={getNextItem()!}
                isNext={true}
                isServiceListing={(item: ListingItem): item is Service => false}
                isTopCard={false} // Placeholder (Next card is not top)
                isFavorite={false} // Placeholder
                getItemImage={getItemImage}
                getItemPrice={getItemPrice}
                isHousingListing={isHousingListing}
                renderServiceProvider={renderServiceProvider}
              />
            )}
          </Animated.View>
          
          {/* Current card - shown on top */}
          <View style={[styles.cardContainer, styles.currentCardContainer]}>
            <SwipeCard
              key={`card-${currentIndex}`}
              item={getCurrentItem()!}
              onTap={() => onCardTap(getCurrentItem()!)}
              onSwipe={handleSwipe}
              onCardLeftScreen={handleSwipe}
              onSwipeProgress={handleSwipeProgress}
              isServiceListing={isServiceListing}
              isTopCard={true} // This is the top card
              isFavorite={isFavorite(getCurrentItem()!.id)}
              getItemImage={getItemImage}
              getItemPrice={getItemPrice}
              isHousingListing={isHousingListing}
              renderServiceProvider={renderServiceProvider}
              hasHousingGroup={hasHousingGroup}
              showActionButtons={true} // New prop to show action buttons on the card
            />
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width, // Full screen width
    height: '100%', // Full available height
    paddingBottom: 0, // No bottom padding to touch bottom nav
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0, // Remove top margin
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Full width
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});

// Export with a default export to match our pattern and fix Expo Router warnings
export default SwipeView;