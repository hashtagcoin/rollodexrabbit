import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// Generalized type for friend profile data
interface FriendProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
}

export type ShareItemType = 'group_event' | 'service_provider' | 'housing_listing' | 'housing_group' | 'post';

interface ShareItemModalProps {
  isVisible: boolean;
  onClose: () => void;
  itemId: string | null;
  itemType: ShareItemType;
  currentUser: User | null;
  onShare: (itemId: string, itemType: ShareItemType, selectedFriendIds: string[]) => void;
  itemTitle?: string;
  itemImageUrl?: string;
  modalTitle?: string;
}

const ShareItemModal: React.FC<ShareItemModalProps> = ({
  isVisible,
  onClose,
  itemId,
  itemType,
  currentUser,
  onShare,
  itemTitle,
  itemImageUrl,
  modalTitle,
}) => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    if (isVisible && itemId && currentUser) {
      fetchFriends();
      setSelectedFriendIds([]);
      setSearchText('');
    } else if (!isVisible) {
      setFriends([]);
    }
  }, [isVisible, itemId, currentUser]);

  const fetchFriends = async () => {
  if (!currentUser) return;
  setIsLoadingFriends(true);
  setFriends([]);
  try {
    // Step 1: Fetch all accepted relationships where current user is requester or addressee
    const { data: relationships, error: relError } = await supabase
      .from('user_relationships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .eq('status', 'accepted');
    if (relError) throw relError;
    if (!relationships || relationships.length === 0) {
      setFriends([]);
      setIsLoadingFriends(false);
      return;
    }
    // Step 2: Extract friend IDs (the other user in each relationship)
    const friendIds = relationships.map((rel: any) =>
      rel.requester_id === currentUser.id ? rel.addressee_id : rel.requester_id
    );
    if (friendIds.length === 0) {
      setFriends([]);
      setIsLoadingFriends(false);
      return;
    }
    // Step 3: Fetch friend profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', friendIds);
    if (profilesError) throw profilesError;
    setFriends(profiles || []);
  } catch (error) {
    console.error('Error fetching friends:', error);
    Alert.alert('Error', 'Could not load friends list.');
    setFriends([]);
  } finally {
    setIsLoadingFriends(false);
  }
};

  const handleShare = () => {
    if (!itemId || selectedFriendIds.length === 0) {
      Alert.alert('Select at least one friend to share with.');
      return;
    }
    onShare(itemId, itemType, selectedFriendIds);
    onClose();
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter((friend) => {
    const search = searchText.toLowerCase();
    return (
      friend.full_name?.toLowerCase().includes(search) ||
      friend.username?.toLowerCase().includes(search)
    );
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessible
      accessibilityViewIsModal
      accessibilityLabel="Share Item Modal"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{modalTitle || 'Share with Friends'}</Text>
          {itemImageUrl && (
            <Image source={{ uri: itemImageUrl }} style={styles.itemImage} />
          )}
          {itemTitle && <Text style={styles.itemTitle}>{itemTitle}</Text>}
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            value={searchText}
            onChangeText={setSearchText}
            accessible
            accessibilityLabel="Search friends"
          />
          {isLoadingFriends ? (
            <Text>Loading friends...</Text>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendRow,
                    selectedFriendIds.includes(item.id) && styles.friendRowSelected,
                  ]}
                  onPress={() => toggleFriendSelection(item.id)}
                  accessible
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedFriendIds.includes(item.id) }}
                  accessibilityLabel={`Select friend ${item.full_name || item.username}`}
                >
                  <Image
                    source={{ uri: item.avatar_url || undefined }}
                    style={styles.avatar}
                  />
                  <Text style={styles.friendName}>{item.full_name || item.username}</Text>
                  {selectedFriendIds.includes(item.id) && <Text>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text>No friends found.</Text>}
            />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share">
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    minHeight: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendRowSelected: {
    backgroundColor: '#e6f7ff',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  friendName: {
    flex: 1,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  shareButtonText: {
    fontWeight: '600',
    color: '#fff',
  },
});

export default ShareItemModal;
