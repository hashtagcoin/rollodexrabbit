import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
} from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Search, Filter, MapPin, Bed, Bath, Car, Armchair as Wheelchair, 
  DoorOpen, Dog, Grid2x2 as Grid, List, Heart, FileSliders as Sliders } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

const { width } = Dimensions.get('window');

const SDA_CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'improved_livability', label: 'Improved Livability' },
  { value: 'fully_accessible', label: 'Fully Accessible' },
  { value: 'robust', label: 'Robust' },
  { value: 'high_physical_support', label: 'High Physical Support' },
];

// Define view types
type ViewMode = 'grid' | 'list' | 'swipe';

export default function HousingScreen() {
  const { returnIndex, returnViewMode } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardTranslateY = useRef(new Animated.Value(20)).current;
  
  // For double tap detection
  const [lastTap, setLastTap] = useState<number>(0);
  const [lastTapItem, setLastTapItem] = useState<string | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds
  
  // Process returnIndex and returnViewMode if present
  useEffect(() => {
    if (returnViewMode) {
      setViewMode(returnViewMode as ViewMode);
    }
    
    if (returnIndex) {
      const index = parseInt(returnIndex as string, 10);
      if (!isNaN(index) && index >= 0 && index < listings.length) {
        // Could scroll to position if needed
        // For FlatList views this might require a ref and scrollToIndex
      }
    }
  }, [returnIndex, returnViewMode, listings]);

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

      if (selectedCategory) {
        query = query.eq('sda_category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
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

  // For swipe animations
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          swipeRight();
        } else if (gesture.dx < -120) {
          swipeLeft();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeLeft = () => {
    // First animate next card to prepare for transition
    Animated.parallel([
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Then animate current card off screen
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
      
      // Reset animations for next card
      nextCardScale.setValue(0.95);
      nextCardTranslateY.setValue(20);
    });
  };

  const swipeRight = () => {
    // First animate next card to prepare for transition
    Animated.parallel([
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Then animate current card off screen
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
      
      // Reset animations for next card
      nextCardScale.setValue(0.95);
      nextCardTranslateY.setValue(20);
    });
  };

  // Handle tap on swipe card
  const handleCardTap = (item: any) => {
    const now = Date.now();
    
    if (lastTapItem === item.id && now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected, navigate to details
      router.push({
        pathname: "/(tabs)/housing/[id]",
        params: { 
          id: item.id,
          returnIndex: currentIndex.toString(),
          returnViewMode: viewMode
        }
      });
      
      // Reset after navigation
      setLastTap(0);
      setLastTapItem(null);
    } else {
      // First tap
      setLastTap(now);
      setLastTapItem(item.id);
    }
  };

  // Render grid view (default)
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
        key="housing-grid" // Add key prop to force re-render when switching views
        data={listings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push({
              pathname: "/(tabs)/housing/[id]",
              params: { 
                id: item.id,
                returnIndex: listings.indexOf(item).toString(),
                returnViewMode: viewMode
              }
            })}
          >
            <Image
              source={
                item.media_urls && item.media_urls.length > 0
                  ? { uri: item.media_urls[0] }
                  : { uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }
              }
              style={styles.gridImage}
            />
            <View style={styles.gridContent}>
              <Text style={styles.gridPrice}>${item.weekly_rent}/week</Text>
              <Text style={styles.gridTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#666" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.suburb}, {item.state}
                </Text>
              </View>
              <View style={styles.featuresRow}>
                <Text style={styles.featureText}>
                  {item.bedrooms} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                </Text>
                <Text style={styles.featureText}>
                  {item.bathrooms} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  // Render list view
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
        key="housing-list" // Add key prop to force re-render when switching views
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listingCard}
            onPress={() => router.push({
              pathname: "/(tabs)/housing/[id]",
              params: { 
                id: item.id,
                returnIndex: listings.indexOf(item).toString(),
                returnViewMode: viewMode
              }
            })}
          >
            <Image
              source={
                item.media_urls && item.media_urls.length > 0
                  ? { uri: item.media_urls[0] }
                  : { uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }
              }
              style={styles.listingImage}
            />
            <View style={styles.listingContent}>
              <Text style={styles.price}>${item.weekly_rent}/week</Text>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#666" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.suburb}, {item.state}
                </Text>
              </View>
              
              <View style={styles.features}>
                <View style={styles.feature}>
                  <Bed size={16} color="#666" />
                  <Text style={styles.featureText}>
                    {item.bedrooms} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </Text>
                </View>

                <View style={styles.feature}>
                  <Bath size={16} color="#666" />
                  <Text style={styles.featureText}>
                    {item.bathrooms} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </Text>
                </View>

                {item.parking_spaces > 0 && (
                  <View style={styles.feature}>
                    <Car size={16} color="#666" />
                    <Text style={styles.featureText}>
                      {item.parking_spaces} {item.parking_spaces === 1 ? 'Park' : 'Parks'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.tags}>
                {item.accessibility_features?.slice(0, 2).map((feature: string) => (
                  <View key={feature} style={styles.tag}>
                    <DoorOpen size={14} color="#007AFF" />
                    <Text style={styles.tagText}>{feature}</Text>
                  </View>
                ))}
                {item.pets_allowed && (
                  <View style={styles.tag}>
                    <Dog size={14} color="#007AFF" />
                    <Text style={styles.tagText}>Pet Friendly</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  // Simple swipe view placeholder - would need to be expanded for full functionality
  const renderSwipeView = () => {
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleCardTap(item)}
            style={styles.cardTouchable}
          >
            <Image
              source={
                item.media_urls && item.media_urls.length > 0
                  ? { uri: item.media_urls[0] }
                  : { uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }
              }
              style={styles.swipeImage}
            />
            <View style={styles.swipeContent}>
              <Text style={styles.swipeTitle}>{item.title}</Text>
              
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText}>
                  {item.suburb}, {item.state}
                </Text>
              </View>
              
              <View style={styles.housingFeatures}>
                <View style={styles.featureItem}>
                  <Bed size={16} color="#666" />
                  <Text style={styles.featureText}>
                    {item.bedrooms} {item.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Bath size={16} color="#666" />
                  <Text style={styles.featureText}>
                    {item.bathrooms} {item.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </Text>
                </View>
                {item.parking_spaces > 0 && (
                  <View style={styles.featureItem}>
                    <Car size={16} color="#666" />
                    <Text style={styles.featureText}>
                      {item.parking_spaces} {item.parking_spaces === 1 ? 'Park' : 'Parks'}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.swipeDescription} numberOfLines={3}>
                {item.description}
              </Text>
              
              <View style={styles.swipeMeta}>
                <Text style={styles.swipePrice}>
                  ${item.weekly_rent}/week
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Next card - shown underneath with transform */}
        {listings.length > 1 && (
          <Animated.View
            style={[
              styles.swipeCardNext,
              {
                transform: [
                  { scale: nextCardScale },
                  { translateY: nextCardTranslateY },
                ],
              },
            ]}
          >
            <Image
              source={
                nextItem.media_urls && nextItem.media_urls.length > 0
                  ? { uri: nextItem.media_urls[0] }
                  : { uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }
              }
              style={styles.swipeImage}
            />
            <View style={styles.swipeContent}>
              <Text style={styles.swipeTitle}>{nextItem.title}</Text>
              
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText}>
                  {nextItem.suburb}, {nextItem.state}
                </Text>
              </View>
            </View>
          </Animated.View>
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

  // Render content view wrapper
  const renderContentView = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading listings...</Text>
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
      <AppHeader
        title="Housing"
        showBackButton={viewMode === 'swipe'}
        onBackPress={viewMode === 'swipe' ? () => {
          // When in swipe view, clicking back should navigate to discover services
          // filtered for housing category, preserving the current view mode
          router.push({
            pathname: "/(tabs)/discover",
            params: { 
              category: "Housing",
              returnViewMode: viewMode
            }
          });
        } : undefined}
      />
      
      {/* Search and Filter Section */}
      {viewMode !== 'swipe' && (
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, features..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Search size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Simplified filter chips using the existing styles */}
          <View style={styles.categoriesContainer}>
            {SDA_CATEGORIES.slice(0, 3).map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.categoryButton,
                  selectedCategory === filter.value && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(filter.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === filter.value && styles.categoryTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
      </View>
      
      {/* Main Content - Direct rendering without ScrollView to prevent VirtualizedList nesting */}
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
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  filterButton: {
    padding: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '500',
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
  contentContainer: {
    flex: 1,
  },
  // Grid View Styles
  gridContainer: {
    padding: 12,
  },
  gridCard: {
    width: (width - 36) / 2, // Two columns with spacing
    marginHorizontal: 6,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridContent: {
    padding: 12,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  // List View Styles
  listContainer: {
    padding: 16,
  },
  listingCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  listingImage: {
    width: 120,
    height: '100%',
  },
  listingContent: {
    flex: 1,
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  // Swipe View Styles
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  swipeCard: {
    width: width - 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 2,
  },
  swipeCardNext: {
    width: width - 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: 'absolute',
    zIndex: 1,
  },
  cardTouchable: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  swipeImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  swipeContent: {
    padding: 16,
  },
  swipeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  swipeDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  swipeProvider: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 12,
  },
  verifiedBadge: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  housingFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  swipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  swipePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  swipeProgress: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  swipeCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeInstructions: {
    position: 'absolute',
    top: 20,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    zIndex: 10,
  },
  // Common Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  categoriesSection: {
    paddingVertical: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
});