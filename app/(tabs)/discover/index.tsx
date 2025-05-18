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
  Pressable,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Bed,
  Bath,
  Briefcase,
  Building,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Hash,
  Heart,
  Home,
  LayoutGrid,
  List,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Upload,
  Users,
  X
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import SwipeListView from './components/SwipeListView';
import { ListingItem, ViewMode, Service, HousingListing, isViewMode } from './types';
import { ShadowCard } from './components/ShadowCard';
import GroupMatchIcon from '../housing/components/GroupMatchIcon';
import HousingCard from './components/HousingCard';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import ShareItemModal, { ShareItemType } from '../../../components/ShareItemModal';
import { useAuth } from '../../../providers/AuthProvider';

const SUPABASE_PROJECT_REF = 'smtckdlpdfvdycocwoip'; 
const SUPABASE_STORAGE_BASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/providerimages`;
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

const categoryImageCounts: { [key: string]: number } = {
  Therapy: 16, Personal: 4, Social: 4, Support: 19, Tech: 6, Transport: 4,
};

const CATEGORIES = [
  { id: 'Therapy', name: 'Therapy', icon: (props: any) => <Heart {...props} /> },
  { id: 'Housing', name: 'Housing', icon: (props: any) => <Home {...props} /> },
  { id: 'Support', name: 'Support', icon: (props: any) => <Briefcase {...props} /> },
  { id: 'Transport', name: 'Transport', icon: (props: any) => <CreditCard {...props} /> },
  { id: 'Tech', name: 'Tech', icon: (props: any) => <Upload {...props} /> },
  { id: 'Personal', name: 'Personal', icon: (props: any) => <MessageCircle {...props} /> },
  { id: 'Social', name: 'Social', icon: (props: any) => <Users {...props} /> },
];

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { returnIndex, returnViewMode, category } = useLocalSearchParams<{ 
    returnIndex: string; returnViewMode: ViewMode; category: string;
  }>();
  
  const { session } = useAuth();
  const userId = session?.user?.id;

  const localParams = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Therapy');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareItem, setShareItem] = useState<{
    itemId: string | null; itemType: ShareItemType; itemTitle?: string; itemImageUrl?: string;
  } | null>(null);

  const handleShare = async (itemId: string, itemType: ShareItemType, selectedFriendIds: string[]) => {
    try {
      if (!userId) throw new Error('User not authenticated');
      if (!itemId || !selectedFriendIds.length) return;
      const { error: shareError } = await supabase.from('shared_items').insert(
        selectedFriendIds.map(friendId => ({
          sender_id: userId, recipient_id: friendId, item_id: itemId, item_type: itemType,
        }))
      );
      if (shareError) throw shareError;
      const { error: notifError } = await supabase.from('notifications').insert(
        selectedFriendIds.map(friendId => ({
          user_id: friendId,
          type: 'post_share',
          content: JSON.stringify({ sender_id: userId, item_id: itemId, item_type: itemType }),
          seen: false,
        }))
      );
      if (notifError) throw notifError;
      setShareModalVisible(false);
    } catch (err: any) {
      console.error('Error sharing item:', err);
    }
  };
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastTap, setLastTap] = useState<number>(0);
  const [lastTapItem, setLastTapItem] = useState<string | null>(null);
  const DOUBLE_TAP_DELAY = 300;

  const [housingGroupsMap, setHousingGroupsMap] = useState<Record<string, boolean>>({});

  async function fetchHousingGroups(listingIds: string[]) {
    if (!listingIds || listingIds.length === 0) return;
    try {
      const groupMap: Record<string, boolean> = {};
      listingIds.forEach(id => { groupMap[id] = false; });
      const BATCH_SIZE = 30;
      for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
        const batchIds = listingIds.slice(i, i + BATCH_SIZE);
        try {
          const { data, error } = await supabase.from('housing_groups').select('id, listing_id').in('listing_id', batchIds);
          if (error) { console.error('Error fetching housing groups batch:', error); continue; }
          if (data && Array.isArray(data)) {
            data.forEach(group => { if (group && group.listing_id) { groupMap[group.listing_id] = true; } });
          }
        } catch (batchError) { console.error('Batch processing error:', batchError); }
      }
      setHousingGroupsMap(groupMap);
    } catch (error) {
      console.error('Error in fetchHousingGroups:', error);
      setHousingGroupsMap({});
    }
  }

  async function loadListings() {
    try {
      setLoading(true);
      const isHousingCategory = selectedCategory === 'Housing';
      if (isHousingCategory) {
        const { data, error } = await supabase
          .from('housing_listings')
          .select(`id, title, description, weekly_rent, bedrooms, bathrooms, suburb, state, sda_category, media_urls, address`) // Added address
          .order(sortOption.field, { ascending: sortOption.direction === 'asc' });
        if (error) throw error;
        const transformedData = data?.map(item => ({
          ...item, // address will be spread from item if selected
          sda_listing: !!item.sda_category, // Derive sda_listing from sda_category
          provider: { id: null, business_name: 'Housing Provider', verified: false },
          has_housing_group: false 
        })) as HousingListing[];
        setListings(transformedData || []);
        if (transformedData && transformedData.length > 0) {
          const listingIds = transformedData.map(item => item.id);
          await fetchHousingGroups(listingIds);
        }
      } else {
        const { data, error } = await supabase
          .from('services')
          .select(`id, title, description, category, format, price, media_urls, service_providers (id, business_name, verified)`)
          .eq('category', selectedCategory)
          .order(sortOption.field, { ascending: sortOption.direction === 'asc' });
        if (error) throw error;
        const transformedData = data?.map(item => {
          let providerObj: { id: string; business_name: string; verified: boolean } | null = null;
          if (item.service_providers) {
            if (Array.isArray(item.service_providers) && item.service_providers.length > 0) {
              providerObj = item.service_providers[0]; 
            } else if (!Array.isArray(item.service_providers)) {
              providerObj = item.service_providers as any;
            }
          }
          const finalProviderData = providerObj && providerObj.id
            ? providerObj
            : { id: null, business_name: 'Service Provider', verified: false };
          return {
            ...item,
            provider: { id: finalProviderData.id, business_name: finalProviderData.business_name, verified: finalProviderData.verified, },
            service_providers: undefined,
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

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    console.log("Fetching user favorites...");
    // setLoading(true); // Avoid double loading indicator if loadListings also sets it
    try {
      const { data, error } = await supabase.from('favorites').select('item_id').eq('user_id', userId); 
      if (error) { console.error("Error fetching favorites:", error); } 
      else if (data) { setFavorites(new Set(data.map(fav => fav.item_id))); } 
      else { setFavorites(new Set()); }
    } catch (err) {
      console.error("Exception fetching favorites:", err); setFavorites(new Set());
    }
    // setLoading(false);
  }, [userId]);

  const toggleFavorite = async (item: ListingItem) => {
    if (!userId) { console.error("Cannot toggle favorite: User not logged in."); return; }
    const currentFavorites = new Set(favorites);
    const itemType = isHousingListing(item) ? 'housing_listing' : 'service_provider';
    const itemIdToSave = itemType === 'service_provider' ? (item as Service).provider?.id : item.id;
    if (!itemIdToSave) { console.error(`Cannot toggle favorite: Invalid item ID for type ${itemType}`, item); return; }

    if (currentFavorites.has(itemIdToSave)) { currentFavorites.delete(itemIdToSave); } 
    else { currentFavorites.add(itemIdToSave); }
    setFavorites(currentFavorites);

    try {
      if (favorites.has(itemIdToSave)) { 
        const { error } = await supabase.from('favorites').delete().match({ user_id: userId, item_id: itemIdToSave });
        if (error) { console.error("Error removing favorite:", error); setFavorites(prev => new Set(prev).add(itemIdToSave)); }
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: userId, item_id: itemIdToSave, item_type: itemType });
        if (error) {
          console.error("Error adding favorite:", error);
          setFavorites(prev => { const reverted = new Set(prev); reverted.delete(itemIdToSave); return reverted; });
        }
      }
    } catch (err) {
       console.error("Exception toggling favorite:", err);
       setFavorites(prev => {
         const reverted = new Set(prev);
         if (reverted.has(itemIdToSave)) reverted.delete(itemIdToSave); else reverted.add(itemIdToSave); 
         return reverted;
       });
    }
  };

  const [sortOption, setSortOption] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'created_at', direction: 'desc' });
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['35%'], []);
  const handlePresentModalPress = useCallback(() => { bottomSheetModalRef.current?.present(); }, []);
  const handleSheetChanges = useCallback((index: number) => { console.log('handleSheetChanges', index); }, []);
  const selectSortOption = (field: string, direction: 'asc' | 'desc') => {
    setSortOption({ field, direction });
    bottomSheetModalRef.current?.dismiss();
  };

  useEffect(() => {
    setCurrentIndex(0);
    loadListings();
    fetchFavorites(); 
  }, [selectedCategory, searchQuery, sortOption, fetchFavorites]);

  useEffect(() => {
    const { category: paramCategoryValue } = localParams;
    const paramCategory = Array.isArray(paramCategoryValue) ? paramCategoryValue[0] : paramCategoryValue;
    if (paramCategory && paramCategory !== selectedCategory) {
      setSelectedCategory(paramCategory);
    }
  }, [localParams?.category]); // Not adding selectedCategory to deps to avoid loop

  useEffect(() => {
    const { returnIndex: paramReturnIndexValue, returnViewMode: paramReturnViewModeValue } = localParams;
    const paramReturnIndex = Array.isArray(paramReturnIndexValue) ? paramReturnIndexValue[0] : paramReturnIndexValue;
    const paramReturnViewMode = Array.isArray(paramReturnViewModeValue) ? paramReturnViewModeValue[0] : paramReturnViewModeValue;

    if (paramReturnIndex === undefined && paramReturnViewMode === undefined) return;
    let needsUpdate = false; let newViewMode = viewMode; let newCurrentIndex = currentIndex;
    if (paramReturnViewMode && isViewMode(paramReturnViewMode) && paramReturnViewMode !== viewMode) {
      newViewMode = paramReturnViewMode; needsUpdate = true;
    }
    if (paramReturnIndex) {
      const parsedIndex = parseInt(paramReturnIndex, 10);
      if (!isNaN(parsedIndex) && listings.length > 0 && parsedIndex >= 0 && parsedIndex < listings.length && parsedIndex !== currentIndex) {
        newCurrentIndex = parsedIndex; needsUpdate = true;
      }
    }
    if (needsUpdate) { setViewMode(newViewMode); setCurrentIndex(newCurrentIndex); }
  }, [localParams?.returnIndex, localParams?.returnViewMode, listings.length]); // Added listings.length for index validation

  useEffect(() => {
    if (userId) { fetchFavorites(); }
  }, [userId, fetchFavorites]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadListings(), fetchFavorites()]);
    setRefreshing(false);
  };

  const isMode = (current: ViewMode, target: ViewMode): boolean => current === target;
  const isServiceListing = (item: ListingItem): item is Service => 'category' in item && 'format' in item;
  const isHousingListing = (item: ListingItem): item is HousingListing => 'weekly_rent' in item;

  const isItemFavorited = (item: ListingItem): boolean => {
    if (isServiceListing(item) && item.provider?.id) return favorites.has(item.provider.id);
    if (isHousingListing(item)) return favorites.has(item.id);
    return false;
  };

  const getItemPrice = (item: ListingItem): number => {
    if (isHousingListing(item)) return item.weekly_rent ?? 0;
    if (isServiceListing(item)) return item.price ?? 0;
    return 0;
  };

  const getItemImage = (item: ListingItem): string => {
    if (isServiceListing(item)) {
      return (item.media_urls && item.media_urls.length > 0 && item.media_urls[0]) ? item.media_urls[0] : DEFAULT_IMAGE;
    }
    if (isHousingListing(item)) {
      return (item.media_urls && item.media_urls.length > 0) ? item.media_urls[0] : DEFAULT_IMAGE;
    }
    return DEFAULT_IMAGE;
  };

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
    return <></>;
  };

  const getItemPriceWithUnit = (item: ListingItem) => {
    if (isHousingListing(item)) return `${getItemPrice(item)}/week`;
    if (isServiceListing(item)) return `${getItemPrice(item)}/hour`;
    return '';
  };

  const hasHousingGroup = (item: ListingItem) => {
    if (isHousingListing(item)) return housingGroupsMap[item.id] || false;
    return false;
  };

  const navigateToDetails = (item: ListingItem) => {
    let idForNavigation: string | null = null;
    let targetPathname: '/(tabs)/discover/[id]' | '/(tabs)/housing/[id]' = '/(tabs)/discover/[id]';

    if (isHousingListing(item)) {
      // For housing listings, use the item's ID
      idForNavigation = item.id;
      targetPathname = '/(tabs)/housing/[id]';
    } else if (isServiceListing(item)) {
      // For service listings, use the service's ID (item.id), not the provider's ID
      idForNavigation = item.id; // Changed from item.provider?.id to item.id
      // Default path is already set
    }

    if (!idForNavigation) {
      console.error("navigateToDetails: Could not determine ID for navigation or item type is unknown.", item);
      return; 
    }

    // Use type assertion to ensure the params match the expected type
    router.push({
      pathname: targetPathname as any, // Type assertion needed for dynamic routes
      params: {
        id: idForNavigation,
        returnIndex: currentIndex.toString(),
        returnViewMode: viewMode,
        source: 'discover'
      } as Record<string, string>
    });
  };

  const renderGroupMatchBadge = (item: ListingItem) => {
    if (isHousingListing(item) && housingGroupsMap[item.id]) {
      return <GroupMatchIcon style={styles.groupMatchBadge} />;
    }
    return null;
  };

  const handleCardTap = useCallback((item: ListingItem) => {
    navigateToDetails(item); 
  }, [navigateToDetails]); // Ensure navigateToDetails is stable or add its dependencies


  // --- Render Grid View ---
  const renderGridView = () => {
    if (!loading && listings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Listings Found</Text>
          <Text style={styles.emptyStateText}>Try adjusting your search or filters</Text>
        </View>
      );
    }
    return (
      <FlatList
        key="grid"
        data={listings}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.gridColumnWrapper}
        contentContainerStyle={styles.servicesGrid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          isHousingListing(item) ? (
            <HousingCard
              item={item as HousingListing} // Cast because we filter for Housing category
              onPress={() => navigateToDetails(item)}
              onToggleFavorite={() => toggleFavorite(item)} // Corrected call
              isFavorite={isItemFavorited(item)}
              // onMorePress={() => {
              //   console.log('More options for:', item.title);
              //   // Implement more options logic, e.g., open a modal or action sheet
              // }}
              showGroupMatch={hasHousingGroup(item)}
            />
          ) : (
            <TouchableOpacity
              style={styles.serviceCardTouchable}
              onPress={() => navigateToDetails(item)}
            >
              <ShadowCard 
                width={(width - 36) / 2} // (width - (paddingHorizontal * 2) - gapBetweenColumns) / numColumns
                height={240} // Consider making height dynamic or ensure content fits
                radius={12}
                style={styles.serviceCard}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: getItemImage(item) }} style={styles.serviceImage} />
                  {renderGroupMatchBadge(item)}
                  <Pressable 
                    style={styles.favButton}
                    onPress={() => toggleFavorite(item)}
                  >
                    <Heart 
                      size={20} 
                      color={isItemFavorited(item) ? "#ff4081" : "#ccc"} 
                      fill={isItemFavorited(item) ? "#ff4081" : "none"} 
                    />
                  </Pressable>
                  {item.provider?.verified && (
                    <View style={styles.ndisBadge}> 
                      <BadgeCheck size={14} color="#fff" />
                      <Text style={styles.ndisBadgeText}>NDIS</Text>
                    </View>
                  )}
                </View>
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceTitle} numberOfLines={2}>{item.title}</Text> 
                  {renderServiceProvider(item)} 
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {item.description} 
                  </Text>
                  <View style={styles.serviceFooter}> 
                    <View style={styles.priceContainer}>
                      {isServiceListing(item) && <Clock size={14} color="#666" style={styles.priceIcon}/>}
                      <Text style={styles.servicePrice}> 
                        {String(getItemPrice(item)) === 'Contact for price' ? 'Contact for price' : `$${getItemPrice(item)}`}
                        {isHousingListing(item) ? '/week' : (isServiceListing(item) && !String(getItemPrice(item)).includes('/hr') && String(getItemPrice(item)) !== 'Contact for price' ? '/hr' : '')}
                      </Text>
                    </View>
                    {(isServiceListing(item) && item.provider?.id) && (
                      <Pressable 
                        style={styles.shareButtonGrid} 
                        onPress={() => {
                          setShareModalVisible(true);
                          setShareItem({
                            itemId: item.provider!.id,
                            itemType: 'service_provider',
                            itemTitle: item.provider!.business_name,
                            itemImageUrl: getItemImage(item),
                          });
                      }}>
                        <Share2 size={18} color="#007AFF" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </ShadowCard>
            </TouchableOpacity>
          )
        )}
      />
    );
  };

  // --- Render List View (Placeholder - Implement actual list item UI) ---
  const renderListView = () => {
    if (!loading && listings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Listings Found</Text>
          <Text style={styles.emptyStateText}>Try adjusting your search or filters</Text>
        </View>
      );
    }
    return (
      <FlatList
        key="list"
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.servicesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item, index }) => (
          isHousingListing(item) ? (
            <TouchableOpacity 
              key={`housing-list-${item.id || index}`}
              style={styles.serviceListItemTouchable} 
              onPress={() => handleCardTap(item)} // Retain housing-specific tap handler
            >
              <ShadowCard 
                style={styles.serviceListItemCard} 
                width={width - (styles.serviceListItemTouchable.marginHorizontal || 16) * 2}
                height={styles.serviceListItemCard.height || 124}
              > 
                {/* Child 1: Image and Badges */}
                <View style={styles.listItemImageContainer}> 
                  <Image 
                    source={{ uri: item.media_urls && item.media_urls.length > 0 ? item.media_urls[0] : DEFAULT_IMAGE }}
                    style={styles.listItemImage} 
                    resizeMode="cover"
                  />
                  {/* Housing Specific Badges */}
                  {(() => {
                    const shouldShowSdaBadge = Boolean(item.sda_listing);
                    if (shouldShowSdaBadge) {
                      return (
                        <View style={styles.sdaBadgeList}> 
                            <Text style={styles.sdaBadgeTextList}>SDA</Text>
                        </View>
                      );
                    }
                    return null;
                  })()}
                  {hasHousingGroup && hasHousingGroup(item) && renderGroupMatchBadge && (() => {
                    const badgeContent = renderGroupMatchBadge(item);
                    if (typeof badgeContent === 'string') {
                      return <Text>{badgeContent}</Text>;
                    }
                    // Otherwise, assume it's valid JSX (or null/undefined)
                    return badgeContent;
                  })()}
                </View>

                {/* Child 2: Text Content Container */}
                <View style={styles.listTextContentContainer}> 
                  <Text style={styles.listItemTitleHousing} numberOfLines={1}>{String(item.title || '')}</Text> 
                  <Text style={styles.listItemAddressHousing} numberOfLines={1}>{String(item.address || `${item.suburb || ''}, ${item.state || ''}`.trim() || 'Address not specified')}</Text>
                  <View style={styles.listItemFeaturesHousing}> 
                    <View style={styles.listItemFeatureItemHousing}>
                      <Bed size={14} color="#374151" />
                      <Text style={styles.listItemFeatureTextHousing}>{item.bedrooms || 'N/A'}</Text>
                    </View>
                    <View style={styles.listItemFeatureItemHousing}>
                      <Bath size={14} color="#374151" />
                      <Text style={styles.listItemFeatureTextHousing}>{item.bathrooms || 'N/A'}</Text>
                    </View>
                    {item.sda_category && (
                      <View style={styles.listItemFeatureItemHousing}>
                        <Home size={14} color="#374151" />
                        <Text style={styles.listItemFeatureTextHousing} numberOfLines={1}>{String(item.sda_category || '')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.listItemPriceHousing}> 
                    {getItemPrice(item) && String(getItemPrice(item)) !== 'Contact for price' ? `$${getItemPrice(item)}/week` : 'Contact for price'}
                  </Text>
                </View>

                {/* Child 3: Actions Container */}
                <View style={styles.listActionsContainer}>
                  <Pressable onPress={() => toggleFavorite(item)} style={styles.listActionButton}>
                    <Heart size={22} color={isItemFavorited(item) ? "#FF4081" : "#9CA3AF"} fill={isItemFavorited(item) ? "#FF4081" : "none"} />
                  </Pressable>
                  <Pressable 
                    onPress={() => {
                      setShareItem({
                        itemId: item.id,
                        itemType: 'housing_listing',
                        itemTitle: item.title,
                        itemImageUrl: getItemImage(item),
                      });
                      setShareModalVisible(true);
                    }} 
                    style={styles.listActionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Share2 size={22} color="#4B5563" />
                  </Pressable>
                </View>
              </ShadowCard>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              key={`service-list-${item.id || index}`}
              style={styles.serviceListItemTouchable}
            >
              <ShadowCard 
                style={styles.serviceListItemCard} 
                width={width - (styles.serviceListItemTouchable.marginHorizontal || 16) * 2}
                height={styles.serviceListItemCard.height || 124}
              > 
                {/* Child 1: Image and Badges */}
                <View style={styles.listImageContainer}>
                  <Image 
                    source={{ uri: getItemImage(item) }} 
                    style={styles.listImage}
                    resizeMode="cover"
                  />
                  {item.provider?.verified && (
                    <View style={styles.ndisBadgeList}>
                      <BadgeCheck size={12} color="#fff" />
                      <Text style={styles.ndisBadgeTextList}>NDIS</Text>
                    </View>
                  )}
                  {/* {renderGroupMatchBadge && renderGroupMatchBadge(item)} */}
                </View>

                {/* Child 2: Text Content Container */}
                <View style={styles.listTextContentContainer}>
                  <Text style={styles.listServiceTitle} numberOfLines={2}>{item.title}</Text>
                  {renderServiceProvider && renderServiceProvider(item)} 
                  <Text style={styles.listServiceDescription} numberOfLines={2}> 
                    {item.description}
                  </Text>
                  <View style={styles.listPriceContainer}>
                    {isServiceListing(item) && <Clock size={14} color="#666" style={styles.listPriceIcon}/>}
                    <Text style={styles.listServicePrice}>
                      {String(getItemPrice(item)) === 'Contact for price' ? 'Contact for price' : `$${getItemPrice(item)}`}
                      {isHousingListing(item) ? '/week' : (isServiceListing(item) && !String(getItemPrice(item)).includes('/hr') && String(getItemPrice(item)) !== 'Contact for price' ? '/hr' : '')}
                    </Text>
                  </View>
                </View>

                {/* Child 3: Actions Container */}
                <View style={styles.listActionsContainer}>
                  <Pressable onPress={() => toggleFavorite(item)} style={styles.listActionButton}>
                    <Heart size={22} color={isItemFavorited(item) ? "#FF4081" : "#9CA3AF"} fill={isItemFavorited(item) ? "#FF4081" : "none"} />
                  </Pressable>
                  {(isServiceListing(item) && item.provider?.id) && (
                    <Pressable 
                      style={styles.listActionButton} 
                      onPress={() => {
                        setShareModalVisible(true);
                        setShareItem({
                          itemId: item.provider!.id,
                          itemType: 'service_provider',
                          itemTitle: item.provider!.business_name,
                          itemImageUrl: getItemImage(item),
                        });
                      }}>
                      <Share2 size={20} color="#4B5563" />
                    </Pressable>
                  )}
                </View>
              </ShadowCard>
            </TouchableOpacity>
          )
        )}
      />
    );
  };

  // --- Main Return for DiscoverScreen ---
  return (
    <View style={styles.container}>
      <AppHeader title="Discover" />
      
      {/* View toggle buttons - shown directly below header ONLY when in swipe view */}
      {isMode(viewMode, 'swipe') && (
        <View style={styles.swipeViewToggleContainer}>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'grid') && styles.selectedViewToggle]} onPress={() => setViewMode('grid')}>
              <LayoutGrid size={20} color={isMode(viewMode, 'grid') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'list') && styles.selectedViewToggle]} onPress={() => setViewMode('list')}>
              <List size={20} color={isMode(viewMode, 'list') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'swipe') && styles.selectedViewToggle]} onPress={() => setViewMode('swipe')}>
              <Heart size={20} color={isMode(viewMode, 'swipe') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sortButton} onPress={handlePresentModalPress}>
            <ChevronDown size={20} color="#333" />
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
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                <X size={16} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handlePresentModalPress /* Or a dedicated filter modal */}>
            <Filter size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Categories - hidden in swipe view */}
      {!isMode(viewMode, 'swipe') && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, selectedCategory === cat.id && styles.selectedCategory]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                {/* Optional: cat.icon({ size: 16, color: selectedCategory === cat.id ? '#FFF' : '#333', style: { marginRight: 4 } }) */}
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.selectedCategoryText]}>
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
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'grid') && styles.selectedViewToggle]} onPress={() => setViewMode('grid')}>
              <LayoutGrid size={20} color={isMode(viewMode, 'grid') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'list') && styles.selectedViewToggle]} onPress={() => setViewMode('list')}>
              <List size={20} color={isMode(viewMode, 'list') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleButton, isMode(viewMode, 'swipe') && styles.selectedViewToggle]} onPress={() => setViewMode('swipe')}>
              <Heart size={20} color={isMode(viewMode, 'swipe') ? '#007AFF' : '#333'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sortButton} onPress={handlePresentModalPress}>
            <ChevronDown size={20} color="#333" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Main Content Area */}
      {(loading && listings.length === 0) ? ( // Show general loading indicator only if no listings are present yet
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text> 
          {/* You could add an ActivityIndicator here */}
        </View>
      ) : (
        <View style={[styles.contentContainer, isMode(viewMode, 'swipe') && styles.swipeContentContainer]}>
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
              isServiceListing={isServiceListing}
              renderServiceProvider={renderServiceProvider}
              hasHousingGroup={hasHousingGroup}
              onCardTap={handleCardTap}
              favorites={favorites}
              onShare={(item: ListingItem) => { // Explicitly type item
                 const itemTypeForShare = isHousingListing(item) ? 'housing_listing' : 'service_provider';
                 const itemIdForShare = itemTypeForShare === 'service_provider' ? (item as Service).provider?.id : item.id;
                 const itemTitleForShare = itemTypeForShare === 'service_provider' ? (item as Service).provider?.business_name : item.title;

                 if (itemIdForShare) {
                    setShareModalVisible(true);
                    setShareItem({
                        itemId: itemIdForShare,
                        itemType: itemTypeForShare as ShareItemType,
                        itemTitle: itemTitleForShare,
                        itemImageUrl: getItemImage(item),
                    });
                 }
              }}
            />
          )}
        </View>
      )}
      
      {/* Share Modal */}
      {shareItem && (
        <ShareItemModal
            isVisible={shareModalVisible}
            onClose={() => { setShareModalVisible(false); setShareItem(null); }}
            itemId={shareItem.itemId!}
            itemType={shareItem.itemType}
            itemTitle={shareItem.itemTitle}
            itemImageUrl={shareItem.itemImageUrl}
            onShare={handleShare}
            currentUser={session?.user ?? null}
        />
      )}

      {/* Bottom Sheet Modal for Sorting */} 
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />)}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
        backgroundStyle={{ backgroundColor: '#fff' }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Sort By</Text>
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
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { flex: 1 },
  swipeContentContainer: {
    flex: 1, paddingHorizontal: 0, paddingBottom: 0, marginBottom: 0,
    width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', alignItems: 'center', gap: 10,
  },
  searchBar: {
    flex: 1, height: 40, backgroundColor: '#f1f1f1', borderRadius: 20,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: '#333' },
  clearSearch: { padding: 4 },
  filterButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryContainer: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12,
  },
  categoryScrollContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  categoryButton: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f1f1f1', flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  selectedCategory: { backgroundColor: '#007AFF' },
  categoryText: { fontSize: 14, color: '#333' },
  selectedCategoryText: { color: '#FFF' },
  viewToggleContainer: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    paddingHorizontal: 16, backgroundColor: '#fff', marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center',
  },
  swipeViewToggleContainer: { // Used when viewMode is 'swipe'
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    paddingHorizontal: 16, backgroundColor: '#fff', alignItems: 'center',
    // No marginBottom or borderBottom for swipe specific container if it's sticky at top
  },
  viewToggleGroup: {
    flexDirection: 'row', borderRadius: 20, borderWidth: 1, borderColor: '#ddd', padding: 2,
  },
  viewToggleButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 }, // Increased padding for better touch
  selectedViewToggle: {
    backgroundColor: '#eef6ff', // Lighter blue for selection
    // shadowColor: '#007AFF',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
    // elevation: 2,
  },
  sortButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  servicesGrid: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }, // Adjusted padding
  servicesList: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 16 }, // Consistent padding
  gridColumnWrapper: { justifyContent: 'space-between', paddingHorizontal: 4 }, // Add horizontal padding for gap
  serviceCardTouchable: {
    marginBottom: 12, // Gap between rows
    width: (width - 24 - 8) / 2, // (width - (gridPadding*2) - columnWrapperPadding*2 - gapBetween) / 2 
                                // Assuming servicesGrid paddingHorizontal is 8, columnWrapper is 4 per side
    // flex: 0.5, margin: 4, // Alternative flex based sizing
  },
  serviceCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  
  // LIST VIEW ITEM STYLES - MODERNIZED
  serviceListItemTouchable: { 
    marginHorizontal: 16, // More horizontal margin for a floating card feel
    marginBottom: 16, // Increased bottom margin
  }, 
  serviceListItemCard: { // Style for the ShadowCard component itself in list view
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12, // Existing border radius
    // overflow: 'hidden', // ShadowCard might handle overflow or need it for shadow
    padding: 12,
    alignItems: 'center', // Vertically align items in the row
    height: 124, // Added height property
  },
  listImageContainer: { 
    position: 'relative', 
    width: 100, // Increased image size
    height: 100, // Increased image size
    backgroundColor: '#f0f0f0', 
    borderRadius: 8, 
    overflow: 'hidden',
    marginRight: 12, // Added margin to separate from text content
  },
  listImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  ndisBadgeList: { 
    position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 1,
  },
  ndisBadgeTextList: { // Specific text style for NDIS badge in list if needed
    fontSize: 10, fontWeight: '500', color: '#fff', marginLeft: 3 
  },
  sdaBadgeList: { 
    position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 1,
  },
  sdaBadgeTextList: { // Specific text style for SDA badge in list if needed
    fontSize: 10, fontWeight: '500', color: '#fff', marginLeft: 3 
  },
  listTextContentContainer: {
    flex: 1, // Takes remaining space
    justifyContent: 'space-between', // Distribute space for title, desc, price
    // paddingHorizontal: 12, // Space from image and actions - removed as image container has margin right
    height: '100%', // Ensure it takes full height of the card for price alignment
  },
  listServiceTitle: {
    fontSize: 16, // Increased size
    fontWeight: '600', // Slightly less than bold to differentiate from price or more prominent elements
    color: '#1F2937', // Darker, more modern text color
    marginBottom: 4,
  },
  listProviderInfoContainer: { // Container for provider name and verification badge
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  // Ensure providerName style inside renderServiceProvider is updated or a new style is used e.g. listProviderName
  // providerName: { fontSize: 13, color: '#6B7280', flexShrink: 1 }, // Example for listProviderName
  listServiceDescription: {
    fontSize: 13,
    color: '#4B5563', // Softer color
    lineHeight: 18,
    marginBottom: 8,
    flexShrink: 1, // Allow description to shrink if needed
  },
  listPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 'auto', // Pushes price to the bottom - adjusted with flex in parent
  },
  listPriceIcon: {
    marginRight: 5,
  },
  listServicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937', // Changed to dark black
  },
  listActionsContainer: {
    justifyContent: 'space-around', // Or 'flex-start' / 'flex-end' depending on desired alignment
    alignItems: 'center', // Vertically center action items
    paddingLeft: 8, // Space from text content
    height: '100%', // Make actions container take full height for vertical alignment of icons
  },
  listActionButton: {
    padding: 8, // Touch area for icons
    // marginBottom: 8, // If stacking icons vertically and needing space between them
  },
  // END LIST VIEW ITEM STYLES

  // START HOUSING LIST ITEM STYLES
  listItemInnerHousing: {
    flexDirection: 'row',
    padding: 12,
    // backgroundColor: 'white', // Handled by ShadowCard
    // borderRadius: 12, // Handled by ShadowCard
  },
  listItemImageContainer: {
    width: 100,
    height: '100%', // Make image container take full height of content or fixed height
    minHeight: 120, // Ensure a minimum height for the image section
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6', // Placeholder bg
    position: 'relative', // For GroupMatchIcon
  },
  listItemImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
  },
  listItemImageHousing: { 
    width: 100, // Fixed width for the image part of the card
    height: 80, // Match the ShadowCard height to fill vertically
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#E5E7EB', // Placeholder color
  },
  groupMatchBadgeList: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'transparent', // Removed white background
    padding: 4,
    borderRadius: 10,
  },
  listItemContentHousing: {
    flex: 1,
    justifyContent: 'space-between', // Distribute content vertically
  },
  listItemTitleHousing: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  listItemAddressHousing: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },
  listItemFeaturesHousing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow features to wrap if too many
    marginBottom: 6,
  },
  listItemFeatureItemHousing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4, // For wrapping
  },
  listItemFeatureTextHousing: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4,
  },
  listItemPriceHousing: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 'auto', // Pushes price to the bottom if container has flex
  },
  listItemActionsContainerHousing: {
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingLeft: 8, 
    // backgroundColor: 'pink', // for debugging
  },
  listItemShadowCard: {
    marginHorizontal: 16, // Consistent with grid cards horizontal margin if using ShadowCard defaults
    marginVertical: 8, // Add some vertical spacing between list items
    // backgroundColor: '#FFFFFF', // ShadowCard likely handles this
  },
  // END HOUSING LIST ITEM STYLES

  imageContainer: { position: 'relative', width: '100%', backgroundColor: '#f0f0f0' }, // Added BG for image loading
  serviceImage: { // Restored for grid view
    width: '100%', 
    height: 140, 
    resizeMode: 'cover',
  },
  serviceDetails: { padding: 12 }, // Consistent padding
  serviceTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4, color: '#111' },
  providerContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4, flexShrink: 1 },
  providerName: { fontSize: 13, color: '#666', flexShrink: 1 },
  serviceDescription: { fontSize: 12, color: '#777', marginBottom: 6, lineHeight: 16 },
  serviceFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 'auto', 
    paddingTop: 4, // Reduced padding top to save space
  },
  priceContainer: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 4 }, // Added flexShrink and marginRight
  priceIcon: { marginRight: 5, color: '#666' },
  servicePrice: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' }, // Changed to dark black
  ndisBadge: { 
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, zIndex: 1,
  },
  ndisBadgeText: { fontSize: 10, fontWeight: '500', color: '#fff', marginLeft: 2 },
  sdaBadge: { 
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, zIndex: 1,
  },
  sdaBadgeText: { fontSize: 10, fontWeight: '500', color: '#fff', marginLeft: 2 },
  favButton: { 
    position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1,
  },
  shareButtonGrid: {
    padding: 8, // Increased padding for better touch area
    marginLeft: 4, // Added margin to separate from price if they get close
  },
  groupMatchBadge: { // Style for GroupMatchBadge in grid view
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFD700', // Gold as an example
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMatchBadgeText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center' },
  bottomSheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  bottomSheetTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center', color: '#333' },
  sortOptionButton: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});