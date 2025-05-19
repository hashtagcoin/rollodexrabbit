import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import AppHeader from '../../../components/AppHeader';
import CommunityEntityCard, { CommunityEntityItem } from '../../../components/CommunityEntityCard';
import SharePostModal from '../../../components/SharePostModal'; // Assuming a generic share modal can be used or adapted

type ActiveTab = 'Interest' | 'Events' | 'Housing';

const TABS: { label: ActiveTab; type: CommunityEntityItem['type'] | 'all_interest' }[] = [
  { label: 'Interest', type: 'group' }, 
  { label: 'Events', type: 'group_event' },
  { label: 'Housing', type: 'housing_group' },
];

export default function CommunityGroupsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('Interest');
  const [items, setItems] = useState<CommunityEntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [itemToShare, setItemToShare] = useState<CommunityEntityItem | null>(null);

  const fetchItems = useCallback(async (tab: ActiveTab) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setItems([]);

    let query = '';
    let itemType: CommunityEntityItem['type'] | null = null;
    let rpcName: string | null = null;

    try {
      switch (tab) {
        case 'Interest':
          itemType = 'group';
          // RPC function to fetch groups with favorite status
          rpcName = 'get_groups_with_favorites'; 
          break;
        case 'Events':
          itemType = 'group_event';
          // RPC function to fetch group_events with favorite status
          rpcName = 'get_group_events_with_favorites'; 
          break;
        case 'Housing':
          itemType = 'housing_group';
          // RPC function to fetch housing_groups with favorite status and listing details
          rpcName = 'get_housing_groups_with_favorites'; 
          break;
        default:
          throw new Error('Invalid tab');
      }

      if (!rpcName) throw new Error('RPC function name not set');

      const { data, error: rpcError } = await supabase.rpc(rpcName, { param_user_id: user.id });

      if (rpcError) throw rpcError;

      // Ensure correct mapping for Interest and Housing groups so imageUrl is set properly
      if (tab === 'Interest') {
        const mappedData: CommunityEntityItem[] = (data as any[]).map((rawItem: any) => ({
          ...rawItem,
          imageUrl: rawItem.imageurl, // Map backend imageurl to frontend imageUrl
        }));
        setItems(mappedData);
      } else if (tab === 'Housing') {
        const mappedData: CommunityEntityItem[] = (data as any[]).map((rawItem: any) => ({
          ...rawItem,
          imageUrl: rawItem.imageUrl, // Use backend imageUrl field directly
        }));
        setItems(mappedData);
      } else {
        setItems(data as CommunityEntityItem[]);
      }

    } catch (err: any) {
      console.error(`Error fetching ${tab}:`, err);
      setError(`Failed to fetch ${tab.toLowerCase()}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchItems(activeTab);
      }
    }, [user, activeTab, fetchItems])
  );

  const handleToggleFavorite = async (itemId: string, itemType: CommunityEntityItem['type'], currentIsFavorited: boolean) => {
    if (!user) return;

    // Optimistic UI update
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId && item.type === itemType ? { ...item, isFavorited: !currentIsFavorited } : item
      )
    );

    try {
      if (currentIsFavorited) {
        // Delete from favorites
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);
        if (deleteError) throw deleteError;
      } else {
        // Add to favorites
        const { error: insertError } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      // Revert optimistic update on error
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId && item.type === itemType ? { ...item, isFavorited: currentIsFavorited } : item
        )
      );
      alert(`Failed to update favorite status. ${err.message}`);
    }
  };

  const handleActualShare = async (itemId: string, friendIds: string[]) => {
    if (!itemToShare || !user) {
      console.error('No item to share or user not available');
      return;
    }
    console.log(`Sharing item ${itemId} (type: ${itemToShare.type}) with friends: ${friendIds.join(', ')} by user ${user.id}`);
    // TODO: Implement the actual backend logic for sharing.
    // Example: creating entries in a 'shared_items' or 'notifications' table.
    // const sharesToInsert = friendIds.map(friendId => ({
    //   shared_by_user_id: user.id,
    //   shared_item_id: itemId,
    //   shared_item_type: itemToShare.type,
    //   shared_with_user_id: friendId,
    //   created_at: new Date().toISOString(),
    // }));
    // try {
    //   const { error } = await supabase.from('your_shares_table_name').insert(sharesToInsert);
    //   if (error) throw error;
    //   console.log('Shares successfully created');
    //   // Optionally, provide feedback to the user
    // } catch (err) {
    //   console.error('Failed to save shares:', err);
    //   // Optionally, provide error feedback to the user
    // }
    setIsShareModalVisible(false); // Close the modal after attempting to share
  };

  const handleShare = (item: CommunityEntityItem) => {
    setItemToShare(item);
    setIsShareModalVisible(true);
  };

  const handleCardPress = (item: CommunityEntityItem) => {
    let path: Href | undefined = undefined;

    switch(item.type) {
      case 'group': 
        path = `/community/groups/${item.id}`; 
        break; 
      case 'group_event': 
        path = `/community/event/${item.id}`; 
        break; 
      case 'housing_group': 
        path = `/housing/group/${item.id}?goBackPath=/(tabs)/community/groups`; 
        break; 
      default: 
        console.warn('Unknown item type for navigation in CommunityGroupsScreen:', item.type); 
        return;
    }

    if (path) {
      router.push(path);
    }
  };

  const renderItem = ({ item }: { item: CommunityEntityItem }) => (
    <CommunityEntityCard 
      item={item} 
      onPress={handleCardPress} 
      onToggleFavorite={handleToggleFavorite} 
      onShare={handleShare} 
    />
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Community Groups" showBackButton={router.canGoBack()} />
      
      <View style={styles.tabContainer}>
        {TABS.map(tabInfo => (
          <TouchableOpacity 
            key={tabInfo.label} 
            style={[styles.tabButton, activeTab === tabInfo.label && styles.activeTabButton]}
            onPress={() => setActiveTab(tabInfo.label)}
          >
            <Text style={[styles.tabButtonText, activeTab === tabInfo.label && styles.activeTabButtonText]}>
              {tabInfo.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {!loading && !error && items.length === 0 && (
        <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found.</Text>
      )}

      {!loading && !error && items.length > 0 && (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
      {itemToShare && (
        <SharePostModal
            isVisible={isShareModalVisible}
            onClose={() => setIsShareModalVisible(false)}
            postId={itemToShare.id} 
            onShare={handleActualShare} 
            currentUser={user}
            modalTitle={`Share ${itemToShare.type.replace('_', ' ')}`} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
    marginHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
  listContentContainer: {
    paddingBottom: 16, // Ensure space for last item's shadow
  },
});
