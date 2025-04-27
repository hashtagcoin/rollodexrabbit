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
    business_name: string; // Assuming this is in service_providers
    verified: boolean; // Assuming this is in service_providers
    id: string; // Assuming the FK relationship uses this ID
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
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch the main service data from 'services' table
        console.log(`Fetching service with ID: ${id}`);
        const { data: serviceDataResult, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();

        if (serviceError) {
          console.error('Error fetching service details:', serviceError);
          setError(serviceError.message || 'Failed to fetch service details.');
          setServiceData(null); // Clear data on error
          setLoading(false);
          return;
        }

        // Combine data - Assuming 'services' table has all necessary initial fields including provider_id
        // We might not need separate provider/service_listing fetches if 'services' is comprehensive
        // For now, let's keep the structure but log potential missing data from this primary fetch

        let combinedData = { ...serviceDataResult } as any; // Start with data from 'services'

        // Step 2: Fetch provider data if provider_id exists in the serviceDataResult
        if (serviceDataResult?.provider_id) {
          // Querying 'service_providers' based on user information.
          // This may fail if the table doesn't exist in the connected project.
          const { data: providerData, error: providerError } = await supabase
            .from('service_providers') // Changed table name
            .select('business_name, verified, id') // Selecting columns assumed to be in service_providers
            .eq('id', serviceDataResult.provider_id) // Assuming FK still relates via this ID
            .single();

          if (providerError) {
            console.warn(`Could not fetch provider ${serviceDataResult.provider_id}:`, providerError.message);
          } else if (providerData) {
            combinedData.provider = providerData;
          }
        }

        // Set the final combined state
        setServiceData(combinedData);

      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message || 'Failed to fetch service details.');
        setServiceData(null); // Clear data on error
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
  containerCentered: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  messageText: { 
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300, 
    backgroundColor: '#f0f0f0', 
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 16, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    marginLeft: 4,
    marginRight: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    marginBottom: 16,
    gap: 16, 
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16, 
    marginBottom: 8, 
  },
  metaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#999',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureChip: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#007AFF', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row', 
    alignItems: 'center'  
  },
  bookButtonDisabled: {
    opacity: 0.6, 
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});