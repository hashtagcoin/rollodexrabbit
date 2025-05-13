import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import SharePostModal from '../../../components/SharePostModal';
import { User } from '@supabase/supabase-js';

// Expo Router screen options
export const options = {
  headerShown: false, // Hide the default navigator header
};

// Define EventCategory type
type EventCategory = 'Interest' | 'Social' | 'Support' | 'Housing';
const ALL_CATEGORIES: (EventCategory | 'All')[] = ['All', 'Interest', 'Social', 'Support', 'Housing'];

// Define a placeholder for the location structure until clarified
// Example: type EventLocation = { address?: string; city?: string; venue?: string; coordinates?: { lat: number; lng: number } };
type EventLocation = {
  full_address?: string | null;
  city?: string | null;
} | null;

type Event = {
  id: string;
  group_id: string;
  subgroup_id?: string | null;
  title: string;
  description?: string | null;
  start_time: string; // Changed from event_date, timestamptz from Supabase comes as string
  end_time?: string | null;
  location?: EventLocation;
  max_participants?: number | null;
  created_by?: string | null; // Assuming this is a UUID referring to user_profiles.id
  image_url?: string | null; // Added new image_url field
  group_name?: string; // This is an enrichment, keep it
  creator_name?: string | null; // Restored field for creator's name
  category?: EventCategory | null; // Added category field
  admission_fee?: string | null; // Changed from number | null to string | null
  participants_going_count?: number | null; // Changed from attendee_count
};

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All'); // Added state for selected category
  const [favoritedEventIds, setFavoritedEventIds] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // State for user ID

  // State for Share Modal
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [eventToShare, setEventToShare] = useState<Event | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching user session:', error);
        setCurrentUserId(null); 
      } else if (session?.user) {
        setCurrentUserId(session.user.id); // Set the user ID string
      } else {
        setCurrentUserId(null); // No user logged in
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUserId) { // Check state variable now
        setFavoritesLoading(false);
        setFavoritedEventIds(new Set()); // Clear favorites if no user
        return; // No user logged in
      }
      setFavoritesLoading(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('item_id')
          .eq('user_id', currentUserId)
          .eq('item_type', 'group_event');

        if (error) {
          console.error('Error fetching favorites:', error);
        } else {
          const ids = new Set(data.map(fav => fav.item_id));
          setFavoritedEventIds(ids);
        }
      } catch (e) {
        console.error('Exception fetching favorites:', e);
      } finally {
        setFavoritesLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUserId]); // Re-fetch if user changes

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('group_events_with_details') // Assuming this view exists and includes category, or adjust to 'group_events'
        .select(`
          id,
          group_id,
          title,
          description,
          start_time,
          end_time,
          location,
          max_participants,
          created_by,
          image_url,
          group_name,
          category,
          admission_fee,
          participants_going_count
        `)
        .order('start_time', { ascending: true });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setLoading(false);
      } else {
        console.log('Fetched events:', data);
        const fetchedEvents = (data as Event[]) || [];
        setEvents(fetchedEvents); // Set initial events without creator names
        setLoading(false);
        fetchAndMapCreatorNames(fetchedEvents);
      }
    } catch (e) {
      console.error('Exception fetching events:', e);
      setEvents([]);
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  const fetchAndMapCreatorNames = async (eventsData: Event[]) => {
    const creatorIds = [ // Get unique, non-null creator IDs
      ...new Set(eventsData.map(event => event.created_by).filter(id => id !== null))
    ] as string[];

    if (creatorIds.length === 0) {
      return; // No creator IDs to fetch
    }

    try {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', creatorIds);

      if (profileError) {
        console.error('Error fetching creator profiles:', profileError);
        return; // Don't crash, just skip augmenting names
      }

      const creatorNameMap = new Map<string, string>();
      profiles?.forEach(profile => {
        if (profile.id && profile.full_name) {
          creatorNameMap.set(profile.id, profile.full_name);
        }
      });

      // Update the events state with the fetched names
      setEvents(prevEvents => 
        prevEvents.map(event => ({
          ...event,
          creator_name: event.created_by ? creatorNameMap.get(event.created_by) || 'Unknown Creator' : 'Unknown Creator'
        }))
      );

    } catch (e) {
      console.error('Exception fetching/mapping creator names:', e);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (eventId: string) => {
    if (!currentUserId || favoritesLoading) return; // Check state variable now

    const isCurrentlyFavorited = favoritedEventIds.has(eventId);
    const originalFavorites = new Set(favoritedEventIds);

    // Optimistic UI update
    const updatedFavorites = new Set(favoritedEventIds);
    if (isCurrentlyFavorited) {
      updatedFavorites.delete(eventId);
    } else {
      updatedFavorites.add(eventId);
    }
    setFavoritedEventIds(updatedFavorites);

    try {
      if (isCurrentlyFavorited) {
        // Delete from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: currentUserId, item_id: eventId, item_type: 'group_event' });
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: currentUserId, item_id: eventId, item_type: 'group_event' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavoritedEventIds(originalFavorites); // Revert on error
    }
  };

  const handleOpenShareModal = (event: Event) => {
    setEventToShare(event);
    setIsShareModalVisible(true);
  };

  const handleConfirmShareEvent = (sharedEventId: string, selectedFriendIds: string[]) => {
    // Placeholder for actual share logic
    console.log(`Event ${sharedEventId} shared with friends: ${selectedFriendIds.join(', ')}`);
    setIsShareModalVisible(false); // Close modal after 'sharing'
  };

  // Function to render category buttons
  const renderCategoryButtons = () => (
    <View style={styles.categoryFilterWrapper}>
      <ScrollView 
        horizontal 
        style={styles.categoryFilterScrollView} 
        contentContainerStyle={styles.filterContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        {ALL_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Events" showBackButton />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Search events by title..." // Updated placeholder for clarity
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      {renderCategoryButtons()}
      <FlatList
        data={events} // Changed from filtered to events
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchEvents}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isFavorited = favoritedEventIds.has(item.id);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                // Navigate to event details if needed - router.push(`/event/${item.id}`);
              }}
            >
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item.id)}
                disabled={favoritesLoading} // Disable while loading initial favorites
              >
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={26} // Slightly larger icon
                  color={isFavorited ? '#FF6347' : '#ccc'} // Tomato color when favorited
                />
              </TouchableOpacity>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder} /> // Placeholder if no image
              )}
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                {item.group_name && item.group_name !== 'N/A' && <Text style={styles.group}>Group: {item.group_name}</Text>}
                <Text style={styles.date}>
                  Date: {new Date(item.start_time).toLocaleDateString()} at {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {item.location?.full_address && (
                  <Text style={styles.location}>Location: {item.location.full_address}</Text>
                )}
                <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
                {item.creator_name && item.creator_name !== 'Unknown Creator' && (
                  <View style={styles.creatorContainer}>
                    <Text style={styles.creatorInfo}>by {item.creator_name}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#4CAF50" style={styles.iconStyle} />
                  <Text style={styles.detailText}>
                    {item.admission_fee && item.admission_fee.replace(/^\$/, '') !== "0" && item.admission_fee.trim() !== ""
                      ? item.admission_fee 
                      : 'Free'}
                  </Text>
                </View>
                {typeof item.participants_going_count === 'number' && (
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#FF9800" style={styles.iconStyle} />
                    <Text style={styles.detailText}>
                      {item.participants_going_count} attending
                      {item.max_participants ? ` / ${item.max_participants}` : ''}
                    </Text>
                  </View>
                )}
              </View>
              {/* Share Button */}
              <TouchableOpacity 
                style={styles.shareIconContainer}
                onPress={() => handleOpenShareModal(item)}
              >
                <Ionicons name="share-social-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.empty}>No events found. Try adjusting your search.</Text>
          )
        }
      />
      
      {/* Use SharePostModal */}
      {eventToShare && currentUserId && (
        <SharePostModal 
          isVisible={isShareModalVisible} 
          onClose={() => setIsShareModalVisible(false)} 
          modalTitle="Share Event" // Custom title for the modal
          postId={eventToShare.id} // Pass event ID as postId (or rename prop in modal if needed)
          onShare={handleConfirmShareEvent} // Pass the new handler
          currentUser={{ id: currentUserId } as User} // Pass currentUser, ensuring it matches User type or cast appropriately
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  search: {
    height: 40,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  categoryFilterWrapper: { 
    height: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center', 
  },
  categoryFilterScrollView: { 
    width: '100%',
    maxHeight: '100%', 
  },
  filterContentContainer: { 
    flexDirection: 'row',
    alignItems: 'center', 
  },
  categoryButton: {
    height: 32, 
    paddingHorizontal: 12, 
    borderRadius: 16, 
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',    
    marginRight: 8,         
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#007bff', 
    borderColor: '#007bff',    
  },
  categoryButtonText: {
    color: '#007bff',          
    fontWeight: '500',
    fontSize: 14,             
    lineHeight: 18, 
  },
  categoryButtonTextSelected: {
    color: '#fff',              
    fontWeight: '500',
    fontSize: 14,             
    lineHeight: 18, 
  },
  list: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    flexGrow: 1 
  },
  card: {
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    position: 'relative', 
  },
  image: {
    width: '100%',
    height: 150, 
    marginBottom: 12,
    backgroundColor: '#eee', 
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    marginBottom: 12,
    backgroundColor: '#e0e0e0', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { 
    padding: 12, 
  },
  shareIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional: light background for icon
    padding: 6,
    borderRadius: 20, // Make it circular
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333' }, 
  group: { fontSize: 14, color: '#555', marginBottom: 4 }, 
  date: { fontSize: 13, color: '#777', marginBottom: 8 }, 
  location: { fontSize: 13, color: '#777', marginBottom: 4 }, 
  creatorContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10, 
  },
  creatorInfo: { 
    fontSize: 13,
    color: '#555',
    marginLeft: 4, 
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconStyle: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
  },
  desc: { fontSize: 14, color: '#444', lineHeight: 20 }, 
  empty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    padding: 6,
    borderRadius: 20, 
  },
});
