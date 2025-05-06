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
import { supabase } from '../lib/supabase'; // Assuming supabase client is here
import { User } from '@supabase/supabase-js'; // For current user type

// Define a type for friend profile data (adjust as needed based on your user_profiles table)
interface FriendProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
}

interface SharePostModalProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string | null;
  onShare: (postId: string, selectedFriendIds: string[]) => void;
  currentUser: User | null;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  isVisible,
  onClose,
  postId,
  onShare,
  currentUser,
}) => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Fetch friends when the modal becomes visible and postId is valid
  useEffect(() => {
    if (isVisible && postId && currentUser) {
      fetchFriends(); // Call the actual fetch function
      console.log('Modal visible for post:', postId, 'User:', currentUser.id);
      // Reset state for new share session
      setSelectedFriendIds([]);
      setSearchText('');
    } else if (!isVisible) {
      setFriends([]); // Clear friends when modal is hidden to refresh on next open
    }
  }, [isVisible, postId, currentUser]);

  const fetchFriends = async () => {
    if (!currentUser) return;
    setIsLoadingFriends(true);
    setFriends([]); // Clear previous friends

    try {
      // Step 1: Fetch relationships where the current user is involved and status is 'accepted'
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

      // Step 2: Extract friend IDs
      const friendIds = relationships.map(rel => 
        rel.requester_id === currentUser.id ? rel.addressee_id : rel.requester_id
      );
      
      if (friendIds.length === 0) {
        setFriends([]);
        setIsLoadingFriends(false);
        return;
      }

      // Step 3: Fetch profiles of these friends
      // Assuming user_profiles table has id, full_name, avatar_url, username
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

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendIds(prevSelected =>
      prevSelected.includes(friendId)
        ? prevSelected.filter(id => id !== friendId)
        : [...prevSelected, friendId]
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleConfirmShare = () => {
    if (!postId) {
      Alert.alert('Error', 'No post selected to share.');
      return;
    }
    if (selectedFriendIds.length === 0) {
      Alert.alert('Select Friends', 'Please select at least one friend to share with.');
      return;
    }
    onShare(postId, selectedFriendIds);
    onClose(); // Close modal after sharing
  };

  if (!isVisible || !postId) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            value={searchText}
            onChangeText={setSearchText}
          />

          {isLoadingFriends ? (
            <Text style={styles.loadingText}>Loading friends...</Text>
          ) : filteredFriends.length === 0 && !isLoadingFriends ? (
            <Text style={styles.emptyText}>No friends found. Add friends to share posts!</Text>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriendIds.includes(item.id) && styles.friendItemSelected,
                  ]}
                  onPress={() => handleSelectFriend(item.id)}
                >
                  <Image
                    source={item.avatar_url ? { uri: item.avatar_url } : require('../assets/rollodex-icon-lrg.png')} // Ensure you have a default avatar
                    style={styles.avatar}
                  />
                  <Text style={styles.friendName}>{item.full_name || item.username || 'Unnamed Friend'}</Text>
                  {selectedFriendIds.includes(item.id) && (
                    <Text style={styles.checkMark}>✓</Text> // Simple checkmark
                  )}
                </TouchableOpacity>
              )}
              style={styles.listContainer}
            />
          )}

          <TouchableOpacity
            style={[styles.sendButton, selectedFriendIds.length === 0 && styles.sendButtonDisabled]}
            onPress={handleConfirmShare}
            disabled={selectedFriendIds.length === 0}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%', // Limit height
    minHeight: Platform.OS === 'ios' ? '50%' : '60%', // Ensure enough space for keyboard on Android
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#888',
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  listContainer: {
    flexGrow: 1, // Allows list to take available space before send button
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendItemSelected: {
    backgroundColor: '#e0f7fa', // Light blueish background for selected item
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc', // Default background if no avatar_url
  },
  friendName: {
    fontSize: 16,
    flex: 1, // Allow name to take up space
  },
  checkMark: {
    fontSize: 18,
    color: 'green',
    marginLeft: 'auto',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default SharePostModal;
