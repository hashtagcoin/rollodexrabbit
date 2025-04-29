import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { Heart, MoreVertical, Bed, Bath, Home, Calendar } from 'lucide-react-native';
import GroupMatchIcon from '../../housing/components/GroupMatchIcon';

function getTimeAgo(createdAt?: string) {
  if (!createdAt) return 'Recently added';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Added just now';
  if (diffHrs === 1) return 'Added 1 hour ago';
  return `Added ${diffHrs} hours ago`;
}

import type { HousingListing } from '../types';

interface HousingCardProps {
  item: HousingListing;
  onPress: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onMorePress: () => void;
  showGroupMatch: boolean;
}

export default function HousingCard({
  item,
  onPress,
  onToggleFavorite,
  isFavorite,
  onMorePress,
  showGroupMatch,
}: HousingCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.media_urls?.[0] || 'https://via.placeholder.com/400x300?text=No+Image' }}
          style={styles.cardImage}
          resizeMode="cover"
          accessible
          accessibilityLabel="Property image"
        />
        <View style={styles.pillOverlay} accessible accessibilityLabel={'Recently added'}>
          <Text style={styles.pillText}>Recently added</Text>
        </View>
        {showGroupMatch && <GroupMatchIcon style={styles.groupMatchIcon} />}
        <View style={styles.topRightIcons}>
          <Pressable onPress={onToggleFavorite} accessible accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Heart size={20} color={isFavorite ? '#ff4081' : '#ccc'} fill={isFavorite ? '#ff4081' : 'none'} />
          </Pressable>
          <Pressable onPress={onMorePress} style={{ marginLeft: 12 }} accessible accessibilityLabel="More options">
            <MoreVertical size={20} color="#888" />
          </Pressable>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.priceText}>${item.weekly_rent} per week</Text>
        <Text style={styles.addressText}>{item.suburb + ', ' + item.state}</Text>
        <View style={styles.featuresRow}>
          <View style={styles.featureItem} accessible accessibilityLabel={`${item.bedrooms} bedrooms`}>
            <Bed size={16} color="#007AFF" />
            <Text style={styles.featureText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.featureItem} accessible accessibilityLabel={`${item.bathrooms} bathrooms`}>
            <Bath size={16} color="#007AFF" />
            <Text style={styles.featureText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.featureItem} accessible accessibilityLabel={item.sda_category || 'Apartment'}>
            <Home size={16} color="#007AFF" />
            <Text style={styles.featureText}>{item.sda_category || 'Apartment'}</Text>
          </View>
        </View>
        <View style={styles.inspectionRow}>
          <Calendar size={14} color="#888" style={{ marginRight: 4 }} />
          <Text style={styles.inspectionText}>{'Inspection info unavailable'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    flex: 1,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#eee',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  pillOverlay: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  topRightIcons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  groupMatchIcon: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 2,
  },
  cardContent: {
    padding: 14,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  featureText: {
    fontSize: 13,
    color: '#222',
    marginLeft: 4,
    fontWeight: '500',
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  inspectionText: {
    fontSize: 12,
    color: '#888',
  },
});
