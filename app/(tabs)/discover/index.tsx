import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { 
  Search, 
  Grid2x2 as Grid, 
  List, 
  Heart, 
  FileSliders as Sliders,
  MapPin,
  Star,
  House,
  Car,
  Laptop,
  X,
  FilePlus as Helping,
  Filter
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { SwipeView } from './components/SwipeView';
import { ListingItem, ViewMode, Service, HousingListing } from './types';

// Define categories with proper icon rendering
const CATEGORIES = [
  { id: 'Therapy', name: 'Therapy', icon: (props: any) => <Heart {...props} /> },
  { id: 'Housing', name: 'Housing', icon: (props: any) => <House {...props} /> },
  { id: 'Support', name: 'Support', icon: (props: any) => <Helping {...props} /> },
  { id: 'Transport', name: 'Transport', icon: (props: any) => <Car {...props} /> },
  { id: 'Tech', name: 'Tech', icon: (props: any) => <Laptop {...props} /> },
];

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { returnIndex, returnViewMode, category } = useLocalSearchParams<{ 
    returnIndex: string;
    returnViewMode: string;
    category: string;
  }>();
  
  const localParams = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Therapy');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // For swipe view
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // For double tap detection
  const [lastTap, setLastTap] = useState<number>(0);
  const [lastTapItem, setLastTapItem] = useState<string | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  async function loadListings() {
    try {
      setLoading(true);
      
      // Determine which table to query based on selected category
      const isHousingCategory = selectedCategory === 'Housing';
      
      if (isHousingCategory) {
        // Load housing listings with joined provider data
        const { data, error } = await supabase
          .from('housing_listings')
          .select(`
            id,
            title,
            description,
            weekly_rent,
            bedrooms,
            bathrooms,
            suburb,
            state,
            sda_category,
            media_urls
          `);
          
        if (error) throw error;
        
        // Add empty provider object to housing listings to maintain consistent structure
        const transformedData = data?.map(item => ({
          ...item,
          provider: { business_name: 'Housing Provider', verified: false }
        })) as HousingListing[];
        
        setListings(transformedData || []);
      } else {
        // Load services with specific category
        const { data, error } = await supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            category,
            format,
            price,
            provider:service_providers (
              business_name,
              verified
            )
          `)
          .eq('category', selectedCategory);
          
        if (error) throw error;
        
        // Fix provider property structure if needed
        const transformedData = data?.map(item => {
          // Ensure provider exists and has proper structure
          if (!item.provider || (Array.isArray(item.provider) && item.provider.length === 0)) {
            return {
              ...item,
              provider: { business_name: 'Service Provider', verified: false }
            };
          } else if (Array.isArray(item.provider) && item.provider.length > 0) {
            return {
              ...item,
              provider: item.provider[0]
            };
          }
          return item;
        }) as Service[];
        
        setListings(transformedData || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadListings();
    
    // Check if returning from detail view with a specific index
    if (localParams?.returnIndex) {
      const returnIndex = parseInt(localParams.returnIndex as string, 10);
      if (!isNaN(returnIndex) && returnIndex >= 0 && returnIndex < listings.length) {
        setCurrentIndex(returnIndex);
      }
    }
  }, [selectedCategory, searchQuery, localParams?.returnIndex]);

  useEffect(() => {
    if (returnViewMode) {
      setViewMode(returnViewMode as ViewMode);
    }
    
    if (returnIndex) {
      setCurrentIndex(parseInt(returnIndex));
    }
    
    // Set category from params if available
    if (category) {
      setSelectedCategory(category);
    }
    
    loadListings();
  }, [returnViewMode, returnIndex, category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  // Determine if item is a housing listing
  const isHousingListing = (item: ListingItem): item is HousingListing => {
    return 'weekly_rent' in item;
  };

  // Helper to get item price (different property names in services vs housing)
  const getItemPrice = (item: ListingItem) => {
    if (isHousingListing(item)) {
      return item.weekly_rent;
    } else {
      return item.price;
    }
  };

  // Helper to get item image
  const getItemImage = (item: ListingItem) => {
    if (isHousingListing(item)) {
      return item.media_urls && item.media_urls.length > 0 
        ? item.media_urls[0] 
        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop';
    } else {
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop';
    }
  };

  // Helper to navigate to details screen
  const navigateToDetails = (item: ListingItem) => {
    if (isHousingListing(item)) {
      // Housing listing - navigate to housing detail with source parameter
      router.push({
        pathname: "/(tabs)/housing/[id]",
        params: {
          id: item.id,
          returnIndex: currentIndex.toString(),
          returnViewMode: viewMode,
          source: 'discover' // Indicate the source is the discover screen
        }
      });
    } else {
      // Service - navigate to service detail
      router.push({
        pathname: "/(tabs)/discover/[id]",
        params: {
          id: item.id,
          returnIndex: currentIndex.toString(),
          returnViewMode: viewMode,
          source: 'discover' // Indicate the source is the discover screen
        }
      });
    }
  };

  // Helper function to safely render provider information
  const renderServiceProvider = (item: ListingItem) => {
    // Ensure provider exists
    if (!item.provider) {
      return <Text style={styles.serviceProvider}>Service Provider</Text>;
    }
    
    return (
      <Text style={styles.serviceProvider}>
        {item.provider.business_name || 'Service Provider'}
        {item.provider.verified && (
          <Text style={styles.verifiedBadge}> ✓</Text>
        )}
      </Text>
    );
  };

  // Handle tap on swipe card
  const handleCardTap = (item: ListingItem) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTapItem === item.id && now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      navigateToDetails(item);
      
      // Reset after navigation
      setLastTap(0);
      setLastTapItem(null);
    } else {
      // First tap
      setLastTap(now);
      setLastTapItem(item.id);
    }
  };

  const renderGridView = () => {
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

    return (
      <FlatList
        key="grid" // Add key prop to force re-render when switching view modes
        data={listings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridColumnWrapper}
        contentContainerStyle={styles.servicesGrid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => navigateToDetails(item)}
          >
            <Image
              source={{ uri: getItemImage(item) }}
              style={styles.serviceImage}
            />
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              
              {isHousingListing(item) ? (
                // Housing listing
                <>
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#666" />
                    <Text style={styles.locationText}>
                      {item.suburb}, {item.state}
                    </Text>
                  </View>
                  
                  <View style={styles.housingFeatures}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {item.bedrooms} Beds
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {item.bathrooms} Baths
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                // Service
                renderServiceProvider(item)
              )}
              
              {!isHousingListing(item) && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              
              <View style={styles.serviceFooter}>
                {!isHousingListing(item) && (
                  <View style={styles.serviceRating}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                )}
                <Text style={styles.servicePrice}>
                  ${getItemPrice(item)}
                  {isHousingListing(item) ? '/week' : ''}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderListView = () => {
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

    return (
      <FlatList
        key="list" // Add key prop to force re-render when switching view modes
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.serviceListItem}
            onPress={() => navigateToDetails(item)}
          >
            <Image
              source={{ uri: getItemImage(item) }}
              style={styles.serviceListImage}
            />
            <View style={styles.serviceListContent}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              
              {isHousingListing(item) ? (
                // Housing listing
                <>
                  <View style={styles.locationContainer}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.locationText}>
                      {item.suburb}, {item.state}
                    </Text>
                  </View>
                  
                  <View style={styles.housingFeatures}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {item.bedrooms} Beds
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {item.bathrooms} Baths
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                // Service
                renderServiceProvider(item)
              )}
              
              <View style={styles.serviceListMeta}>
                {!isHousingListing(item) && (
                  <View style={styles.serviceRating}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                )}
                <Text style={styles.servicePrice}>
                  ${getItemPrice(item)}
                  {isHousingListing(item) ? '/week' : ''}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderContentView = () => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading listings...</Text>;
    }

    switch (viewMode) {
      case 'list':
        return renderListView();
      case 'swipe':
        return (
          <SwipeView
            listings={listings}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onCardTap={handleCardTap}
            getItemImage={getItemImage}
            getItemPrice={getItemPrice}
            isHousingListing={isHousingListing}
            renderServiceProvider={renderServiceProvider}
          />
        );
      case 'grid':
      default:
        return renderGridView();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Discover Services" 
        showBackButton={true}
        onBackPress={viewMode === 'swipe' ? () => {
          // When in swipe view, clicking back should return to grid/list view with the current category preserved
          router.push({
            pathname: "/(tabs)/discover",
            params: { 
              returnIndex: currentIndex.toString(),
              returnViewMode: returnViewMode || 'grid',
              category: selectedCategory
            }
          });
        } : undefined} 
      />
      
      {/* View Mode Toggle Buttons */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'grid' && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode('grid')}
        >
          <Grid size={20} color={viewMode === 'grid' ? '#007AFF' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'list' && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <List size={20} color={viewMode === 'list' ? '#007AFF' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'swipe' && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode('swipe')}
        >
          <Heart size={20} color={viewMode === 'swipe' ? '#007AFF' : '#666'} />
        </TouchableOpacity>
      </View>

      {viewMode !== 'swipe' && (
        <View style={styles.header}>
          {/* Category Buttons */}
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  loadListings();
                }}
              >
                {category.icon({ size: 24, color: '#666' })}
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={selectedCategory === 'Housing' ? "Search housing..." : "Search services..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {renderContentView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#007AFF',
    fontWeight: '600',
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
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  viewToggleButton: {
    padding: 8,
    marginLeft: 16,
  },
  viewToggleButtonActive: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  viewToggleText: {
    display: 'none',
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
  servicesGrid: {
    padding: 16,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceCard: {
    width: (width - 40) / 2, // Dynamically calculate width for 2 columns with padding
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceContent: {
    padding: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  verifiedBadge: {
    color: '#007AFF',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Housing specific styles
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
  // List view styles
  servicesList: {
    padding: 24,
  },
  serviceListItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
  },
  serviceListImage: {
    width: 100,
    height: 100,
  },
  serviceListContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  serviceListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Missing styles from the original file that were referenced
  emptySwipeState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    flex: 1,
  },
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});