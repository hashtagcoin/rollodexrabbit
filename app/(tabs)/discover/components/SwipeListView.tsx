import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, InteractionManager, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { ListingItem, Service, HousingListing } from '../types'; // Ensure types are imported
import { Heart, X } from 'lucide-react-native';
import SwipeCard, { SwipeCardProps } from './SwipeCard'; 

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const SWIPE_OUT_DURATION = 250;
const CARD_ROTATION = 10;

interface SwipeListViewProps<T extends ListingItem> {
  listings: T[];
  onEndReached?: () => void;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing;
  isServiceListing: (item: ListingItem) => item is Service;
  renderServiceProvider: (item: ListingItem) => React.ReactElement | null;
  hasHousingGroup: (item: T) => boolean;
  onCardTap: (item: T) => void;
  favorites: Set<string>;
}

const SwipeListView = <T extends ListingItem>({
  listings,
  onEndReached,
  onSwipeLeft,
  onSwipeRight,
  currentIndex,
  setCurrentIndex,
  getItemImage,
  getItemPrice,
  isHousingListing,
  isServiceListing,
  renderServiceProvider,
  hasHousingGroup,
  onCardTap,
  favorites
}: SwipeListViewProps<T>) => {
  const [nextCardScale] = useState(new Animated.Value(0.92)); // Make scale difference more pronounced
  const currentIndexRef = useRef(currentIndex);

  // Animation refs
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 1.5, 0, width / 1.5],
    outputRange: [`-${CARD_ROTATION}deg`, '0deg', `${CARD_ROTATION}deg`],
    extrapolate: 'clamp',
  });
  const opacity = useRef(new Animated.Value(1)).current; // Define opacity

  const nextCardTranslateY = useRef(new Animated.Value(-10)).current; // Adjust translation
  const nextCardTranslateX = useRef(new Animated.Value(0)).current;
  const nextCardOpacity = useRef(new Animated.Value(1)).current;
  const nextCardWidth = useRef(new Animated.Value(width * 0.85)).current; // Match style width
  const nextCardHeight = useRef(new Animated.Value(height * 0.65)).current; // Match style height

  const thirdCardScale = useRef(new Animated.Value(0.85)).current; // Make scale difference more pronounced
  const thirdCardTranslateY = useRef(new Animated.Value(-20)).current; // Adjust translation
  const thirdCardTranslateX = useRef(new Animated.Value(0)).current;
  const thirdCardOpacity = useRef(new Animated.Value(1)).current;

  const isCardSwipingRef = useRef(false);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Reset animations function
  const resetCardAnimations = useCallback(() => {
    console.log('[resetCardAnimations] Resetting ALL card animations');
    position.setValue({ x: 0, y: 0 });
    opacity.setValue(1); // Reset opacity
    nextCardScale.setValue(0.92);
    nextCardTranslateY.setValue(-10);
    nextCardTranslateX.setValue(0);
    nextCardOpacity.setValue(1);
    nextCardWidth.setValue(width * 0.85);
    thirdCardScale.setValue(0.85);
    thirdCardTranslateY.setValue(-20);
    thirdCardTranslateX.setValue(0);
    thirdCardOpacity.setValue(1);
  }, [position, opacity, nextCardScale, nextCardTranslateY, nextCardTranslateX, nextCardOpacity, nextCardWidth, thirdCardScale, thirdCardTranslateY, thirdCardTranslateX, thirdCardOpacity]);

  // Reset only next/third card animations (keep separate if needed)
  const resetNextCardAnimations = useCallback(() => {
    // ... (implementation as before)
  }, [nextCardScale, nextCardTranslateY, nextCardTranslateX, nextCardOpacity, nextCardWidth]);
  const resetThirdCardAnimations = useCallback(() => {
    // ... (implementation as before)
  }, [thirdCardScale, thirdCardTranslateY, thirdCardTranslateX, thirdCardOpacity]);

  // Animate the next card coming to the front
  const animateNextCardToFront = useCallback(() => {
    console.log('[animateNextCardToFront] Starting parallel animation for next/third cards.');
    Animated.parallel([
      // Animate next card to front
      Animated.spring(nextCardScale, { toValue: 1, friction: 7, useNativeDriver: false }),
      Animated.timing(nextCardTranslateY, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(nextCardTranslateX, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(nextCardOpacity, { toValue: 1, duration: 300, useNativeDriver: false }), // Ensure full opacity
      Animated.timing(nextCardWidth, { toValue: width * 0.85, duration: 300, useNativeDriver: false }), // Animate width to base
      Animated.timing(nextCardHeight, { toValue: height * 0.65, duration: 300, useNativeDriver: false }), // Animate height to base

      // Animate third card slightly up
      Animated.timing(thirdCardScale, {
        toValue: 0.92, // Scale for third card (new second)
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(thirdCardTranslateY, {
        toValue: -10, // Move to new second position
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(thirdCardTranslateX, {
        toValue: 0, // Keep centered horizontally
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(thirdCardOpacity, { toValue: 1, duration: 300, useNativeDriver: false }), // Ensure third card visible

    ]).start(() => {
      console.log('[animateNextCardToFront] Parallel animation completed. Resetting and updating index.');
      // FIX: Reset only the swiped card's position/opacity, not the whole stack's animations.
      // position.setValue({ x: 0, y: 0 }); // Reset position for the *next* card render at top
      // opacity.setValue(1);             // Reset opacity for the *next* card render at top

      // Update the index FIRST
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % listings.length;
        console.log(`[animateNextCardToFront] Updating currentIndex from ${prevIndex} to ${nextIndex}`);
        return nextIndex;
      });

      // FIX: Reset animations AFTER updating currentIndex to prepare for next interaction
      resetCardAnimations(); // Reset pan responder position/opacity/rotate AND stack scale/translate
      // resetNextCardAnimations(); // Covered by resetCardAnimations
      // resetThirdCardAnimations(); // Covered by resetCardAnimations

      // Card is no longer swiping after animations reset and index updated
      isCardSwipingRef.current = false;
      console.log('[animateNextCardToFront] isCardSwipingRef set to false.');
    });
  }, [listings.length, currentIndex, nextCardScale, nextCardTranslateY, nextCardTranslateX, nextCardOpacity, nextCardWidth, nextCardHeight, thirdCardScale, thirdCardTranslateY, thirdCardTranslateX, thirdCardOpacity]);

  // Finalize swipe action
  const finalizeSwipe = useCallback((direction: 'left' | 'right') => {
    const currentItem = listings[currentIndexRef.current % listings.length];
    // ... (rest of implementation as before, calls animateNextCardToFront)
    InteractionManager.runAfterInteractions(() => {
      if (direction === 'right' && onSwipeRight) {
        onSwipeRight(currentItem);
      } else if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft(currentItem);
      }
      animateNextCardToFront();
    });
  }, [listings, onSwipeLeft, onSwipeRight, animateNextCardToFront]);

  // PanResponder Handlers
  const handlePanGrant = useCallback((evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    // ... (implementation as before)
  }, []);

  const handlePanMove = useCallback((evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (isCardSwipingRef.current) return;
    position.setValue({ x: gestureState.dx, y: gestureState.dy });
    // Update opacity based on horizontal movement
    const currentOpacity = 1 - Math.abs(gestureState.dx) / (width / 1.5);
    opacity.setValue(Math.max(0.5, currentOpacity));
    // ... (update next/third card parallax)
    nextCardTranslateX.setValue(gestureState.dx * 0.05);
    thirdCardTranslateX.setValue(gestureState.dx * 0.02);
  }, [position, opacity, nextCardTranslateX, thirdCardTranslateX]);

  const handlePanRelease = useCallback((evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (isCardSwipingRef.current) return;
    let direction: 'left' | 'right' | null = null;

    if (gesture.dx > SWIPE_THRESHOLD) {
      direction = 'right';
    } else if (gesture.dx < -SWIPE_THRESHOLD) {
      direction = 'left';
    } else {
      // Reset position and opacity
      Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: false }).start();
      // Reset next/third card parallax translations
      Animated.timing(nextCardTranslateX, { toValue: 0, duration: 150, useNativeDriver: false }).start();
      Animated.timing(thirdCardTranslateX, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    }

    if (direction) {
      isCardSwipingRef.current = true;
      const swipeToX = direction === 'right' ? width + 100 : -width - 100;
      // Start swipe-off animation for position
      Animated.timing(position, {
        toValue: { x: swipeToX, y: gesture.dy * 0.2 + 50 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => {
        finalizeSwipe(direction!); // Call finalize on completion
      });
      // Start fade-out animation for opacity
      Animated.timing(opacity, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION * 0.8,
        useNativeDriver: false,
      }).start();
    }
  }, [position, opacity, nextCardTranslateX, thirdCardTranslateX, finalizeSwipe]);

  // Refs for latest callbacks
  const handlePanReleaseRef = useRef(handlePanRelease);
  useEffect(() => { handlePanReleaseRef.current = handlePanRelease; }, [handlePanRelease]);

  // Create PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCardSwipingRef.current,
      onMoveShouldSetPanResponder: (evt, gestureState) => /* ... */ !isCardSwipingRef.current && Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: handlePanGrant,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: (evt, gestureState) => {
        // Handle termination, reset position/opacity
        Animated.spring(position, { toValue: { x: 0, y: 0 }, /* ... */ useNativeDriver: false }).start();
        Animated.timing(opacity, { toValue: 1, /* ... */ useNativeDriver: false }).start();
        resetNextCardAnimations();
        resetThirdCardAnimations();
        isCardSwipingRef.current = false;
      },
      onPanResponderMove: handlePanMove,
      onPanResponderRelease: (evt, gesture) => { handlePanReleaseRef.current(evt, gesture); },
    })
  );

  // Helper function for card tap
  const handleCardTapInternal = (item: T) => {
    if (!isCardSwipingRef.current && onCardTap) {
      onCardTap(item); // Call the passed prop
    }
  };

  // Like/Dislike handlers for buttons
  const handleDislike = useCallback(() => {
    if (isCardSwipingRef.current || listings.length === 0) return;
    isCardSwipingRef.current = true;
    Animated.timing(position, { toValue: { x: -width - 100, y: 50 }, duration: SWIPE_OUT_DURATION, useNativeDriver: false }).start(() => {
      finalizeSwipe('left');
    });
    Animated.timing(opacity, { toValue: 0, duration: SWIPE_OUT_DURATION * 0.8, useNativeDriver: false }).start();
  }, [position, opacity, finalizeSwipe, listings.length]);
  const handleLike = useCallback(() => {
    if (isCardSwipingRef.current || listings.length === 0) return;
    isCardSwipingRef.current = true;
    Animated.timing(position, { toValue: { x: width + 100, y: 50 }, duration: SWIPE_OUT_DURATION, useNativeDriver: false }).start(() => {
      finalizeSwipe('right');
    });
    Animated.timing(opacity, { toValue: 0, duration: SWIPE_OUT_DURATION * 0.8, useNativeDriver: false }).start();
  }, [position, opacity, finalizeSwipe, listings.length]);

  // --- Calculate indices to render --- 
  const indicesToRender = useMemo(() => {
    if (listings.length === 0) return [];
    // Ensure indices are within bounds and item exists
    return Array.from(new Set([
      currentIndex % listings.length,
      (currentIndex + 1) % listings.length,
      (currentIndex + 2) % listings.length,
    ])).filter(index => index >= 0 && index < listings.length && listings[index] !== undefined);
  }, [listings, currentIndex]);

  // --- Sort indices for rendering order (bottom to top) --- 
  const sortedIndices = useMemo(() => {
    if (indicesToRender.length === 0) return [];
    // Sort based on stack position relative to current index (2, 1, 0)
    return [...indicesToRender].sort((a, b) => {
      const posA = (a - currentIndex + listings.length) % listings.length;
      const posB = (b - currentIndex + listings.length) % listings.length;
      // Ensure correct descending sort for stack positions 0, 1, 2
      // If one is > 2 and other isn't, the one <= 2 comes first (higher stack pos)
      if (posA > 2 && posB <= 2) return 1;
      if (posB > 2 && posA <= 2) return -1;
      // If both > 2, order doesn't strictly matter for rendering stack
      if (posA > 2 && posB > 2) return 0;
      // Otherwise, sort by position descending (2, 1, 0)
      return posB - posA;
    });
  }, [indicesToRender, currentIndex, listings.length]);

  // Main Render Return Block (Refactored without IIFE)
  return (
    <View style={styles.container}>
      {/* Deck Container - Renders the stack of cards directly */} 
      <View style={styles.deckContainer}>
        {listings.length === 0 ? (
          <Text>No listings.</Text> // Handle empty case explicitly
        ) : (
          // Map over sorted indices directly
          sortedIndices.map((actualIndex) => {
            const item = listings[actualIndex];
            // Basic safety check
            if (!item) return null;

            const stackPosition = (actualIndex - currentIndex + listings.length) % listings.length;
            // Filter out cards not meant to be visible here if needed 
            // (though sorting logic might already handle this)
            if (stackPosition > 2) {
              // This condition might be redundant if sorting correctly filters
              console.log(`[Render Map] SKIPPING actualIndex: ${actualIndex}, stackPosition: ${stackPosition} (Should be filtered by sort?)`);
              return null;
            }
            console.log(`[Render Map] RENDERING actualIndex: ${actualIndex}, stackPosition: ${stackPosition}, ItemID: ${item.id}`);

            let cardStyle: Animated.AnimatedProps<any> = {};
            // Calculate transform and style based on stackPosition
            // (Ensure transform values are correct)
            if (stackPosition === 0) { // Current card
              cardStyle = {
                transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotate }],
                opacity: opacity,
                zIndex: 3,
              };
            } else if (stackPosition === 1) { // Next card
              cardStyle = {
                transform: [{ scale: nextCardScale }, { translateY: nextCardTranslateY }, { translateX: nextCardTranslateX }],
                opacity: nextCardOpacity,
                width: nextCardWidth,
                height: nextCardHeight,
                zIndex: 2,
              };
            } else if (stackPosition === 2) { // Third card
              cardStyle = {
                transform: [{ scale: thirdCardScale }, { translateY: thirdCardTranslateY }, { translateX: thirdCardTranslateX }],
                opacity: thirdCardOpacity,
                zIndex: 1,
              };
            } else { 
              // Cards beyond the 3rd should ideally not be rendered due to filtering/sorting,
              // but provide a fallback style just in case.
              cardStyle = { opacity: 0, zIndex: 0 }; 
            }
            
            const baseCardStyle = stackPosition === 0 
              ? styles.currentCardContainer 
              : styles.nextCardContainer;
            const handlers = stackPosition === 0 
              ? panResponder.current.panHandlers 
              : {};
              
            // Determine props for SwipeCard
            const isTopCard = stackPosition === 0;
            const currentIsFavorite = favorites.has(item.id);

            // Pass necessary rendering functions down to SwipeCard
            const cardProps = {
              item: item,
              isTopCard: isTopCard,
              onTap: () => handleCardTapInternal(item),
              isServiceListing: isServiceListing,
              isFavorite: currentIsFavorite,
              // Pass utility functions
              getItemImage: getItemImage,
              getItemPrice: getItemPrice,
              isHousingListing: isHousingListing,
              renderServiceProvider: renderServiceProvider,
              // We might need hasHousingGroup too, depending on SwipeCard's logic
              // hasHousingGroup: hasHousingGroup 
            };

            return (
              <Animated.View
                key={item.id}
                style={[ styles.cardContainer, baseCardStyle, cardStyle ]}
                {...handlers}
              >
                {/* Render SwipeCard directly */}
                <SwipeCard
                  // Spread the collected props
                  {...cardProps}
                  // Explicitly pass props if preferred over spreading
                  /* 
                  item={item}
                  isTopCard={isTopCard}
                  onTap={() => handleCardTapInternal(item)}
                  isServiceListing={isServiceListing}
                  isFavorite={currentIsFavorite}
                  getItemImage={getItemImage}
                  getItemPrice={getItemPrice}
                  isHousingListing={isHousingListing}
                  renderServiceProvider={renderServiceProvider}
                  */
                />
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Action Buttons */} 
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleDislike} style={[styles.button, styles.dislikeButton]}>
          <X size={32} color="#FF5864" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLike} style={[styles.button, styles.likeButton]}>
          <Heart size={32} color="#4CCC93" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%', // Ensure container takes full height if needed
    paddingBottom: 80, // Adjust if buttons overlap content
    // backgroundColor: '#f0f0f0', // Optional background for debugging layout
  },
  deckContainer: {
    flex: 1, // Take available space above buttons
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#e0e0e0', // Optional background
    // Removed marginTop if deck handles positioning
  },
  cardContainer: {
    position: 'absolute',
    width: width * 0.85, // Reduced width
    height: height * 0.65, // Set fixed height
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden', // Clip content like images
  },
  currentCardContainer: {
    // Specific styles for the top card if needed
  },
  nextCardContainer: {
    // Specific styles for non-top cards if needed
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20, // Position buttons at the bottom
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '80%',
    // backgroundColor: 'rgba(255, 255, 255, 0.8)', // Optional semi-transparent background
    // paddingVertical: 10,
    // borderRadius: 30,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 40, // Circular buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  likeButton: {
    // Specific styles if needed (e.g., border)
  },
  dislikeButton: {
    // Specific styles if needed (e.g., border)
  },
  // ... other existing styles ...
});

export default SwipeListView;
