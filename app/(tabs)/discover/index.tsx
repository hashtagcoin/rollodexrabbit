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
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Search, MapPin, Star, Filter, Grid2x2 as Grid, List, Heart, X, FileSliders as Sliders, BrainCircuit, House, HandHelping as Helping, Car, Laptop } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  price: number;
  provider: {
    business_name: string;
    verified: boolean;
  };
};

type HousingListing = {
  id: string;
  title: string;
  description: string;
  weekly_rent: number;
  bedrooms: number;
  bathrooms: number;
  suburb: string;
  state: string;
  sda_category: string;
  media_urls: string[];
};

type ListingItem = Service | HousingListing;

// Define view types
type ViewMode = 'grid' | 'list' | 'swipe';

// Define categories (removed "All" as requested)
const CATEGORIES = [
  { id: 'Therapy', name: 'Therapy', icon: Heart },
  { id: 'Housing', name: 'Housing', icon: House },
  { id: 'Support', name: 'Support', icon: Helping },
  { id: 'Transport', name: 'Transport', icon: Car },
  { id: 'Tech', name: 'Tech', icon: Laptop },
];

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Therapy');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // For swipe view
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = new Animated.ValueXY();

  async function loadListings() {
    try {
      setLoading(true);
      
      if (selectedCategory === 'Housing') {
        // Load housing listings
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
            media_urls,
            provider:service_providers!inner (
              business_name,
              verified
            )
          `);

        if (error) throw error;
        setListings(data || []);
      } else {
        // Load services
        let query = supabase
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
          `);

        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setListings(data || []);
      }
      setCurrentIndex(0); // Reset swipe index when loading new listings
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
      router.push(`/housing/${item.id}`);
    } else {
      router.push(`/discover/${item.id}`);
    }
  };

  // Swipe functionality
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: 0 });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 120) {
        // Swipe right (like)
        swipeRight();
      } else if (gesture.dx < -120) {
        // Swipe left (dislike)
        swipeLeft();
      } else {
        // Return to center
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      if (currentIndex < listings.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // Loop back to the beginning
      }
    });
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      if (currentIndex < listings.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // Loop back to the beginning
      }
    });
  };

  const renderSwipeView = () => {
    if (listings.length === 0) {
      return (
        <View style={styles.emptySwipeState}>
          <Text style={styles.emptyStateTitle}>No Listings Found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    const item = listings[currentIndex];
    const nextItem = listings[(currentIndex + 1) % listings.length]; // Get the next item

    const rotate = position.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeContainer}>
        <Animated.View
          style={[
            styles.swipeCard,
            {
              transform: [
                { translateX: position.x },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: getItemImage(item) }}
            style={styles.swipeImage}
          />
          <View style={styles.swipeContent}>
            <Text style={styles.swipeTitle}>{item.title}</Text>
            
            {isHousingListing(item) ? (
              // Housing listing specific content
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
              // Service specific content
              <Text style={styles.swipeProvider}>
                {item.provider.business_name}
                {item.provider.verified && (
                  <Text style={styles.verifiedBadge}> ✓</Text>
                )}
              </Text>
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

          <View style={styles.swipeActions}>
            <TouchableOpacity 
              style={styles.swipeActionLeft}
              onPress={() => swipeLeft()}
            >
              <X size={40} color="#ff3b30" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.swipeActionRight}
              onPress={swipeRight}
            >
              <Heart size={40} color="#4cd964" fill="#4cd964" />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Next Card Preview */}
        {listings.length > 1 && (
          <View style={styles.nextCard}>
            <Image
              source={{ uri: getItemImage(nextItem) }}
              style={styles.swipeImage}
            />
            <View style={styles.swipeContent}>
              <Text style={styles.swipeTitle}>{nextItem.title}</Text>
              {isHousingListing(nextItem) ? (
                // Housing listing specific content
                <>
                  <View style={styles.locationContainer}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.locationText}>
                      {nextItem.suburb}, {nextItem.state}
                    </Text>
                  </View>
                  
                  <View style={styles.housingFeatures}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {nextItem.bedrooms} {nextItem.bedrooms === 1 ? 'Bed' : 'Beds'}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureText}>
                        {nextItem.bathrooms} {nextItem.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                // Service specific content
                <Text style={styles.swipeProvider}>
                  {nextItem.provider.business_name}
                  {nextItem.provider.verified && (
                    <Text style={styles.verifiedBadge}> ✓</Text>
                  )}
                </Text>
              )}
              
              <Text style={styles.swipeDescription} numberOfLines={3}>
                {nextItem.description}
              </Text>
              
              <View style={styles.swipeMeta}>
                <View style={styles.serviceRating}>
                  <Star size={16} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
                <Text style={styles.swipePrice}>
                  ${getItemPrice(nextItem)}
                  {isHousingListing(nextItem) ? '/week' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Counter and progress indicator */}
        <View style={styles.swipeProgress}>
          <Text style={styles.swipeCounter}>
            {currentIndex + 1} of {listings.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderGridView = () => (
    <View style={styles.servicesGrid}>
      {listings.map((item) => (
        <TouchableOpacity
          key={item.id}
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
              <Text style={styles.serviceProvider}>
                {item.provider.business_name}
                {item.provider.verified && (
                  <Text style={styles.verifiedBadge}> ✓</Text>
                )}
              </Text>
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
      ))}
    </View>
  );

  const renderListView = () => (
    <View style={styles.servicesList}>
      {listings.map((item) => (
        <TouchableOpacity
          key={item.id}
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
              <Text style={styles.serviceProvider}>
                {item.provider.business_name}
                {item.provider.verified && (
                  <Text style={styles.verifiedBadge}> ✓</Text>
                )}
              </Text>
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
      ))}
    </View>
  );

  const renderContentView = () => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading listings...</Text>;
    }
    
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

    switch (viewMode) {
      case 'list':
        return renderListView();
      case 'swipe':
        return renderSwipeView();
      case 'grid':
      default:
        return renderGridView();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Discover Services" showBackButton={false} />
      
      {viewMode !== 'swipe' && (
        <>
          <View style={styles.header}>
            {/* Category Buttons - Modified to show icon above text */}
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={styles.categoryIconContainer}>
                    {category.icon && (
                      <category.icon 
                        size={24} 
                        color={selectedCategory === category.id ? '#007AFF' : '#666'} 
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
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
        </>
      )}
      
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

        <TouchableOpacity
          style={styles.viewToggleButton}
          onPress={() => {}}
        >
          <Sliders size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {viewMode === 'swipe' ? (
        renderContentView()
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderContentView()}
        </ScrollView>
      )}
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
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  viewToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#e1f0ff',
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
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%', // Almost half the width for a 2x2 grid
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
  // Swipe view styles
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 80,
  },
  swipeCard: {
    width: width - 48,
    height: 500,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  swipeImage: {
    width: '100%',
    height: 300,
  },
  nextCard: {
    position: 'absolute',
    top: 40,
    width: width - 80,
    height: 480,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    zIndex: -1,
  },
  swipeContent: {
    padding: 16,
  },
  swipeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  swipeProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  swipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  swipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swipePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  swipeActionLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  swipeActionRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptySwipeState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 24,
  },
  swipeProgress: {
    marginTop: 16,
  },
  swipeCounter: {
    fontSize: 14,
    color: '#666',
  },
});