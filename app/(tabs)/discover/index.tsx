import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  provider: {
    business_name: string;
    verified: boolean;
  };
};

type ListingItem = Service | HousingListing;

// Define view types
type ViewMode = 'grid' | 'list' | 'swipe';

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
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.9)).current;
  const nextCardTranslateY = useRef(new Animated.Value(15)).current;
  const rotateCard = useRef(new Animated.Value(0)).current;
  const swipeAnimationDuration = 300; // milliseconds
  const resetDuration = 250; // milliseconds
  
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

  // Swipe functionality
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 }); // Limit vertical movement
      
      // Update rotation based on horizontal movement
      const rotationAmount = gesture.dx / 15; // Adjust divisor to control rotation intensity
      rotateCard.setValue(rotationAmount);
      
      // Gradually reveal the next card as the current one moves
      const swipeProgress = Math.min(Math.abs(gesture.dx) / 150, 1);
      nextCardOpacity.setValue(0.9 + (swipeProgress * 0.1));
      nextCardScale.setValue(0.92 + (swipeProgress * 0.08));
      nextCardTranslateY.setValue(15 - (swipeProgress * 15));
    },
    onPanResponderRelease: (_, gesture) => {
      // Threshold for considering a swipe complete
      const swipeThreshold = width * 0.3;
      
      if (gesture.dx > swipeThreshold) {
        // Swipe right (like)
        finishSwipeAnimation('right');
      } else if (gesture.dx < -swipeThreshold) {
        // Swipe left (dislike)
        finishSwipeAnimation('left');
      } else {
        // Return to center with spring animation
        resetCardPosition();
      }
    },
  });
  
  const resetCardPosition = () => {
    // Parallel animations to reset card position with spring effect
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 5,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(rotateCard, {
        toValue: 0,
        friction: 5,
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
  
  // Common function for finishing swipe animations
  const finishSwipeAnimation = (direction: 'left' | 'right') => {
    const xPosition = direction === 'left' ? -width * 1.5 : width * 1.5;
    
    // Prepare next card animation
    Animated.parallel([
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
    ]).start();
    
    // Animate current card off screen
    Animated.timing(position, {
      toValue: { x: xPosition, y: 0 },
      duration: swipeAnimationDuration,
      useNativeDriver: false,
    }).start(() => {
      // After animation completes
      rotateCard.setValue(0);
      position.setValue({ x: 0, y: 0 });
      
      // Update to next card
      if (currentIndex < listings.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // Loop back to the beginning
      }
      
      // Reset animations for next card
      nextCardScale.setValue(0.92);
      nextCardOpacity.setValue(0.9);
      nextCardTranslateY.setValue(15);
    });
    
    // Execute like/dislike business logic
    if (direction === 'right') {
      // Like functionality
      const likedItem = listings[currentIndex];
      // Call your existing like function here if needed
    }
  };
  
  const swipeLeft = () => finishSwipeAnimation('left');
  const swipeRight = () => finishSwipeAnimation('right');

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

    return (
      <View style={styles.swipeContainer}>
        {/* Next Card (Underneath) */}
        {listings.length > 1 && (
          <Animated.View 
            style={[
              styles.nextCard,
              {
                transform: [
                  { scale: nextCardScale },
                  { translateY: nextCardTranslateY }
                ],
                opacity: nextCardOpacity,
                zIndex: 1
              }
            ]}
          >
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
                renderServiceProvider(nextItem)
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
          </Animated.View>
        )}
        
        {/* Current Card (Top) */}
        <Animated.View
          style={[
            styles.swipeCard,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotateCard.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ['-5deg', '0deg', '5deg']
                }) }
              ],
              zIndex: 2
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
          </TouchableOpacity>

          {/* Like/Dislike indicators */}
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

          <View style={styles.swipeActions}>
            <TouchableOpacity 
              style={styles.swipeActionLeft}
              onPress={swipeLeft}
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
        
        {/* Counter and progress indicator */}
        <View style={styles.swipeProgress}>
          <Text style={styles.swipeCounter}>
            {currentIndex + 1} of {listings.length}
          </Text>
        </View>
      </View>
    );
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
      
      {/* Remove ScrollView wrapper around content to prevent VirtualizedList nesting */}
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
  // Swipe view styles
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 100,
    position: 'relative',
  },
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
    zIndex: 2,
  },
  swipeImage: {
    width: '100%',
    height: 280,
  },
  nextCard: {
    position: 'absolute',
    top: 20,
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
    zIndex: 1,
    transform: [{scale: 0.92}],
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
  swipeProvider: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  swipeCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTouchable: {
    flex: 1, 
    width: '100%',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIndicator: {
    opacity: 0,
    transform: [{translateX: -100}],
  },
  dislikeIndicator: {
    opacity: 0,
    transform: [{translateX: 100}],
  },
});