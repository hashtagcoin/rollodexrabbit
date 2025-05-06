import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';
import { useRouter } from 'expo-router';

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
};

export default function EventsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    console.log('CASCADE_DEBUG: Search term changed:', search);
    if (!search.trim()) {
      console.log('CASCADE_DEBUG: Search is empty, showing all events.');
      setFiltered(events);
    } else {
      const q = search.toLowerCase();
      const filteredEvents = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.group_name?.toLowerCase().includes(q)
      );
      console.log('CASCADE_DEBUG: Filtered events based on search:', JSON.stringify(filteredEvents, null, 2));
      setFiltered(filteredEvents);
    }
  }, [search, events]);

  async function loadEvents() {
    setLoading(true);
    try {
      console.log('CASCADE_DEBUG: Starting loadEvents...');
      const { data: evs, error } = await supabase
        .from('group_events')
        .select('id, group_id, subgroup_id, title, description, start_time, end_time, location, max_participants, created_by, image_url, admission_fee');
      console.log('CASCADE_DEBUG: Fetched raw events (evs):', JSON.stringify(evs, null, 2));
      if (error) {
        console.error('CASCADE_DEBUG: Error fetching group_events:', error);
        throw error;
      }
      const eventsData: Event[] = (evs || []) as Event[];

      const groupIds = [...new Set(eventsData.filter(e => e.group_id).map((e) => e.group_id as string))];
      console.log('CASCADE_DEBUG: Group IDs for fetching names:', groupIds);
      let grpMap: Record<string, string> = {};
      if (groupIds.length > 0) {
        const { data: groups, error: grpErr } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
        console.log('CASCADE_DEBUG: Fetched groups data:', JSON.stringify(groups, null, 2));
        if (grpErr) {
          console.error('CASCADE_DEBUG: Error fetching groups:', grpErr);
          throw grpErr;
        }
        (groups || []).forEach((g) => {
          grpMap[g.id] = g.name;
        });
      }
      console.log('CASCADE_DEBUG: Group map created:', grpMap);

      // Fetch creator names
      const creatorIds = [...new Set(eventsData.map(e => e.created_by).filter(Boolean) as string[])];
      console.log('CASCADE_DEBUG: Creator IDs for fetching names:', creatorIds);
      let creatorMap: Record<string, { full_name?: string | null, avatar_url?: string | null }> = {};
      if (creatorIds.length > 0) {
        const { data: creators, error: creatorsError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url') // Added avatar_url
          .in('id', creatorIds);

        console.log('CASCADE_DEBUG: Fetched creators data:', JSON.stringify(creators, null, 2));
        if (creatorsError) {
          console.error('CASCADE_DEBUG: Error fetching creators:', creatorsError);
        } else {
          (creators || []).forEach(c => {
            if (c.id) {
              creatorMap[c.id] = { full_name: c.full_name, avatar_url: c.avatar_url };
            }
          });
        }
      }
      console.log('CASCADE_DEBUG: Creator map created:', creatorMap);

      const enriched = eventsData.map((e) => ({
        ...e,
        group_name: e.group_id ? grpMap[e.group_id] : 'N/A',
        creator_name: e.created_by ? creatorMap[e.created_by]?.full_name : 'Unknown Creator',
        creator_avatar_url: e.created_by ? creatorMap[e.created_by]?.avatar_url : null
      }));
      console.log('CASCADE_DEBUG: Enriched events before setEvents:', JSON.stringify(enriched, null, 2));

      setEvents(enriched);
      setFiltered(enriched);
    } catch (err) {
      console.error('CASCADE_DEBUG: Error in loadEvents function:', err);
    } finally {
      setLoading(false);
      console.log('CASCADE_DEBUG: loadEvents finished.');
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Events" showBackButton />
      <TextInput
        style={styles.search}
        placeholder="Search events..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadEvents}
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
  container: { flex: 1, backgroundColor: '#f0f2f5' }, // Changed background color
  search: {
    margin: 16,
    padding: 12, // Increased padding
    borderWidth: 1,
    borderColor: '#e0e0e0', // Lighter border
    borderRadius: 8,
    backgroundColor: '#fff', // White background for search input
    fontSize: 16, // Increased font size
  },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
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
