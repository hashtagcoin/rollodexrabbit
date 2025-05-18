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

// Types for the service and provider data
type ServiceType = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  format?: string;
  media_urls?: string[];
  service_provider_id: string;
  // Add other service fields as needed
};

type ProviderType = {
  id: string;
  business_name: string;
  abn?: string;
  credentials?: string[];
  verified?: boolean;
  service_categories?: string[];
  service_area?: string;
  business_description?: string;
  logo_url?: string | null;
  // Add other provider fields as needed
};

type ServiceDetailsType = {
  service: ServiceType;
  provider: ProviderType | null;
};

export default function ServiceDetails() {
  const { id, returnIndex, returnViewMode } = useLocalSearchParams<{ id: string; returnIndex?: string; returnViewMode?: string }>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetailsType | null>(null);
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
        console.log(`Fetching service with ID: ${id}`);
        
        // Step 1: Fetch the service details
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();

        if (serviceError || !serviceData) {
          throw serviceError || new Error('Service not found');
        }

        // Step 2: Fetch the associated provider details if service_provider_id exists
        let providerData = null;
        if (serviceData.service_provider_id) {
          const { data, error: providerError } = await supabase
            .from('service_providers')
            .select('*')
            .eq('id', serviceData.service_provider_id)
            .single();

          if (providerError) {
            console.error('Error fetching provider details:', providerError);
            // Don't throw, we'll handle missing provider gracefully
          } else {
            providerData = data;
          }
        } else {
          console.warn('Service has no associated provider:', serviceData.id);
        }

        // Set the combined data
        setServiceDetails({
          service: serviceData,
          provider: providerData
        });

      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message || 'Failed to fetch service details.');
        setServiceDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleBooking = () => {
    if (!serviceDetails?.provider) return; 
    router.push({
      pathname: '/(tabs)/discover/booking', 
      params: { 
        serviceProviderId: serviceDetails.provider.id,
        serviceId: serviceDetails.service.id
      },
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
  if (error || !serviceDetails) {
    return (
      <View style={styles.containerCentered}>
        <AppHeader title="Error" showBackButton={true} onBackPress={handleBackPress} />
        <Text style={styles.messageText}>{error || 'Service details could not be loaded.'}</Text>
      </View>
    );
  }

  const { service, provider } = serviceDetails;
  
  // Use service image if available, otherwise use provider logo
  const imageUrl = (service.media_urls && service.media_urls.length > 0) 
    ? service.media_urls[0] 
    : provider?.logo_url || 'https://placehold.co/600x400?text=No+Image';

  // Get service area from provider if available
  const fullAddress = provider?.service_area || 'Service area not specified';

  return (
    <View style={styles.container}>
      <AppHeader title={service.title || "Service Details"} showBackButton={true} onBackPress={handleBackPress} />
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{service.title || 'Service Name Unavailable'}</Text>
            {provider && (
              <Text style={styles.subtitle}>by {provider.business_name}</Text>
            )}
          </View>

          <View style={styles.metaInfo}>
            {provider && (
              <View style={styles.metaItem}>
                <MapPin size={20} color="#666" />
                <Text style={styles.metaText}>{fullAddress}</Text>
              </View>
            )}
            {service.price !== undefined && (
              <View style={styles.metaItem}>
                <Text style={styles.price}>${service.price} / hour</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.description}>{service.description || 'No description provided.'}</Text>
          </View>
          
          {provider?.business_description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About {provider.business_name}</Text>
              <Text style={styles.description}>{provider.business_description}</Text>
            </View>
          )}

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
              disabled={loading || !serviceDetails?.provider} // Disable if loading or no provider data
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
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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