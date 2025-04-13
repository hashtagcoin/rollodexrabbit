import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Heart, X, House, Calendar, MapPin, Users } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';

// Types for different favorite items
type FavoriteType = 'housing' | 'housing-group' | 'event' | 'service';

interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  imageUrl: string;
  createdAt: string;
  metadata: any;
}

// Demo data for favorites
const demoFavorites: FavoriteItem[] = [
  {
    id: 'house-1',
    type: 'housing',
    title: '3 Bedroom House in Richmond',
    subtitle: '$450/week | Available Now',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    createdAt: new Date().toISOString(),
    metadata: {
      address: '123 Main St, Richmond',
      bedrooms: 3,
      bathrooms: 2
    }
  },
  {
    id: 'group-1',
    type: 'housing-group',
    title: 'Greenwood House',
    subtitle: '3 members | 1 spot available',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
    createdAt: new Date().toISOString(),
    metadata: {
      address: '26 Maple St',
      members: 3,
      maxMembers: 4
    }
  },
  {
    id: 'event-1',
    type: 'event',
    title: 'Community Garden Day',
    subtitle: 'May 20 | 2:00 PM',
    imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735',
    createdAt: new Date().toISOString(),
    metadata: {
      location: 'Richmond Community Center',
      date: '2025-05-20T14:00:00.000Z'
    }
  },
  {
    id: 'service-1',
    type: 'service',
    title: 'Mental Health Support Group',
    subtitle: 'Weekly Sessions | Virtual',
    imageUrl: 'https://images.unsplash.com/photo-1573497491765-55776c18f9bb',
    createdAt: new Date().toISOString(),
    metadata: {
      provider: 'Community Health Services',
      frequency: 'Weekly'
    }
  }
];

// Filter options for favorites
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Housing', value: 'housing' },
  { label: 'Groups', value: 'housing-group' },
  { label: 'Events', value: 'event' },
  { label: 'Services', value: 'service' }
];

export default function FavoritesScreen() {
  const { session } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // Load favorites from API (mock for now)
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // In a real implementation, we would fetch from the database
        // For now, use demo data
        setFavorites(demoFavorites);
        setLoading(false);
      } catch (error) {
        console.error('Error loading favorites:', error);
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Filter favorites based on selected type
  const filteredFavorites = activeFilter === 'all'
    ? favorites
    : favorites.filter(fav => fav.type === activeFilter);

  // Navigate to the corresponding detail screen based on item type
  const handleItemPress = (item: FavoriteItem) => {
    switch (item.type) {
      case 'housing':
        router.push(`/housing/${item.id}`);
        break;
      case 'housing-group':
        router.push(`/housing/group/${item.id}`);
        break;
      case 'event':
        router.push({
          pathname: "/(tabs)/community",
          params: { screen: "events", id: item.id }
        });
        break;
      case 'service':
        router.push({
          pathname: "/(tabs)/community",
          params: { screen: "services", id: item.id }
        });
        break;
    }
  };

  // Remove item from favorites
  const removeFavorite = (id: string) => {
    // In a real implementation, we would update the database
    // For now, just update local state
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  // Get display name for item type
  const getTypeDisplayName = (type: FavoriteType): string => {
    switch (type) {
      case 'housing':
        return 'Housing';
      case 'housing-group':
        return 'Group';
      case 'event':
        return 'Event';
      case 'service':
        return 'Service';
      default:
        return '';
    }
  };

  // Get color for item type
  const getTypeColor = (type: FavoriteType): string => {
    switch (type) {
      case 'housing':
        return '#007AFF'; // Blue
      case 'housing-group':
        return '#4CAF50'; // Green
      case 'event':
        return '#FF9800'; // Orange
      case 'service':
        return '#9C27B0'; // Purple
      default:
        return '#999';
    }
  };

  // Render icon based on item type
  const renderItemIcon = (type: FavoriteType) => {
    switch (type) {
      case 'housing':
        return <House size={18} color="#666" />;
      case 'housing-group':
        return <Users size={18} color="#666" />;
      case 'event':
        return <Calendar size={18} color="#666" />;
      case 'service':
        return <MapPin size={18} color="#666" />;
    }
  };

  // Render individual favorite item
  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage} 
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFavorite(item.id)}
          >
            <X size={18} color="#999" />
          </TouchableOpacity>
        </View>
        <View style={styles.itemDetails}>
          {renderItemIcon(item.type)}
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.itemFooter}>
          <View 
            style={[
              styles.typeLabel, 
              { backgroundColor: getTypeColor(item.type) }
            ]}
          >
            <Text style={styles.typeLabelText}>{getTypeDisplayName(item.type)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="My Favorites" />
      
      {/* Filter options */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterOption,
                activeFilter === filter.value && styles.activeFilterOption
              ]}
              onPress={() => setActiveFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.value && styles.activeFilterText
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Favorites list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      ) : filteredFavorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'You haven\'t added any favorites yet. Tap the heart icon on items you like to save them here.'
              : `You haven't added any ${activeFilter} favorites yet.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 12,
  },
  filterOption: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#f0f0f0',
  },
  activeFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    padding: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemContent: {
    flex: 1,
    padding: 12,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  typeLabel: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
