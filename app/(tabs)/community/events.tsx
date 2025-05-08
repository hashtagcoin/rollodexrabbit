import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';
import { useRouter } from 'expo-router';

// Expo Router screen options
export const options = {
  headerShown: false,
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
  admission_fee?: string | null; // Added admission_fee
  group_name?: string; // This is an enrichment, keep it
  creator_name?: string | null; // New field for creator's name
  creator_avatar_url?: string | null; // New field for creator's avatar
  category?: EventCategory | null; // Added category field
};

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All'); // Added state for selected category

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedCategory]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('group_events_with_details') // Assuming this view exists and includes category, or adjust to 'group_events'
        .select(`
          id,
          group_id,
          subgroup_id,
          title,
          description,
          start_time,
          end_time,
          location,
          max_participants,
          created_by,
          image_url,
          admission_fee,
          group_name,
          creator_name,
          creator_avatar_url,
          category
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
        // Handle error (e.g., show a message to the user)
        setEvents([]);
      } else {
        console.log('Fetched events:', data);
        // Map data to Event type if necessary, ensuring category is correctly typed
        setEvents(data as Event[] || []);
      }
    } catch (e) {
      console.error('Exception fetching events:', e);
      setEvents([]);
    }
    setLoading(false);
  };

  // Function to render category buttons
  const renderCategoryButtons = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
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
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Events" showBackButton />
      <TextInput
        style={styles.search}
        placeholder="Search events by title..." // Updated placeholder for clarity
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {renderCategoryButtons()} {/* Add category buttons here */}
      <FlatList
        data={events} // Changed from filtered to events
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchEvents}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          console.log(`Rendering event: ${item.title}, event_image_url: ${item.image_url}, creator_avatar_url: ${item.creator_avatar_url}`);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                // Navigate to event details if needed - router.push(`/event/${item.id}`);
              }}
            >
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.eventImage} resizeMode="cover" />
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
                {item.admission_fee && (
                  <Text style={styles.admissionFee}>Admission: {item.admission_fee}</Text>
                )}
                <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
                {item.creator_name && item.creator_name !== 'Unknown Creator' && (
                  <View style={styles.creatorContainer}>
                    {item.creator_avatar_url ? (
                      <Image source={{ uri: item.creator_avatar_url }} style={styles.creatorAvatar} />
                    ) : null}
                    <Text style={styles.creatorInfo}>Created by: {item.creator_name}</Text>
                  </View>
                )}
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  search: {
    margin: 16,
    padding: 12, // Increased padding
    borderWidth: 1,
    borderColor: '#e0e0e0', // Lighter border
    borderRadius: 8,
    backgroundColor: '#fff', // White background for search input
    fontSize: 16, // Increased font size
  },
  categoriesContainer: { // Styles for the categories scroll view
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 60, // Adjust as needed
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#007bff',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  list: { paddingHorizontal: 16, paddingBottom: 16, flex: 1 }, // Added flex: 1
  card: {
    backgroundColor: '#ffffff', // White card background
    borderRadius: 12, // More rounded corners
    marginBottom: 16, // Increased margin bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Added elevation for Android shadow
  },
  eventImage: {
    width: '100%',
    height: 180, // Increased image height
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#e0e0e0', // Placeholder background for image
  },
  cardContent: { // Style for the content part of the card
    padding: 15, // Increased padding
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#333' }, // Adjusted title
  group: { fontSize: 14, color: '#555', marginBottom: 4 }, // Adjusted group text
  date: { fontSize: 13, color: '#777', marginBottom: 8 }, // Adjusted date text
  location: { fontSize: 13, color: '#777', marginBottom: 4 }, // Added location style
  admissionFee: { fontSize: 13, color: '#777', marginBottom: 4, fontWeight: '500' }, // Added admission fee style
  creatorContainer: { // Container for avatar and name
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Increased margin
    marginBottom: 4, // Added margin bottom
  },
  creatorAvatar: {
    width: 24, // Smaller avatar size
    height: 24,
    borderRadius: 12, // Circular avatar
    marginRight: 8,
    backgroundColor: '#ccc', // Placeholder bg
  },
  creatorInfo: { fontSize: 12, color: '#888', fontStyle: 'italic' }, // Style for creator info
  desc: { fontSize: 14, color: '#444', lineHeight: 20 }, // Adjusted description
  empty: { textAlign: 'center', marginTop: 32, color: '#666', fontSize: 16 }, // Adjusted empty text
});
