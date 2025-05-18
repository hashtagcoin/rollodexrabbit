import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import AppHeader from '../../../../components/AppHeader';
import { type Database } from '../../../../types/database.types'; // Adjust path as needed
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

// Define the type for a single event based on your Supabase table
// This is an example, adjust according to your 'events' table structure
interface GroupEvent {
  id: string;
  group_id: string;
  subgroup_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: {
    city: string;
    full_address: string;
  } | null;
  max_participants: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  image_url: string;
  admission_fee: string;
  category: string;
  // Add any related data types if you join tables, e.g., creator profile
  user_profiles?: Database['public']['Tables']['user_profiles']['Row'] | null;
}

export default function EventDetailScreen() {
  const { id, goBackPath } = useLocalSearchParams<{ id: string; goBackPath?: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<GroupEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!id) {
      setError('Event ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('group_events')
        .select(`
          *,
          user_profiles ( id, full_name, avatar_url )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setEvent(data as GroupEvent);
      } else {
        setError('Event not found.');
      }
    } catch (e: any) {
      console.error('Error fetching event details:', e);
      setError(e.message || 'Failed to fetch event details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleBackPress = useCallback(() => {
    if (goBackPath) {
      router.push(goBackPath as Href);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to a default community screen if no other option
      router.replace('/(tabs)/community' as Href);
    }
  }, [goBackPath, router]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Time not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return 'Invalid time';
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <AppHeader title="Loading Event..." showBackButton onBackPress={handleBackPress} />
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.messageText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <AppHeader title="Error" showBackButton onBackPress={handleBackPress} />
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchEventDetails} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <AppHeader title="Event Not Found" showBackButton onBackPress={handleBackPress} />
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.messageText}>The event could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <AppHeader title={event.title || 'Event Details'} showBackButton onBackPress={handleBackPress} />
      <ScrollView contentContainerStyle={styles.container}>
        {event.image_url && (
          <Image source={{ uri: event.image_url }} style={styles.eventImage} resizeMode="cover" />
        )}
        {!event.image_url && (
          <View style={[styles.eventImage, styles.placeholderImage]}>
            <MaterialCommunityIcons name="image-off-outline" size={80} color="#cccccc" />
          </View>
        )}

        <View style={styles.contentPadding}>
          <Text style={styles.title}>{event.title}</Text>
          
          {event.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          )}

          {event.user_profiles && (
             <TouchableOpacity style={styles.hostContainer} onPress={() => router.push(`/(tabs)/community/profile/${event.user_profiles?.id}` as Href)}>
              {event.user_profiles.avatar_url ? (
                <Image source={{ uri: event.user_profiles.avatar_url }} style={styles.hostAvatar} />
              ) : (
                <View style={[styles.hostAvatar, styles.avatarPlaceholder]}>
                  <Entypo name="user" size={18} color="#FFF" />
                </View>
              )}
              <Text style={styles.hostName}>Hosted by {event.user_profiles.full_name || 'N/A'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.separator} />

          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.detailItemContainer}>
            <Entypo name="calendar" size={20} color="#4F4F4F" style={styles.iconStyle} />
            <Text style={styles.detailText}>{formatDate(event.start_time)}</Text>
          </View>
          <View style={styles.detailItemContainer}>
            <Entypo name="clock" size={20} color="#4F4F4F" style={styles.iconStyle} />
            <Text style={styles.detailText}>{formatTime(event.start_time)} {event.end_time ? `- ${formatTime(event.end_time)}` : ''}</Text>
          </View>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.detailItemContainer}>
            <Entypo name="location-pin" size={20} color="#4F4F4F" style={styles.iconStyle} />
            <Text style={styles.detailText}>
              {event.location ? `${event.location.city}, ${event.location.full_address}` : 'Location not specified'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>About this Event</Text>
          <Text style={styles.description}>{event.description || 'No description provided.'}</Text>

          {/* Add more details as needed, e.g., attendees, RSVP button etc. */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    paddingBottom: 20,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  eventImage: {
    width: '100%',
    height: 250, // Adjust as needed
    backgroundColor: '#e0e0e0', // Placeholder color
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryContainer: {
    backgroundColor: '#E0E7FF', // Light indigo background
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start', // Make it wrap content width
    marginBottom: 12,
  },
  categoryText: {
    color: '#3730A3', // Indigo text
    fontSize: 13,
    fontWeight: '600',
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#c0c0c0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A0A0A0',
  },
  hostName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB', // Light gray separator
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 10,
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconStyle: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#374151', // Slightly darker gray for text
    flexShrink: 1, // Allow text to wrap if long
  },
  addressText: {
    marginLeft: 30, // Indent address under location name
    marginTop: -5, // Adjust spacing
    marginBottom: 10,
    color: '#6B7280', // Lighter gray for address
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'left',
  },
});