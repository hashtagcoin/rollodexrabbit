 import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { 
  Search, 
  Grid2x2 as Grid, 
  List, 
  Heart, 
  House,
  Car,
  Laptop,
  FileSliders as Sliders,
  MapPin,
  Star,
  X,
  FilePlus as Helping,
  Filter,
  Users,
  ArrowDownUp,
  MessageCircleHeart,
  PersonStanding,
  BadgeCheck,
  Clock
 } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import SwipeListView from './components/SwipeListView';
import { ListingItem, ViewMode, Service, HousingListing, isViewMode } from './types';
import { ShadowCard } from './components/ShadowCard';
import GroupMatchIcon from '../housing/components/GroupMatchIcon';
import HousingCard from './components/HousingCard';
// Import Bottom Sheet components
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { useAuth } from '../../../providers/AuthProvider'; // Add AuthProvider import

// --- Configuration ---
// TODO: Replace with your actual Supabase project reference
const SUPABASE_PROJECT_REF = 'smtckdlpdfvdycocwoip'; 
const SUPABASE_STORAGE_BASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/providerimages`;
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

// Image counts per category provided by user
const categoryImageCounts: { [key: string]: number } = {
  Therapy: 16,
  Personal: 4,
  Social: 4,
  Support: 19,
  Tech: 6,
  Transport: 4,
};

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
  
  const { session } = useAuth(); // Get session from Auth context
  const userId = session?.user?.id; // Extract user ID

  const localParams = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Therapy');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Store favorited listing IDs
  
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
          `)
          .order(sortOption.field, { ascending: sortOption.direction === 'asc' }); // Add sorting
          
        if (error) throw error;
        
        // Add empty provider object to housing listings to maintain consistent structure
        const transformedData = data?.map(item => ({
          ...item,
          provider: { 
            id: null, // Add null ID here
            business_name: 'Housing Provider', 
            verified: false 
          },
          has_housing_group: false // Initialize this property
        })) as HousingListing[];
        
        setListings(transformedData || []);
        
        // Fetch housing groups for all listings
        if (transformedData && transformedData.length > 0) {
          const listingIds = transformedData.map(item => item.id);
          await fetchHousingGroups(listingIds);
        }
      } else {
        // Load services with specific category, including media_urls
        const { data, error } = await supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            category,
            format,
            price,
            media_urls,
            service_providers (
              id,
              business_name,
              verified
            )
          `)
          .eq('category', selectedCategory)
          .order(sortOption.field, { ascending: sortOption.direction === 'asc' }); // Add sorting
          
        if (error) throw error;
        
        // Fix provider property structure and ensure provider ID is captured
        const transformedData = data?.map(item => {
          let providerObj: { id: string; business_name: string; verified: boolean } | null = null;

          // Handle potential array or object from Supabase join
          if (item.service_providers) {
            if (Array.isArray(item.service_providers) && item.service_providers.length > 0) {
              // If it's an array, take the first element
              providerObj = item.service_providers[0]; 
            } else if (!Array.isArray(item.service_providers)) {
              // If it's already an object, use it directly (cast might be needed if TS still unsure)
              providerObj = item.service_providers as any; // Use 'as any' for now to bypass TS if needed, refine later
            }
          }

          // Use the extracted providerObj, checking if it and its id exist
          const finalProviderData = providerObj && providerObj.id
            ? providerObj
            : { id: null, business_name: 'Service Provider', verified: false }; // Default/fallback

          return {
            ...item, // Spread the original service data (id is service.id)
            provider: { // Create a nested provider object
              id: finalProviderData.id, // <-- Provider's ID!
              business_name: finalProviderData.business_name,
              verified: finalProviderData.verified,
            },
            service_providers: undefined, // Clean up the original flat structure
          };
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

  // ---> START: Favorites Logic <--- 
  const fetchFavorites = useCallback(async () => {
    if (!userId) return; // Don't fetch if user ID is not available

    console.log("Fetching user favorites...");
    setLoading(true); // Indicate loading while fetching favorites initially
    try {
      const { data, error } = await supabase
        .from('favorites') // Use correct table name
        .select('item_id') // Select the item ID column
        .eq('user_id', userId); 

      if (error) {
        console.error("Error fetching favorites:", error);
        // Optionally set an error state here
      } else if (data) {
        console.log(`Fetched ${data.length} favorites.`);
        setFavorites(new Set(data.map(fav => fav.item_id)));
      } else {
        setFavorites(new Set()); // Ensure it's reset if no data
      }
    } catch (err) {
      console.error("Exception fetching favorites:", err);
      setFavorites(new Set()); // Reset on exception
    } finally {
      // Consider if setLoading(false) should happen here or after listings load
      // For now, let loadListings handle the final setLoading(false)
    }
  }, [userId]); // Dependency: re-fetch if userId changes

  const toggleFavorite = async (item: ListingItem) => {
    if (!userId) {
      console.error("Cannot toggle favorite: User not logged in.");
      // Optionally show a message to the user
      return;
    }

    const currentFavorites = new Set(favorites);
    const itemType = isHousingListing(item) ? 'housing_listing' : 'service_provider'; // Determine correct type
    
    // ---> Determine the correct ID to save based on type <--- 
    const itemIdToSave = itemType === 'service_provider' 
      ? (item as Service).provider?.id // Use provider's ID for services
      : item.id; // Use direct item ID for housing (and potentially others)

    // Check if we have a valid ID to save
    if (!itemIdToSave) {
      console.error(`Cannot toggle favorite: Invalid item ID for type ${itemType}`, item);
      return; // Prevent saving favorite with null/undefined ID
    }

    // Optimistic UI update (using itemIdToSave for consistency in the Set)
    if (currentFavorites.has(itemIdToSave)) {
      currentFavorites.delete(itemIdToSave);
    } else {
      currentFavorites.add(itemIdToSave);
    }
    setFavorites(currentFavorites);

    // Perform Supabase operation
    try {
      // Check ORIGINAL state before optimistic update using itemIdToSave
      if (favorites.has(itemIdToSave)) { 
        // --- Remove from Favorites --- 
        console.log(`Removing favorite: ${itemIdToSave}`);
        const { error } = await supabase
          .from('favorites') // Correct table
          .delete()
          .match({ user_id: userId, item_id: itemIdToSave }); // Use correct ID
        if (error) {
          console.error("Error removing favorite:", error);
          // Revert optimistic update on error
          setFavorites(prev => new Set(prev).add(itemIdToSave)); 
        }
      } else {
        // --- Add to Favorites --- 
        console.log(`Adding favorite: ${itemIdToSave}, type: ${itemType}`);
        const { error } = await supabase
          .from('favorites') // Correct table
          .insert({ user_id: userId, item_id: itemIdToSave, item_type: itemType }); // Use correct ID
        if (error) {
          console.error("Error adding favorite:", error);
          // Revert optimistic update on error
          setFavorites(prev => {
            const reverted = new Set(prev);
            reverted.delete(itemIdToSave);
            return reverted;
          });
        }
      }
    } catch (err) {
       console.error("Exception toggling favorite:", err);
       // Revert optimistic update on exception
       setFavorites(prev => {
         const reverted = new Set(prev);
         // Make sure to check using the correct ID
         if (reverted.has(itemIdToSave)) reverted.delete(itemIdToSave); else reverted.add(itemIdToSave); 
         return reverted;
       });
    }
  };
  // ---> END: Favorites Logic <--- 

  // ---> START Sort State & Refs <---
  const [sortOption, setSortOption] = useState<{ field: string; direction: 'asc' | 'desc' }>({ 
    field: 'created_at', // Default sort: Newest first
    direction: 'desc' 
  });
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['35%'], []); // Adjust height as needed

  // Callback to open the bottom sheet
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  // Callback for when sheet changes (e.g., dismissed)
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
    // You can add logic here if needed when the sheet opens/closes
  }, []);

  // Function to update sort option and close sheet
  const selectSortOption = (field: string, direction: 'asc' | 'desc') => {
    setSortOption({ field, direction });
    bottomSheetModalRef.current?.dismiss();
  };
  // ---> END Sort State & Refs <---

  // Effect 1: Load listings when category or search changes, reset index
  useEffect(() => {
    console.log('Effect: Loading listings due to category/search change');
    setCurrentIndex(0); // Reset index when category/search changes
    loadListings();
    // Also fetch favorites when category changes, as listings are new
    fetchFavorites(); 
  }, [selectedCategory, searchQuery, sortOption, fetchFavorites]); // Add fetchFavorites dependency

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

  // Effect 4: Fetch initial favorites when userId is available (runs once after login)
  useEffect(() => {
    if (userId) {
      console.log("Effect: Fetching initial favorites as userId is available.");
      fetchFavorites();
    }
  }, [userId, fetchFavorites]); // Depend on userId and the fetch function itself

  async function onRefresh() {
    setRefreshing(true);
    // Fetch favorites again on refresh along with listings
    await Promise.all([loadListings(), fetchFavorites()]);
    setRefreshing(false);
  };

  // Helper function to safely check view mode
  const isMode = (current: ViewMode, target: ViewMode): boolean => current === target;

  // Type guard for Service
  const isServiceListing = (item: ListingItem): item is Service => {
    return 'category' in item && 'format' in item; // Check for properties unique to Service
  };

  // Type guard for HousingListing
  const isHousingListing = (item: ListingItem): item is HousingListing => {
    return 'weekly_rent' in item; // Check for a property unique to HousingListing
  };

  // Helper to determine if an item is favorited
  const isItemFavorited = (item: ListingItem): boolean => {
    if (isServiceListing(item) && item.provider?.id) {
      return favorites.has(item.provider.id);
    } else if (isHousingListing(item)) {
      return favorites.has(item.id);
    }
    // Assuming group_events would use item.id similar to housing
    // Add more conditions here if other types are favoritable differently
    return false;
  };

  // Helper to get item price (uses property from specific type)
  const getItemPrice = (item: ListingItem): number => {
    if (isHousingListing(item)) {
      return item.weekly_rent ?? 0;
    } else if (isServiceListing(item)) {
      return item.price ?? 0;
    }
    return 0;
  };

  // Helper to get item image URL
  const getItemImage = (item: ListingItem): string => {
    if (isServiceListing(item)) {
      // Use the first media URL if available from the database
      if (item.media_urls && item.media_urls.length > 0 && item.media_urls[0]) {
        return item.media_urls[0];
      } else {
        // Fallback if media_urls is empty or not present
        console.warn(`No media_urls found for service ID: ${item.id}`);
        return DEFAULT_IMAGE;
      }
    } else if (isHousingListing(item)) {
      // Use the first media URL if available
      return (item.media_urls && item.media_urls.length > 0)
        ? item.media_urls[0]
        : DEFAULT_IMAGE;
    }
    // Fallback for any other case
    return DEFAULT_IMAGE;
  };

  // Helper function to render provider info (business name)
  const renderServiceProvider = (item: ListingItem) => {
    if (item.provider) {
      return (
        <View style={styles.providerContainer}>
          <Text style={styles.providerName} numberOfLines={1} selectable={false}>
            {item.provider.business_name || 'Provider Name Unavailable'}
          </Text>
        </View>
      );
    }
    return <></>; // Return empty fragment instead of null
  };

  // Helper to get item price with unit
  const getItemPriceWithUnit = (item: ListingItem) => {
    if (isHousingListing(item)) {
      return `${getItemPrice(item)}/week`;
    } else if (isServiceListing(item)) {
      return `${getItemPrice(item)}/hour`;
    }
    return '';
  };

  // Helper to check if a housing listing has a group
  const hasHousingGroup = (item: ListingItem) => {
    if (isHousingListing(item)) {
      return housingGroupsMap[item.id] || false;
    }
    return false;
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

  // Render Group Match icon for grid and list view
  const renderGroupMatchBadge = (item: ListingItem) => {
    if (isHousingListing(item) && housingGroupsMap[item.id]) {
      return (
        <GroupMatchIcon style={styles.groupMatchBadge} />
      );
    }
    return null;
  };

  const handleCardTap = useCallback((item: ListingItem) => {
    console.log('Card tapped:', item.id);
    // Navigate to detail screen using the existing helper function
    navigateToDetails(item); 
  }, [router, navigateToDetails]); // Add navigateToDetails to dependency array

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
          isHousingListing(item) ? (
            <HousingCard
              item={item}
              onPress={() => navigateToDetails(item)}
              onToggleFavorite={() => toggleFavorite(item)}
              isFavorite={favorites.has(item.id)}
              onMorePress={() => { /* TODO: handle more options */ }}
              showGroupMatch={housingGroupsMap[item.id]}
            />
          ) : (
            // Keep existing service card rendering for non-housing listings
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
                  {isServiceListing(item) && item.provider?.verified && (
                    <View style={styles.ndisBadgeGrid}>
                      <BadgeCheck size={14} color="#fff" />
                      <Text style={styles.ndisBadgeText}>NDIS</Text>
                    </View>
                  )}
                  <Pressable style={styles.favButton} onPress={() => toggleFavorite(item)}>
                    <Heart 
                      size={20} 
                      color={isItemFavorited(item) ? "#ff4081" : "#ccc"} 
                      fill={isItemFavorited(item) ? "#ff4081" : "none"} 
                    />
                  </Pressable>
                </View>
                
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                  {renderServiceProvider(item)}
                  <View style={styles.serviceFooter}>
                    <View style={styles.priceContainer}>
                      {isServiceListing(item) && <Clock size={14} color="#666" style={styles.priceIcon}/>}
                      <Text style={styles.servicePrice}>
                        ${getItemPrice(item)}
                        {isHousingListing(item) ? '/week' : (isServiceListing(item) ? '/ hour' : '')}
                      </Text>
                    </View>
                  </View>
                </View>
              </ShadowCard>
            </TouchableOpacity>
          )
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
                  <Image source={{ uri: getItemImage(item) }} style={styles.listImage} />
                  {renderGroupMatchBadge(item)}
                  {isServiceListing(item) && item.provider?.verified && (
                    <View style={styles.ndisBadgeList}>
                      <BadgeCheck size={12} color="#fff" />
                      <Text style={styles.ndisBadgeText}>NDIS</Text>
                    </View>
                  )}
                  <Pressable style={styles.favButton} onPress={() => toggleFavorite(item)}>
                    <Heart 
                      size={20} 
                      color={isItemFavorited(item) ? "#ff4081" : "#ccc"} 
                      fill={isItemFavorited(item) ? "#ff4081" : "none"} 
                    />
                  </Pressable>
                </View>
                <View style={styles.serviceDetails}> 
                  <View> 
                    <Text style={styles.serviceTitle} numberOfLines={3}>
                      {item.title}
                    </Text>
                    {renderServiceProvider(item)}
                    {/* Add location back if needed, using appropriate styles */}
                    {isHousingListing(item) ? (
                       <Text style={styles.serviceDescription} numberOfLines={2}>
                         {item.bedrooms} bed • {item.bathrooms} bath • {item.suburb}
                       </Text>
                     ) : (
                       <Text style={styles.serviceDescription} numberOfLines={2}>
                         {isServiceListing(item) ? item.description : ''} {/* Show description only for services */}
                       </Text>
                     )}
                  </View>
                  <View style={styles.priceContainerList}>
                     {isServiceListing(item) && <Clock size={16} color="#666" style={styles.priceIcon}/>}
                     <Text style={styles.servicePrice}> 
                       ${getItemPrice(item)}
                       {isHousingListing(item) ? '/week' : (isServiceListing(item) ? '/ hour' : '')}
                     </Text>
                  </View>
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
            onPress={handlePresentModalPress}
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
              getItemImage={getItemImage}
              getItemPrice={getItemPrice}
              isHousingListing={isHousingListing}
              isServiceListing={isServiceListing} // Pass the type guard prop
              renderServiceProvider={renderServiceProvider}
              hasHousingGroup={hasHousingGroup}
              onCardTap={handleCardTap} // Pass the tap handler
              favorites={favorites} // Pass favorites set
            />
          )}
        </View>
      )}
      
      {/* Bottom Sheet Modal for Sorting */} 
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0} // Initial position index
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }} // Style the grab handle
        backgroundStyle={{ backgroundColor: '#fff' }} // Style the sheet background
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Sort By</Text>
          {/* Add Sorting Options Here */} 
          {/* Example: */}
          <TouchableOpacity style={styles.sortOptionButton} onPress={() => selectSortOption('title', 'asc')}> 
             <Text>Name (A-Z)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortOptionButton} onPress={() => selectSortOption('title', 'desc')}> 
             <Text>Name (Z-A)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortOptionButton} onPress={() => selectSortOption('created_at', 'desc')}> 
             <Text>Date Added (Newest)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortOptionButton} onPress={() => selectSortOption('created_at', 'asc')}> 
             <Text>Date Added (Oldest)</Text>
          </TouchableOpacity>
          {/* TODO: Add Price options if applicable/consistent */}
        </BottomSheetView>
      </BottomSheetModal>

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
    padding: 15, // Increased padding
  },
  servicesList: {
    paddingVertical: 15, // Increased padding
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
    padding: 15, // Increased padding
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  serviceImage: {
    width: '80%', // Reduced width
    height: 140,
    resizeMode: 'contain', // Scale image to fit within the area
    borderRadius: 20, // More rounded corners
    alignSelf: 'center', // Center the image
  },
  listImage: {
    width: 80, // Reduced width (100 * 0.8)
    height: 100,
    resizeMode: 'contain', // Scale image to fit within the area
    borderRadius: 16, // More rounded corners
  },
  listImageContainer: {
    position: 'relative',
  },
  serviceDetails: {
    padding: 15, // Increased padding
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
    fontSize: 14,
    color: '#666',
    marginTop: 4, // Add space below title/provider
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 1, // Prevent provider name from pushing badge out
  },
  providerName: {
    fontSize: 12,
    color: 'white', // <--- Add this line
    marginRight: 4, // Space between name and badge
    flexShrink: 1, // Allow name to shrink if needed
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: { // Container for price and icon (Grid)
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainerList: { // Container for price and icon (List)
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Add spacing in list view
  },
  priceIcon: {
    marginRight: 4,
  },
  ndisBadgeGrid: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)', // App blue
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ndisBadgeList: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)', // App blue
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ndisBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
  },
  favButton: { 
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 20,
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
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4, // Add some space above
    marginBottom: 2, // Add space below
  },
  categoryTextGridList: {
    fontSize: 12,
    color: '#666',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    // alignItems: 'center', // Uncomment if you want centered items
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  sortOptionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});