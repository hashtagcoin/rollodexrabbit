import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { ListingItem, HousingListing } from '../types';

const { width } = Dimensions.get('window');

interface SwipeCardProps {
  item: ListingItem;
  isNext?: boolean;
  onTap?: () => void;
  style?: any;
  getItemImage: (item: ListingItem) => string;
  getItemPrice: (item: ListingItem) => number;
  isHousingListing: (item: ListingItem) => item is HousingListing; // Update this type
  renderServiceProvider: (item: ListingItem) => JSX.Element;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  item,
  isNext,
  onTap,
  style,
  getItemImage,
  getItemPrice,
  isHousingListing,
  renderServiceProvider,
}) => {
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

  return isNext ? (
    <Animated.View style={[styles.nextCard, style]}>
      <CardContent />
    </Animated.View>
  ) : (
    <Animated.View style={[styles.swipeCard, style]}>
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
    width: width - 40,
    height: 550,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  nextCard: {
    width: width - 80,
    height: 530,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  locationText: {
    fontSize: 12,
    color: '#666',
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