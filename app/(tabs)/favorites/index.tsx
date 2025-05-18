import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Pressable, TouchableOpacity } from 'react-native';
import { Link, LinkProps } from 'expo-router';
import { X as XIcon, Share2 as Share2Icon } from 'lucide-react-native'; 
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import AppHeader from '../../../components/AppHeader';
import SharePostModal from '../../../components/SharePostModal'; 
import { User } from '@supabase/supabase-js'; 

interface FavoriteItem {
  favorite_id: string; 
  item_id: string;
  item_type: 'group_event' | 'service_provider' | 'housing_listing' | 'housing_group'; 
  item_title: string | null;
  item_description: string | null;
  item_image_url: string | null;
  event_start_time?: string | null;
  provider_abn?: string | null;
  housing_address?: string | null;
  member_status?: 'MEMBER' | 'REQUESTED' | null; 
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [itemToShare, setItemToShare] = useState<FavoriteItem | null>(null);

  const FILTER_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Services', value: 'service_provider' },
    { label: 'Housing', value: 'housing_listing' },
    { label: 'Events', value: 'group_event' },
    { label: 'Housing Groups', value: 'housing_group' }, 
  ];

  useEffect(() => {
    if (user) { 
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch basic favorite links (item_id, item_type) for the user
      const { data: basicFavData, error: basicFavError } = await supabase
        .from('favorites')
        .select('favorite_id, item_id, item_type')
        .eq('user_id', user.id);

      if (basicFavError) throw basicFavError;
      if (!basicFavData) throw new Error('No basic favorite data returned.');

      // 2. Prepare promises to fetch details for each favorite type
      const detailPromises = basicFavData.map(async (fav) => {
        let details: Partial<FavoriteItem> | null = null;
        try {
          switch (fav.item_type) {
            case 'service_provider':
              const { data: spData, error: spError } = await supabase
                .from('service_providers')
                .select('id, business_name, business_description, logo_url, abn')
                .eq('id', fav.item_id)
                .maybeSingle(); // Use maybeSingle in case item was deleted
              if (spError) console.error(`Error fetching SP ${fav.item_id}:`, spError);
              if (spData) {
                details = {
                  item_title: spData.business_name,
                  item_description: spData.business_description,
                  item_image_url: spData.logo_url,
                  provider_abn: spData.abn,
                };
              }
              break;
            case 'housing_group':
              // Fetch group details (including listing_id)
              const { data: hgData, error: hgError } = await supabase
                .from('housing_groups')
                .select('id, name, description, listing_id')
                .eq('id', fav.item_id)
                .maybeSingle();
              if (hgError) console.error(`Error fetching Housing Group ${fav.item_id}:`, hgError);
              let mainImageUrl: string | null = null;
              if (hgData && hgData.listing_id) {
                const { data: listingData, error: listingError } = await supabase
                  .from('housing_listings')
                  .select('media_urls')
                  .eq('id', hgData.listing_id)
                  .maybeSingle();
                if (listingError) console.error(`Error fetching housing listing for group ${fav.item_id}:`, listingError);
                if (listingData && Array.isArray(listingData.media_urls) && listingData.media_urls.length > 0) {
                  mainImageUrl = listingData.media_urls[0];
                }
              }
              if (hgData) {
                details = {
                  item_title: hgData.name,
                  item_description: hgData.description,
                  item_image_url: mainImageUrl,
                };
              }
              break;
            case 'housing_listing':
              const { data: hlData, error: hlError } = await supabase
                .from('housing_listings')
                .select('id, description, media_urls, address, suburb, state, postcode')
                .eq('id', fav.item_id)
                .maybeSingle();
              if (hlError) console.error(`Error fetching HL ${fav.item_id}:`, hlError);
              if (hlData) {
                const formattedAddress = `${hlData.address || ''}, ${hlData.suburb || ''}, ${hlData.state || ''} ${hlData.postcode || ''}`.replace(/^, |, $/g, '').replace(/, ,/g, ',');
                details = {
                  item_title: formattedAddress,
                  item_description: hlData.description,
                  item_image_url: hlData.media_urls && hlData.media_urls.length > 0 ? hlData.media_urls[0] : null,
                  housing_address: formattedAddress,
                };
              }
              break;
            case 'group_event':
              const { data: geData, error: geError } = await supabase
                .from('group_events') 
                .select('id, title, description, image_url, start_time') 
                .eq('id', fav.item_id)
                .maybeSingle();
              if (geError) console.error(`Error fetching Event ${fav.item_id}:`, geError);
              if (geData) {
                details = {
                  item_title: geData.title, 
                  item_description: geData.description,
                  item_image_url: geData.image_url, 
                  event_start_time: geData.start_time,
                };
              }
              break;
            default:
              console.warn(`Unhandled favorite item type: ${fav.item_type}`);
          }
        } catch (promiseError) {
            console.error(`Error in detail promise for ${fav.item_id} (${fav.item_type}):`, promiseError);
        }

        // Return the combined basic info + fetched details, or null if details failed
        if (details) {
          return {
            favorite_id: fav.favorite_id,
            item_id: fav.item_id,
            item_type: fav.item_type,
            ...details,
          } as FavoriteItem; // Asserting the structure matches
        } else {
          console.warn(`Could not fetch details for favorite ${fav.favorite_id} (Item ID: ${fav.item_id}, Type: ${fav.item_type}). It might have been deleted.`);
          return null; // Indicate failure to fetch details
        }
      });

      // 3. Fetch housing group memberships (status and group_id only)
      const { data: groupMemberData, error: groupMemberError } = await supabase
        .from('group_members')
        .select('group_id, role') // Changed status to role
        .eq('user_id', user.id)
        .in('role', ['MEMBER', 'REQUESTED']); // Changed status to role and values

      if (groupMemberError) throw groupMemberError;

      let housingGroupFavorites: FavoriteItem[] = [];
      if (groupMemberData && groupMemberData.length > 0) {
        // Extract unique group IDs
        const groupIds = [...new Set(groupMemberData.map(gm => gm.group_id))];

        // 3b. Fetch details for these groups directly
        const { data: groupDetailsData, error: groupDetailsError } = await supabase
          .from('groups')
          .select('id, name, description, group_image_url') // Use the confirmed column name
          .in('id', groupIds);

        if (groupDetailsError) throw groupDetailsError;

        // Create a map for easy lookup
        const groupDetailsMap = new Map(groupDetailsData?.map(gd => [gd.id, gd]) || []);

        // Combine member status with group details
        housingGroupFavorites = groupMemberData
          .map((membership) => {
            const groupDetails = groupDetailsMap.get(membership.group_id);
            if (!groupDetails) {
              console.warn(`Could not find details for group ID: ${membership.group_id}`);
              return null; // Skip if group details weren't found
            }
            return {
              favorite_id: `group-${membership.group_id}`, // Unique-ish ID
              item_id: groupDetails.id,
              item_type: 'housing_group',
              item_title: groupDetails.name,
              item_description: groupDetails.description,
              item_image_url: groupDetails.group_image_url, // Use the confirmed name
              member_status: membership.role as 'MEMBER' | 'REQUESTED', // Changed membership.status to membership.role and updated type assertion
            };
          })
          .filter(Boolean) as FavoriteItem[]; // Filter out nulls
      }

      // 4. Resolve standard favorite detail promises and combine results
      const detailedFavoritesResults = await Promise.all(detailPromises);
      const validDetailedFavorites = detailedFavoritesResults.filter(Boolean) as FavoriteItem[]; // Filter out nulls

      const combinedFavorites = [...validDetailedFavorites, ...housingGroupFavorites];
      combinedFavorites.sort((a, b) => (a.item_title ?? '').localeCompare(b.item_title ?? ''));

      setFavorites(combinedFavorites);

    } catch (err) {
      console.error('Error fetching favorites:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to load favorites: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteIdToRemove: string, itemType: string) => {
    if (itemType === 'housing_group') {
      console.log('Removing housing group memberships must be done elsewhere.');
      return;
    }

    if (!user) {
      console.error('Cannot remove favorite: User not logged in.');
      return;
    }

    const originalFavorites = [...favorites];
    setFavorites(prevFavorites => prevFavorites.filter(fav => fav.favorite_id !== favoriteIdToRemove));

    try {
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .match({ favorite_id: favoriteIdToRemove, user_id: user.id });

      if (deleteError) {
        console.error('Error removing favorite from Supabase:', deleteError);
        setFavorites(originalFavorites);
        setError('Failed to remove favorite. Please try again.');
      } else {
        console.log(`Favorite ${favoriteIdToRemove} removed successfully.`);
      }
    } catch (err) {
      console.error('Exception removing favorite:', err);
      setFavorites(originalFavorites);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to remove favorite: ${errorMessage}`);
    }
  };

  const handleOpenShareModal = (item: FavoriteItem) => {
    setItemToShare(item);
    setIsShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalVisible(false);
    setItemToShare(null);
  };

  const handleConfirmShareFavorite = (postId: string, selectedFriendIds: string[]) => {
    if (!itemToShare || !user) {
      console.error('No item to share or user not available.');
      handleCloseShareModal();
      return;
    }
    console.log(`Sharing favorite item ID: ${itemToShare.item_id} (Type: ${itemToShare.item_type}, Title: ${itemToShare.item_title}) with friends:`, selectedFriendIds);
    handleCloseShareModal();
  };

  const filteredFavorites = useMemo(() => {
    if (activeFilter === 'all') {
      return favorites;
    }
    return favorites.filter(item => item.item_type === activeFilter);
  }, [favorites, activeFilter]);

  // TypeScript/Expo Router workaround: use double cast to satisfy strict literal route types
const getLinkHref = (item: FavoriteItem): LinkProps['href'] => {
  switch (item.item_type) {
    case 'service_provider':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { pathname: '/(tabs)/discover/[id]', params: { id: item.item_id, goBackPath: '/(tabs)/favorites' } } as unknown as LinkProps['href'];
    case 'housing_listing':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { pathname: '/(tabs)/housing/[id]', params: { id: item.item_id, goBackPath: '/(tabs)/favorites' } } as unknown as LinkProps['href'];
    case 'group_event':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { pathname: '/(tabs)/community/event/[id]', params: { id: item.item_id, goBackPath: '/(tabs)/favorites' } } as unknown as LinkProps['href'];
    case 'housing_group':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { pathname: '/(tabs)/housing/group/[id]', params: { id: item.item_id, goBackPath: '/(tabs)/favorites' } } as unknown as LinkProps['href'];
    default:
      console.warn(`Unhandled favorite item type for linking: ${item.item_type}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { pathname: '/(tabs)/favorites' } as unknown as LinkProps['href'];
  }
};

  const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
  const [pendingToCancel, setPendingToCancel] = useState<FavoriteItem | null>(null);

  const handlePendingCancel = (item: FavoriteItem) => {
    setPendingToCancel(item);
    setPendingDialogVisible(true);
  };

  const confirmPendingCancel = async () => {
    if (!pendingToCancel || !user) return;
    try {
      // Remove from housing_group_members where group_id = item_id, user_id = user.id, status = 'pending' or 'REQUESTED'
      const { error } = await supabase
        .from('housing_group_members')
        .delete()
        .match({ group_id: pendingToCancel.item_id, user_id: user.id })
        .in('status', ['pending', 'REQUESTED']);
      if (error) throw error;
      setFavorites(prev => prev.filter(fav => fav.item_id !== pendingToCancel.item_id));
    } catch (err) {
      console.error('Error cancelling join request:', err);
      setError('Failed to cancel join request. Please try again.');
    } finally {
      setPendingDialogVisible(false);
      setPendingToCancel(null);
    }
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => {
    const isHousingGroup = item.item_type === 'housing_group';
    // member_status can be 'MEMBER' | 'REQUESTED' | null, but not 'pending'.
    const isPending = isHousingGroup && item.member_status === 'REQUESTED';
    // Only show 'Favourited' if not pending
    const showFavourited = isHousingGroup && !isPending && !item.member_status;
    const linkHref = getLinkHref(item);
    return (
      <View style={styles.cardOuterContainer}>
        {/* Compact, rounded, absolutely positioned status badge top-right */}
        {isHousingGroup && (isPending || showFavourited) && (
          <View style={styles.statusBadgeContainer}>
            {isPending ? (
              <TouchableOpacity onPress={() => handlePendingCancel(item)} activeOpacity={0.7}>
                <View style={[styles.statusBadge, { backgroundColor: '#fbbf24' }]}> 
                  <Text style={styles.statusBadgeText}>Pending</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#38bdf8' }]}> 
                <Text style={styles.statusBadgeText}>Favourited</Text>
              </View>
            )}
          </View>
        )}
        <Link href={linkHref} asChild>
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
              {/* Remove old status subtitle for housing_group */}
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
        {item.item_type !== 'housing_group' && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item.favorite_id, item.item_type)}
          >
            <XIcon color="#000" size={18} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={() => handleOpenShareModal(item)}
        >
          <Share2Icon color="#000" size={18} />
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
        keyExtractor={item => item.favorite_id}
        contentContainerStyle={styles.listContentContainer}
      />
      {itemToShare && user && (
        <SharePostModal
          isVisible={isShareModalVisible}
          onClose={handleCloseShareModal}
          modalTitle="Share Favourite"
          postId={itemToShare.item_id} 
          currentUser={{ id: user.id } as User}
          onShare={handleConfirmShareFavorite}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  statusBadge: {
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 10,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadgeText: {
    fontWeight: '600',
    color: '#222',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  cardOuterContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    position: 'relative', 
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 15,
    zIndex: 10, 
  },
  shareButton: { 
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007bff',
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
