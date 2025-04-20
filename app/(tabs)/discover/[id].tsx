import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack, useNavigation } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, MapPin, Star, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

// Assume or import more specific types based on your actual schema
// This is a placeholder structure based on the query
type FetchedServiceData = {
  id: string;
  title: string;
  description: string;
  media_urls: string[];
  address_line_1?: string; // Assuming address parts are in listings
  suburb?: string;
  state?: string;
  postcode?: string;
  provider: {
    business_name: string;
    verified: boolean;
  } | null;
  service_details: {
    hourly_rate?: number; // Optional fields based on service_listings
    duration?: string; // e.g., '60 min'
  } | null;
  // Add other fields from 'listings' table as needed
  // e.g., rating, reviews_count - These might need separate queries or be part of listings
};

export default function ServiceDetails() {
  const { id, returnIndex, returnViewMode } = useLocalSearchParams<{ id: string; returnIndex?: string; returnViewMode?: string }>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true); // Start loading initially
  const [serviceData, setServiceData] = useState<FetchedServiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom back handler to return to discover screen
  const handleBackPress = () => {
    // Always navigate back to discover screen, preserving the view mode and position
    router.push({
      pathname: "/(tabs)/discover",
      params: { 
        returnIndex,
        returnViewMode
      }
    });
  };

  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query based on confirmed schema
        const { data, error: dbError } = await supabase
          .from('listings')
          .select(`
            *,
            provider:providers (business_name, verified),
            service_details:service_listings (hourly_rate, duration)
          `)
          .eq('id', id)
          .eq('listing_type', 'service') // Ensure it's a service
          .single();

        if (dbError) {
          throw dbError;
        }

        if (data) {
          setServiceData(data as FetchedServiceData);
        } else {
          setError('Service not found.');
        }
      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message || 'Failed to fetch service details.');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleBooking = () => {
    if (!serviceData) return; 
    router.push({
      pathname: '/(tabs)/discover/booking', // Adjust path if needed
      params: { serviceId: serviceData.id }, 
    });
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <AppHeader title="Loading..." showBackButton={true} onBackPress={handleBackPress} />
        {/* Consider adding an ActivityIndicator here */}
        <Text style={styles.messageText}>Loading service details...</Text>
      </View>
    );
  }

  // Error State
  if (error || !serviceData) {
    return (
      <View style={styles.containerCentered}>
        <AppHeader title="Error" showBackButton={true} onBackPress={handleBackPress} />
        <Text style={styles.messageText}>{error || 'Service data could not be loaded.'}</Text>
      </View>
    );
  }

  // --- Data Rendering --- 
  // Use serviceData instead of hardcoded 'service'
  const imageUrl = serviceData.media_urls && serviceData.media_urls.length > 0 
                   ? serviceData.media_urls[0] 
                   : 'https://placehold.co/600x400?text=No+Image'; // Fallback image

  const fullAddress = [
    serviceData.address_line_1,
    serviceData.suburb,
    serviceData.state,
    serviceData.postcode
  ].filter(Boolean).join(', '); // Construct address safely

  return (
    <View style={styles.container}>
      <AppHeader title="Service Details" showBackButton={true} onBackPress={handleBackPress} />
      <ScrollView>
        <View style={styles.imageContainer}>
          {/* Use fetched image URL with fallback */}
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            {/* Use fetched data */}
            <Text style={styles.title}>{serviceData.title || 'Service Name Unavailable'}</Text>
            {/* TODO: Fetch/Display Rating and Reviews if available in schema */}
            {/* <View style={styles.ratingContainer}>
              <Star size={20} color="#FFB800" fill="#FFB800" />
              <Text style={styles.rating}>{serviceData.rating}</Text> 
              <Text style={styles.reviews}>({serviceData.reviews} reviews)</Text> 
            </View> */}
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MapPin size={20} color="#666" />
              {/* Use constructed address */}
              <Text style={styles.metaText}>{fullAddress || 'Address not available'}</Text>
            </View>
            {serviceData.service_details?.duration && (
              <View style={styles.metaItem}>
                <Clock size={20} color="#666" />
                {/* Use fetched duration */}
                <Text style={styles.metaText}>{serviceData.service_details.duration}</Text>
              </View>
            )}
            {/* TODO: Implement availability logic */}
            {/* <View style={styles.metaItem}>
              <Calendar size={20} color="#666" />
              <Text style={styles.metaText}>Available Today</Text> 
            </View> */}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {serviceData.provider?.business_name || ''}</Text>
            {/* Use fetched description */}
            <Text style={styles.description}>{serviceData.description || 'No description provided.'}</Text>
          </View>

          {/* TODO: Implement Available Times fetching/display */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.timeSlots}
            >
              {service.availableTimes.map((time, index) => (
                <TouchableOpacity key={index} style={styles.timeSlot}>
                  <Text style={styles.timeText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View> */}

          <View style={styles.priceSection}>
            {serviceData.service_details?.hourly_rate && (
              <View>
                <Text style={styles.priceLabel}>Price per session</Text>
                {/* Use fetched price */}
                <Text style={styles.price}>${serviceData.service_details.hourly_rate}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.bookButton, loading && styles.bookButtonDisabled]} // Loading state check might be redundant here
              onPress={handleBooking}
              disabled={loading || !serviceData} // Disable if loading or no data
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerCentered: { // Added style for loading/error states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  messageText: { // Added style for loading/error text
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviews: {
    fontSize: 16,
    color: '#666',
  },
  metaInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  timeSlots: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});