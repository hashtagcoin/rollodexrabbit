import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Search, Filter, MapPin, Bed, Bath, Car, Armchair as Wheelchair, DoorOpen, Dog } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

const SDA_CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'improved_livability', label: 'Improved Livability' },
  { value: 'fully_accessible', label: 'Fully Accessible' },
  { value: 'robust', label: 'Robust' },
  { value: 'high_physical_support', label: 'High Physical Support' },
];

export default function HousingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  async function loadListings() {
    try {
      setLoading(true);
      let query = supabase
        .from('housing_listings')
        .select(`
          id,
          title,
          description,
          weekly_rent,
          bedrooms,
          bathrooms,
          parking_spaces,
          sda_category,
          suburb,
          state,
          media_urls,
          pets_allowed,
          accessibility_features
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('sda_category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,suburb.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, [selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Housing Listings" showBackButton={false} />
      
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or features..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipSelected,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {SDA_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryChip,
              selectedCategory === category.value && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.value && styles.categoryTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading listings...</Text>
        ) : listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Listings Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search criteria
            </Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {listings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={styles.listingCard}
                onPress={() => router.push(`/housing/${listing.id}`)}
              >
                <Image
                  source={{ uri: listing.media_urls[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }}
                  style={styles.listingImage}
                />

                <View style={styles.listingContent}>
                  <View style={styles.listingHeader}>
                    <Text style={styles.listingPrice}>
                      ${listing.weekly_rent}/week
                    </Text>
                    <View style={styles.sdaBadge}>
                      <Wheelchair size={16} color="#fff" />
                      <Text style={styles.sdaBadgeText}>
                        {SDA_CATEGORIES.find(c => c.value === listing.sda_category)?.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.listingTitle}>{listing.title}</Text>

                  <View style={styles.location}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.locationText}>
                      {listing.suburb}, {listing.state}
                    </Text>
                  </View>

                  <View style={styles.features}>
                    <View style={styles.feature}>
                      <Bed size={16} color="#666" />
                      <Text style={styles.featureText}>
                        {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
                      </Text>
                    </View>

                    <View style={styles.feature}>
                      <Bath size={16} color="#666" />
                      <Text style={styles.featureText}>
                        {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </Text>
                    </View>

                    {listing.parking_spaces > 0 && (
                      <View style={styles.feature}>
                        <Car size={16} color="#666" />
                        <Text style={styles.featureText}>
                          {listing.parking_spaces} {listing.parking_spaces === 1 ? 'Park' : 'Parks'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.tags}>
                    {listing.accessibility_features?.slice(0, 2).map((feature: string) => (
                      <View key={feature} style={styles.tag}>
                        <DoorOpen size={14} color="#007AFF" />
                        <Text style={styles.tagText}>{feature}</Text>
                      </View>
                    ))}
                    {listing.pets_allowed && (
                      <View style={styles.tag}>
                        <Dog size={14} color="#007AFF" />
                        <Text style={styles.tagText}>Pet Friendly</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    marginLeft: 12,
  },
  categoriesScroll: {
    maxHeight: 48,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
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
  listingsGrid: {
    padding: 24,
    gap: 16,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  listingImage: {
    width: '100%',
    height: 200,
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  sdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  sdaBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  features: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e1f0ff',
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
  },
});