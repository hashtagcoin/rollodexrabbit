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

// Updated type to reflect data from 'service_providers' table
// Based on the MCP query result and typical provider fields
type ProviderDetailsType = {
  id: string;
  business_name: string;
  abn?: string;
  credentials?: string[];
  verified?: boolean;
  service_categories?: string[];
  service_area?: string;
  business_description?: string;
  logo_url?: string | null; 
  // Add other fields from 'service_providers' as needed
  // If specific services OF this provider are displayed, they'll need a separate fetch & type
};

export default function ServiceDetails() {
  const { id, returnIndex, returnViewMode } = useLocalSearchParams<{ id: string; returnIndex?: string; returnViewMode?: string }>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [providerDetails, setProviderDetails] = useState<ProviderDetailsType | null>(null); // Renamed state
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
    const fetchProviderDetails = async () => { // Renamed function
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch the main provider data from 'service_providers' table
        console.log(`Fetching service provider with ID: ${id}`); // Updated log message
        const { data: providerDataResult, error: providerError } = await supabase
          .from('service_providers') // Changed table name
          .select('*') // Consider selecting specific columns later for optimization
          .eq('id', id)
          .single();

        if (providerError) {
          console.error('Error fetching service provider details:', providerError); // Updated log
          if (providerError.code === 'PGRST116') {
            setError('The requested service provider could not be found or is no longer available.'); // Updated error message
          } else {
            setError(providerError.message || 'Failed to fetch service provider details.'); // Updated error message
          }
          setProviderDetails(null); // Clear data on error
          setLoading(false);
          return;
        }

        if (!providerDataResult) {
          setError('Service provider details are unexpectedly missing after a successful query.'); // Updated error message
          setProviderDetails(null);
          setLoading(false);
          return;
        }

        setProviderDetails(providerDataResult as ProviderDetailsType); // Set the fetched provider data

      } catch (err: any) {
        console.error('Error fetching service provider details:', err); // Updated log
        setError(err.message || 'Failed to fetch service provider details.'); // Updated error message
        setProviderDetails(null); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDetails(); // Call renamed function
  }, [id]);

  const handleBooking = () => {
    if (!providerDetails) return; 
    router.push({
      pathname: '/(tabs)/discover/booking', 
      params: { serviceProviderId: providerDetails.id }, // Changed param name for clarity
    });
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <AppHeader title="Loading..." showBackButton={true} onBackPress={handleBackPress} />
        <Text style={styles.messageText}>Loading service provider details...</Text>{/* Updated text */}
      </View>
    );
  }

  // Error State
  if (error || !providerDetails) { // Check providerDetails
    return (
      <View style={styles.containerCentered}>
        <AppHeader title="Error" showBackButton={true} onBackPress={handleBackPress} />
        <Text style={styles.messageText}>{error || 'Service provider data could not be loaded.'}</Text>{/* Updated text */}
      </View>
    );
  }

  // --- Data Rendering --- 
  // THIS SECTION WILL NEED SIGNIFICANT UPDATES IN A FOLLOW-UP STEP
  // to map fields from 'providerDetails' (e.g., business_name, logo_url)
  // instead of the old 'serviceData' (e.g., title, media_urls).

  // Example: This will likely break or show wrong image until UI is mapped
  const imageUrl = providerDetails.logo_url || 'https://placehold.co/600x400?text=No+Image';

  // Example: This needs re-evaluation based on where address data for a provider is stored
  const fullAddress = [
    // providerDetails.address_line_1, // These fields are not on service_providers directly
    // providerDetails.suburb,
    // providerDetails.state,
    // providerDetails.postcode
    providerDetails.service_area // service_providers has service_area
  ].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <AppHeader title={providerDetails.business_name || "Provider Details"} showBackButton={true} onBackPress={handleBackPress} />
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{providerDetails.business_name || 'Provider Name Unavailable'}</Text>
            {/* Rating/Reviews would need to be sourced if applicable to providers */}
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MapPin size={20} color="#666" />
              <Text style={styles.metaText}>{fullAddress || 'Service area not available'}</Text>
            </View>
            {/* Duration/Availability were for specific services, not directly for provider */}
            {/* If providerDetails has 'service_details.duration', it would be from a joined source or different structure */}
            {/* Example: (providerDetails as any).service_details?.duration might be how it was before */}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {providerDetails.business_name || ''}</Text>
            {/* Use fetched description */}
            <Text style={styles.description}>{providerDetails.business_description || 'No description provided.'}</Text>
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
            {/* TODO: Implement pricing logic */}
            {/* <View>
              <Text style={styles.priceLabel}>Price per session</Text>
              <Text style={styles.price}>${serviceData.service_details.hourly_rate}</Text>
            </View> */}
            <TouchableOpacity 
              style={[styles.bookButton, loading && styles.bookButtonDisabled]} // Loading state check might be redundant here
              onPress={handleBooking}
              disabled={loading || !providerDetails} // Disable if loading or no data
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