import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { Heart, Share2, MapPin, CalendarDays, Users } from 'lucide-react-native'; // Assuming you use lucide-react-native

export interface CommunityEntityItem {
  id: string;
  type: 'group' | 'group_event' | 'housing_group';
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  category?: string | null; 
  startTime?: string | null; 
  location?: string | null; 
  address?: string | null; 
  isFavorited: boolean;
  // Optional: For housing groups, you might want to pass specific details
  housingGroupSpecifics?: {
    members?: number;
    // other housing group specific details
  };
  // Optional: For events, specific details
  eventSpecifics?: {
    attendees?: number;
    // other event specific details
  };
}

interface CommunityEntityCardProps {
  item: CommunityEntityItem;
  onPress: (item: CommunityEntityItem) => void;
  onToggleFavorite: (itemId: string, itemType: CommunityEntityItem['type'], currentIsFavorited: boolean) => void;
  onShare: (item: CommunityEntityItem) => void;
}

const CommunityEntityCard: React.FC<CommunityEntityCardProps> = ({ item, onPress, onToggleFavorite, onShare }) => {
  const { id, type, title, description, imageUrl, category, startTime, location, address, isFavorited } = item;

  const handleFavoritePress = () => {
    onToggleFavorite(id, type, isFavorited);
  };

  const handleSharePress = () => {
    onShare(item);
  };

  const renderMetaInfo = () => {
    switch (type) {
      case 'group':
        return category ? (
          <View style={styles.metaItemContainer}>
            <Users size={14} color="#666" />
            <Text style={styles.metaText}>{category}</Text>
          </View>
        ) : null;
      case 'group_event':
        return (
          <>
            {startTime && (
              <View style={styles.metaItemContainer}>
                <CalendarDays size={14} color="#666" />
                <Text style={styles.metaText}>{new Date(startTime).toLocaleDateString()}</Text> 
              </View>
            )}
            {location && (
              <View style={styles.metaItemContainer}>
                <MapPin size={14} color="#666" />
                <Text style={styles.metaText}>{location}</Text>
              </View>
            )}
          </>
        );
      case 'housing_group':
        return address ? (
          <View style={styles.metaItemContainer}>
            <MapPin size={14} color="#666" />
            <Text style={styles.metaText}>{address}</Text>
          </View>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Pressable onPress={() => onPress(item)} style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]} >
            <Text style={styles.placeholderText}>{title ? title.charAt(0).toUpperCase() : '?'}</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{title || 'No Title'}</Text>
            <View style={styles.iconsContainer}>
                <TouchableOpacity onPress={handleFavoritePress} style={styles.iconButton}>
                    <Heart size={20} color={isFavorited ? '#FF6347' : '#CCC'} fill={isFavorited ? '#FF6347' : 'none'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSharePress} style={styles.iconButton}>
                    <Share2 size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>{description || 'No description available.'}</Text>
        <View style={styles.metaContainer}>
          {renderMetaInfo()}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#E0E0E0', // Placeholder background
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#A0A0A0',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1, // Allow title to shrink if icons take space
    marginRight: 8, // Space before icons
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4, // Easier to tap
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'column', // Changed from row to column for multiple meta items
    // flexWrap: 'wrap', // No longer needed if column
    marginTop: 'auto', // Push meta to bottom if cardContent has space
  },
  metaItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12, // Spacing between meta items if they were in a row
    marginBottom: 4, // Spacing for items in a column
  },
  metaText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
  },
});

export default CommunityEntityCard;
