import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { ListingItem, HousingListing } from '../types';
import { SwipeCard } from './SwipeCard';
import { SwipeActions } from './SwipeActions';
import { ErrorBoundary } from './ErrorBoundary';

const { width } = Dimensions.get('window');

interface SwipeViewProps {
  listings: ListingItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onCardTap: (item: ListingItem) => void;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  renderServiceProvider: (item: ListingItem) => JSX.Element;
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
}) => {
  // Add a state to track if the current card is being swiped
  const [isCardSwiping, setIsCardSwiping] = useState(false);
  
  // Animation values for the next card
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.9)).current;
  const nextCardTranslateY = useRef(new Animated.Value(10)).current;
  const nextCardWidth = useRef(new Animated.Value(width - 80)).current;
  const nextCardHeight = useRef(new Animated.Value(530)).current;
  const nextCardElevation = useRef(new Animated.Value(2)).current;

  const animateNextCardToFront = () => {
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
      
      // Reset animation values for the new next card
      nextCardScale.setValue(0.92);
      nextCardOpacity.setValue(0.9);
      nextCardTranslateY.setValue(10);
      nextCardWidth.setValue(width - 80);
      nextCardHeight.setValue(530);
      nextCardElevation.setValue(2);
      
      // Reset swiping state
      setIsCardSwiping(false);
    });
  };

  const handleSwipe = (direction: string) => {
    // Set the swiping flag to prevent double-swipes
    if (isCardSwiping) return;
    setIsCardSwiping(true);

    // Animate the next card to become the current card
    animateNextCardToFront();
  };

  // Set up the initial animation values when component mounts
  useEffect(() => {
    nextCardScale.setValue(0.92);
    nextCardOpacity.setValue(0.9);
    nextCardTranslateY.setValue(10);
    nextCardWidth.setValue(width - 80);
    nextCardHeight.setValue(530);
    nextCardElevation.setValue(2);
  }, []);

  if (listings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Listings Found</Text>
        <Text style={styles.emptyStateText}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  }

  const currentItem = listings[currentIndex];
  const nextIndex = (currentIndex + 1) % listings.length;
  const nextItem = listings[nextIndex];

  // Create animated styles for the next card
  const nextCardAnimatedStyle = {
    transform: [
      { scale: nextCardScale },
      { translateY: nextCardTranslateY }
    ],
    opacity: nextCardOpacity,
    width: nextCardWidth,
    height: nextCardHeight,
    elevation: nextCardElevation,
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {/* Bottom/background card (next card) with animation */}
          {listings.length > 1 && (
            <View style={styles.nextCardContainer}>
              <Animated.View style={[styles.nextCardBase, nextCardAnimatedStyle]}>
                <SwipeCard
                  item={nextItem}
                  isNext={true}
                  getItemImage={getItemImage}
                  getItemPrice={getItemPrice}
                  isHousingListing={isHousingListing}
                  renderServiceProvider={renderServiceProvider}
                />
              </Animated.View>
            </View>
          )}

          {/* Top/foreground card (current card) */}
          <View style={styles.currentCardContainer}>
            <SwipeCard
              // Add a key to force re-render when card changes
              key={`card-${currentIndex}`}
              item={currentItem}
              onTap={() => onCardTap(currentItem)}
              onSwipe={handleSwipe}
              onCardLeftScreen={handleSwipe}
              getItemImage={getItemImage}
              getItemPrice={getItemPrice}
              isHousingListing={isHousingListing}
              renderServiceProvider={renderServiceProvider}
            />
          </View>
        </View>

        <SwipeActions
          onSwipeLeft={() => handleSwipe('left')}
          onSwipeRight={() => handleSwipe('right')}
        />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    width: width,
    height: 550,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  nextCardBase: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  currentCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

// Export the component as both a named export and a default export
export { SwipeView };
export default SwipeView;