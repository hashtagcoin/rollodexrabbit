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
  hasHousingGroup?: (item: ListingItem) => boolean;
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

  const getCurrentItem = () => {
    if (listings.length === 0) return null;
    return listings[currentIndex];
  };

  const getNextItem = () => {
    if (listings.length <= 1) return null;
    return listings[(currentIndex + 1) % listings.length];
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
          {/* Next card - shown behind current card */}
          <Animated.View
            style={[
              styles.cardContainer,
              styles.nextCardContainer,
              {
                transform: [
                  { scale: nextCardScale },
                  { translateY: nextCardTranslateY }
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
              getItemImage={getItemImage}
              getItemPrice={getItemPrice}
              isHousingListing={isHousingListing}
              renderServiceProvider={renderServiceProvider}
              hasHousingGroup={hasHousingGroup}
            />
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <SwipeActions onSwipe={handleSwipe} />
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
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  currentCardContainer: {
    width: width - 40,
    height: 550,
    elevation: 5,
    zIndex: 10,
  },
  nextCardContainer: {
    position: 'absolute',
  },
  actionsContainer: {
    width: '100%',
    paddingBottom: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});

export { SwipeView };
export default SwipeView;