import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Heart, X, House } from 'lucide-react-native';
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

export const SwipeView: React.FC<SwipeViewProps> = ({
  listings,
  currentIndex,
  setCurrentIndex,
  onCardTap,
  getItemImage,
  getItemPrice,
  isHousingListing,
  renderServiceProvider,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.9)).current;
  const nextCardTranslateY = useRef(new Animated.Value(15)).current;
  const rotateCard = useRef(new Animated.Value(0)).current;

  const swipeAnimationDuration = 300;
  const resetDuration = 250;

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(rotateCard, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardScale, {
        toValue: 0.92,
        duration: resetDuration,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 0.9,
        duration: resetDuration,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 15,
        duration: resetDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const finishSwipeAnimation = (direction: 'left' | 'right') => {
    const xPosition = direction === 'left' ? -width * 1.5 : width * 1.5;
    
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: xPosition, y: 0 },
        duration: swipeAnimationDuration,
        useNativeDriver: false,
      }),
      Animated.timing(rotateCard, {
        toValue: direction === 'left' ? -15 : 15,
        duration: swipeAnimationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: swipeAnimationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1,
        duration: swipeAnimationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: swipeAnimationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      rotateCard.setValue(0);
      position.setValue({ x: 0, y: 0 });
      
      if (currentIndex < listings.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      
      nextCardScale.setValue(0.92);
      nextCardOpacity.setValue(0.9);
      nextCardTranslateY.setValue(15);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 });
      rotateCard.setValue(gesture.dx / 15);
    },
    onPanResponderRelease: (_, gesture) => {
      const swipeThreshold = width * 0.25;
      const velocityThreshold = 0.5;
      
      if (Math.abs(gesture.vx) > velocityThreshold) {
        finishSwipeAnimation(gesture.vx > 0 ? 'right' : 'left');
      } else if (gesture.dx > swipeThreshold) {
        finishSwipeAnimation('right');
      } else if (gesture.dx < -swipeThreshold) {
        finishSwipeAnimation('left');
      } else {
        resetCardPosition();
      }
    },
  });

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
  const nextItem = listings[(currentIndex + 1) % listings.length];

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {listings.length > 1 && (
          <SwipeCard
            item={nextItem}
            isNext={true}
            getItemImage={getItemImage}
            getItemPrice={getItemPrice}
            isHousingListing={isHousingListing}
            renderServiceProvider={renderServiceProvider}
            style={{
              transform: [
                { scale: nextCardScale },
                { translateY: nextCardTranslateY }
              ],
              opacity: nextCardOpacity,
            }}
          />
        )}

        <SwipeCard
          item={currentItem}
          onTap={() => onCardTap(currentItem)}
          getItemImage={getItemImage}
          getItemPrice={getItemPrice}
          isHousingListing={isHousingListing}
          renderServiceProvider={renderServiceProvider}
          style={{
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              {
                rotate: rotateCard.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: ['-10deg', '0deg', '10deg'],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
          {...panResponder.panHandlers}
        />

        <Animated.View 
          style={[
            styles.swipeIndicator,
            styles.likeIndicator,
            {
              opacity: position.x.interpolate({
                inputRange: [0, 50, 100],
                outputRange: [0, 0.5, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Heart size={80} color="#4cd964" fill="#4cd964" />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.swipeIndicator,
            styles.dislikeIndicator,
            {
              opacity: position.x.interpolate({
                inputRange: [-100, -50, 0],
                outputRange: [1, 0.5, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <X size={80} color="#ff3b30" />
        </Animated.View>

        <SwipeActions
          onSwipeLeft={() => finishSwipeAnimation('left')}
          onSwipeRight={() => finishSwipeAnimation('right')}
        />

        <View style={styles.progress}>
          <Text style={styles.counter}>
            {currentIndex + 1} of {listings.length}
          </Text>
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
    paddingTop: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  likeIndicator: {
    opacity: 0,
    alignItems: 'center',
  },
  dislikeIndicator: {
    opacity: 0,
    alignItems: 'center',
  },
  progress: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  counter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  }
});