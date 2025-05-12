import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Pressable, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { X as XIcon } from 'lucide-react-native'; // Import XIcon
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import AppHeader from '../../../components/AppHeader';

interface FavoriteItem {
  favorite_id: string;
  item_type: string;
  item_title: string;
  item_description: string | null;
  item_image_url: string | null;
  favorited_at: string;
  item_id: string;
  event_start_time?: string | null;
  provider_abn?: string | null;
  housing_address?: string | null;
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const FILTER_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Services', value: 'service_provider' },
    { label: 'Housing', value: 'housing_listing' },
    { label: 'Events', value: 'group_event' },
  ];

  useEffect(() => {
    if (user) { // Only fetch if user is available
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) {
      setLoading(false);
      setError('User not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_favorites_detailed')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Supabase fetch error object:', JSON.stringify(fetchError, null, 2));
        throw fetchError;
      }

      if (data) {
        const validData = data.filter(item => item.item_title !== null);
        setFavorites(validData);
        if (validData.length === 0 && data.length > 0) {
          console.log('Some favorited items could not be found and were hidden.');
        }
      } else {
        setFavorites([]);
        console.warn('No favorites data returned, even without a fetch error.');
      }
    } catch (err: unknown) {
      console.error('Caught error in fetchFavorites:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching favorites.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteIdToRemove: string) => {
    if (!user) {
      console.error('Cannot remove favorite: User not logged in.');
      // Optionally show a message to the user
      return;
    }

    const originalFavorites = [...favorites];
    // Optimistic UI update
    setFavorites(prevFavorites => prevFavorites.filter(fav => fav.favorite_id !== favoriteIdToRemove));

    try {
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .match({ favorite_id: favoriteIdToRemove, user_id: user.id });

      if (deleteError) {
        console.error('Error removing favorite from Supabase:', deleteError);
        // Revert optimistic update on error
        setFavorites(originalFavorites);
        setError('Failed to remove favorite. Please try again.');
      } else {
        console.log(`Favorite ${favoriteIdToRemove} removed successfully.`);
        // Optional: Show a success message or just rely on UI update
      }
    } catch (err) {
      console.error('Exception removing favorite:', err);
      // Revert optimistic update on exception
      setFavorites(originalFavorites);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to remove favorite: ${errorMessage}`);
    }
  };

  const filteredFavorites = useMemo(() => {
    if (activeFilter === 'all') {
      return favorites;
    }
    return favorites.filter(item => item.item_type === activeFilter);
  }, [favorites, activeFilter]);

  const getLinkHref = (item: FavoriteItem) => {
    switch (item.item_type) {
      case 'group_event':
        return { pathname: '/(tabs)/discover/events/[id]', params: { id: item.item_id } };
      case 'service_provider':
        return { pathname: '/(tabs)/discover/[id]', params: { id: item.item_id } };
      case 'housing_listing':
        return { pathname: '/(tabs)/housing/[id]', params: { id: item.item_id } };
      default:
        return { pathname: '/(tabs)/favorites' };
    }
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => {
    console.log('Rendering Favorite Item:', JSON.stringify(item, null, 2));

    return (
      <View style={styles.cardOuterContainer}> 
        <Link href={getLinkHref(item) as any} asChild>
          <Pressable style={styles.itemContainer}>
            <Image
              source={{ uri: item.item_image_url || 'https://via.placeholder.com/100' }} 
              style={styles.itemImage}
            />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>{item.item_title}</Text>
              {item.item_type === 'group_event' && item.event_start_time && (
                <Text style={styles.itemSubtitle}>Starts: {new Date(item.event_start_time).toLocaleString()}</Text>
              )}
              {item.item_type === 'service_provider' && item.provider_abn && (
                <Text style={styles.itemSubtitle}>ABN: {item.provider_abn}</Text>
              )}
              {item.item_type === 'housing_listing' && item.housing_address && (
                <Text style={styles.itemSubtitle}>{item.housing_address}</Text>
              )}
              <Text style={styles.itemDescription} numberOfLines={2}>{item.item_description}</Text>
            </View>
          </Pressable>
        </Link>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.favorite_id)}
        >
          <XIcon color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>You haven't favorited anything yet!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Favorites" />
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              activeFilter === option.value && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === option.value && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.favorite_id}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#007bff',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  listContentContainer: {
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  cardOuterContainer: { 
    marginBottom: 10,
    position: 'relative', 
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  removeButton: { 
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 5,
    borderRadius: 15, 
    zIndex: 1, 
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
  },
});
