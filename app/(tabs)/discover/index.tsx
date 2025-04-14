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
  ScrollView,
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
  Filter,
  Users,
  ArrowDownUp,
  MessageCircleHeart,
  PersonStanding
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import SwipeListView from './components/SwipeListView';
import { ListingItem, ViewMode, Service, HousingListing, isViewMode } from './types';
import { ShadowCard } from './components/ShadowCard';

// Define categories with proper icon rendering
const CATEGORIES = [
  { id: 'Therapy', name: 'Therapy', icon: (props: any) => <Heart {...props} /> },
  { id: 'Housing', name: 'Housing', icon: (props: any) => <House {...props} /> },
  { id: 'Support', name: 'Support', icon: (props: any) => <Helping {...props} /> },
  { id: 'Transport', name: 'Transport', icon: (props: any) => <Car {...props} /> },
  { id: 'Tech', name: 'Tech', icon: (props: any) => <Laptop {...props} /> },
  { id: 'Personal', name: 'Personal', icon: (props: any) => <MessageCircleHeart {...props} /> },
  { id: 'Social', name: 'Social', icon: (props: any) => <PersonStanding {...props} /> },
];

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { returnIndex, returnViewMode, category } = useLocalSearchParams<{ 
    returnIndex: string;
    returnViewMode: ViewMode;
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

  // For storing housing group information
  const [housingGroupsMap, setHousingGroupsMap] = useState<Record<string, boolean>>({});

  // Function to fetch housing groups for all housing listings
  async function fetchHousingGroups(listingIds: string[]) {
    if (!listingIds || listingIds.length === 0) return;
    
    try {
      console.log('Fetching housing groups for listings, count:', listingIds.length);
      
      // Create a map of listing_id to boolean (has group)
      const groupMap: Record<string, boolean> = {};
      
      // Initialize all listings to false (no group)
      listingIds.forEach(id => {
        groupMap[id] = false;
      });

      // Process in smaller batches to avoid query limits
      const BATCH_SIZE = 30;
      for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
        const batchIds = listingIds.slice(i, i + BATCH_SIZE);
        
        try {
          const { data, error } = await supabase
            .from('housing_groups')
            .select('id, listing_id')
            .in('listing_id', batchIds);
          
          if (error) {
            console.error('Error fetching housing groups batch:', error);
            continue; // Skip this batch but continue with others
          }
          
          // Mark listings with groups as true
          if (data && Array.isArray(data)) {
            data.forEach(group => {
              if (group && group.listing_id) {
                groupMap[group.listing_id] = true;
              }
            });
          }
        } catch (batchError) {
          console.error('Batch processing error:', batchError);
          // Continue with next batch
        }
      }
      
      console.log('Housing groups map created, groups found:', 
        Object.values(groupMap).filter(value => value === true).length);
      setHousingGroupsMap(groupMap);
      
    } catch (error) {
      console.error('Error in fetchHousingGroups:', error);
      // Don't rethrow, just log and continue with empty map
      setHousingGroupsMap({});
    }
  }

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
          provider: { business_name: 'Housing Provider', verified: false },
          has_housing_group: false // Initialize this property
        })) as HousingListing[];
        
        setListings(transformedData || []);
        
        // Fetch housing groups for all listings
        if (transformedData && transformedData.length > 0) {
          const listingIds = transformedData.map(item => item.id);
          await fetchHousingGroups(listingIds);
        }
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

  // Effect 1: Load listings when category or search changes, reset index
  useEffect(() => {
    console.log('Effect: Loading listings due to category/search change');
    setCurrentIndex(0); // Reset index when category/search changes
    loadListings();
  }, [selectedCategory, searchQuery]); // Runs on mount and when these change

  // Effect 2: Handle initialization from URL category param (run once or if param provided later)
  useEffect(() => {
    const { category: paramCategoryValue } = localParams; // Destructure for stable dependency
    const paramCategory = Array.isArray(paramCategoryValue) ? paramCategoryValue[0] : paramCategoryValue; // Handle string[]

    if (paramCategory && paramCategory !== selectedCategory) {
      console.log(`Effect: Setting category from URL param: ${paramCategory}`);
      setSelectedCategory(paramCategory); // paramCategory is now string | undefined
      // No need to call loadListings here, Effect 1 will handle it when selectedCategory changes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localParams?.category]); // Depend only on the relevant param. Disable lint warning as selectedCategory dependency would cause loop.

  // Effect 3: Handle navigation return state (run only when return params change)
  useEffect(() => {
    const { returnIndex: paramReturnIndexValue, returnViewMode: paramReturnViewModeValue } = localParams; // Destructure
    const paramReturnIndex = Array.isArray(paramReturnIndexValue) ? paramReturnIndexValue[0] : paramReturnIndexValue; // Handle string[]
    const paramReturnViewMode = Array.isArray(paramReturnViewModeValue) ? paramReturnViewModeValue[0] : paramReturnViewModeValue; // Handle string[]

    // Check if we actually have return parameters to process
    if (paramReturnIndex === undefined && paramReturnViewMode === undefined) {
      return; // Nothing to do if no return params
    }
    console.log('Effect: Handling navigation return params');

    let needsUpdate = false;
    let newViewMode = viewMode;
    let newCurrentIndex = currentIndex;

    if (paramReturnViewMode && isViewMode(paramReturnViewMode) && paramReturnViewMode !== viewMode) {
      console.log(`  Setting view mode from return param: ${paramReturnViewMode}`);
      newViewMode = paramReturnViewMode;
      needsUpdate = true;
    }

    if (paramReturnIndex) {
      const parsedIndex = parseInt(paramReturnIndex, 10); // paramReturnIndex is now string | undefined
      // Validate against the CURRENT listings length
      if (!isNaN(parsedIndex) && listings.length > 0 && parsedIndex >= 0 && parsedIndex < listings.length && parsedIndex !== currentIndex) {
        console.log(`  Setting index from return param: ${parsedIndex}`);
        newCurrentIndex = parsedIndex;
        needsUpdate = true;
      } else {
        console.log(`  Ignoring invalid/unchanged returnIndex: ${paramReturnIndex}, current listings length: ${listings.length}`);
      }
    }

    // Apply updates if needed
    if (needsUpdate) {
        console.log('Applying navigation return state updates');
        setViewMode(newViewMode);
        setCurrentIndex(newCurrentIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localParams?.returnIndex, localParams?.returnViewMode]); // Depend on return params AND listings.length for validation. Lint disabled as adding viewMode/currentIndex would cause loops.

  async function onRefresh() {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  // Helper function to safely check view mode
  const isMode = (current: ViewMode, target: ViewMode): boolean => current === target;

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

  // Helper to check if a housing listing has a group
  const hasHousingGroup = (item: ListingItem) => {
    if (isHousingListing(item)) {
      return housingGroupsMap[item.id] || false;
    }
    return false;
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
      return <Text style={styles.serviceProvider} selectable={false}>Service Provider</Text>;
    }
    
    return (
      <Text style={styles.serviceProvider} selectable={false}>
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

  // Render Group Match badge for grid and list view
  const renderGroupMatchBadge = (item: ListingItem) => {
    if (isHousingListing(item) && housingGroupsMap[item.id]) {
      return (
        <View style={styles.groupMatchBadge}>
          <Users size={12} color="#fff" />
          <Text style={styles.groupMatchText}>Group Match</Text>
        </View>
      );
    }
    return null;
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
            style={styles.serviceCardTouchable}
            onPress={() => navigateToDetails(item)}
          >
            <ShadowCard 
              width={(width - 36) / 2}
              height={240}
              radius={12}
              style={styles.serviceCard}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getItemImage(item) }}
                  style={styles.serviceImage}
                />
                {renderGroupMatchBadge(item)}
              </View>
              
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {renderServiceProvider(item)}

                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>
                    ${getItemPrice(item)}
                    {isHousingListing(item) ? '/week' : ''}
                  </Text>
                </View>
              </View>
            </ShadowCard>
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
            style={styles.serviceListItemTouchable}
            onPress={() => navigateToDetails(item)}
          >
            <ShadowCard
              width={width - 16}
              height={124}
              radius={12}
              style={styles.serviceListItem}
            >
              <View style={styles.listItemInner}>
                <View style={styles.listImageContainer}>
                  <Image
                    source={{ uri: getItemImage(item) }}
                    style={styles.serviceListImage}
                  />
                  {renderGroupMatchBadge(item)}
                </View>
                
                <View style={styles.serviceListDetails}>
                  <View>
                    <Text style={styles.serviceTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {renderServiceProvider(item)}
                    {isHousingListing(item) ? (
                      <View style={styles.locationContainer}>
                        <MapPin size={12} color="#666" />
                        <Text style={styles.locationText}>
                          {item.suburb || 'Unknown'}, {item.state || 'Unknown'}
                        </Text>
                      </View>
                    ) : (
                      <Text 
                        style={styles.serviceDescription} 
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.servicePrice}>
                    ${getItemPrice(item)}
                    {isHousingListing(item) ? '/week' : ''}
                  </Text>
                </View>
              </View>
            </ShadowCard>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Discover Services" 
        showBackButton={false}
      />
      
      {/* View toggle buttons - moved directly below header when in swipe view */}
      {isMode(viewMode, 'swipe') && (
        <View style={styles.swipeViewToggleContainer}>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'grid') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Grid
                size={20}
                color={isMode(viewMode, 'grid') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'list') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={20}
                color={isMode(viewMode, 'list') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'swipe') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('swipe')}
            >
              <Heart
                size={20}
                color={isMode(viewMode, 'swipe') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              // Add filtering functionality here in the future
            }}
          >
            <ArrowDownUp size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Search bar - hidden in swipe view */}
      {!isMode(viewMode, 'swipe') && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, housing, and more..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearch}
              >
                <X size={16} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Categories - hidden in swipe view */}
      {!isMode(viewMode, 'swipe') && (
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                {cat.icon({ 
                  size: 16, 
                  color: selectedCategory === cat.id ? '#FFF' : '#333' 
                })}
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.selectedCategoryText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* View toggles for grid and list view modes - only shown in non-swipe views */}
      {!isMode(viewMode, 'swipe') && (
        <View style={styles.viewToggleContainer}>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'grid') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Grid
                size={20}
                color={isMode(viewMode, 'grid') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'list') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={20}
                color={isMode(viewMode, 'list') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                isMode(viewMode, 'swipe') && styles.selectedViewToggle,
              ]}
              onPress={() => setViewMode('swipe')}
            >
              <Heart
                size={20}
                color={isMode(viewMode, 'swipe') ? '#007AFF' : '#333'}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              // Add filtering functionality here in the future
            }}
          >
            <ArrowDownUp size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading services...</Text>
        </View>
      ) : (
        <View style={[
          styles.contentContainer,
          isMode(viewMode, 'swipe') && styles.swipeContentContainer
        ]}>
          {isMode(viewMode, 'grid') && renderGridView()}
          {isMode(viewMode, 'list') && renderListView()}
          {isMode(viewMode, 'swipe') && (
            <SwipeListView
              listings={listings}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onCardTap={handleCardTap}
              getItemImage={getItemImage}
              getItemPrice={getItemPrice}
              isHousingListing={isHousingListing}
              renderServiceProvider={renderServiceProvider}
              hasHousingGroup={hasHousingGroup}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  swipeContentContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    marginBottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 40,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearSearch: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#FFF',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  swipeViewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 2,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 16,
  },
  selectedViewToggle: {
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesGrid: {
    padding: 8,
  },
  servicesList: {
    paddingVertical: 8,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
  },
  serviceCardTouchable: {
    marginBottom: 16,
    width: (width - 36) / 2, // Adjust for 8px padding on container and 12px gap between cards
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceListItemTouchable: {
    marginHorizontal: 8,
    marginBottom: 8,
  },
  serviceListItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listItemInner: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  serviceImage: {
    width: '100%',
    height: 140,
  },
  serviceListImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  serviceDetails: {
    padding: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  verifiedBadge: {
    color: '#4CD964',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  serviceFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceListDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  groupMatchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 217, 100, 0.8)', // 80% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupMatchText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});