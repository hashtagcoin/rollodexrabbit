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
  service_formats?: string[];
  service_area?: string;
  business_description?: string;
  logo_url?: string | null;
  // Add other provider fields as needed
};

type ServiceDetailsType = {
  service: ServiceType | null;
  provider: ProviderType | null;
};

export default function ServiceDetails() {
  const { id, returnIndex, returnViewMode, goBackPath } = useLocalSearchParams<{ id: string; returnIndex?: string; returnViewMode?: string; goBackPath?: string }>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetailsType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom back handler
  const handleBackPress = () => {
    if (goBackPath) {
      // TypeScript/Expo Router workaround for strict literal route types
      router.push(goBackPath as unknown as import('expo-router').LinkProps['href']);
      return;
    }
    // Default: Navigate back to discover screen with view mode and position
    if (returnIndex !== undefined || returnViewMode !== undefined) {
      router.push({
        pathname: "/(tabs)/discover",
        params: { 
          returnIndex,
          returnViewMode
        }
      });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if no specific return info and cannot go back (e.g. deep link)
      router.push("/(tabs)/discover");
    }
  };

  useEffect(() => {
    const fetchServiceDetails = async (passedId: string) => {
      let finalServiceToSet: ServiceType | null = null;
      let finalProviderToSet: ProviderType | null = null;

      try {
        setLoading(true);
        setError(null);
        setServiceDetails(null); 

        // Attempt 1: Assume passedId is a services.id
        const { data: serviceResult, error: serviceErr } = await supabase
          .from('services')
          .select('*')
          .eq('id', passedId)
          .maybeSingle();

        if (serviceErr) throw serviceErr;

        if (serviceResult) {
          // Successfully found a service with passedId
          finalServiceToSet = serviceResult;
          if (serviceResult.service_provider_id) {
            const { data: pData, error: pError } = await supabase
              .from('service_providers')
              .select('*')
              .eq('id', serviceResult.service_provider_id)
              .maybeSingle();
            if (pError) {
              console.error("Error fetching provider for service:", pError);
              // Do not throw, allow service to display without provider if provider fetch fails
            } else {
              finalProviderToSet = pData;
            }
          }
        } else {
          // Attempt 2: Service not found with passedId. Assume passedId is a service_providers.id
          const { data: providerResult, error: providerErr } = await supabase
            .from('service_providers')
            .select('*')
            .eq('id', passedId)
            .maybeSingle();

          if (providerErr) throw providerErr;

          if (providerResult) {
            finalProviderToSet = providerResult;
            // Now try to find at least one service associated with this provider
            const { data: associatedService, error: assocServiceErr } = await supabase
              .from('services')
              .select('*')
              .eq('service_provider_id', providerResult.id)
              .limit(1) // Get the first one, or any one representative service
              .maybeSingle(); 

            if (assocServiceErr) {
              console.error("Error fetching associated service for provider:", assocServiceErr);
              // Do not throw, allow provider to display without a specific service if service fetch fails
            } else {
              finalServiceToSet = associatedService;
            }
          }
          // If providerResult is also null here, both finalServiceToSet and finalProviderToSet will be null,
          // and the UI will show "could not be loaded", which is correct.
        }

        setServiceDetails({
          service: finalServiceToSet,
          provider: finalProviderToSet,
        });

      } catch (err: any) { 
        console.error('Fatal error in fetchServiceDetails:', err);
        setError(err.message || 'An unexpected error occurred while fetching details.');
        setServiceDetails(null); 
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Ensure id is available before fetching
      fetchServiceDetails(id);
    } else {
      setError('Service ID is missing.');
      setLoading(false);
      setServiceDetails(null);
    }
  }, [id]);

  const handleBooking = () => {
    if (!serviceDetails?.provider || !serviceDetails?.service) return; 
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
        <Text style={styles.messageText}>Loading service provider details...</Text>
      </View>
    );
  }

  // Error State
  if (error || !serviceDetails || (!serviceDetails.service && !serviceDetails.provider) ) { 
    return (
      <View style={styles.containerCentered}>
        <Text style={styles.messageText}>{error || 'Service details could not be loaded.'}</Text>
      </View>
    );
  }

  const { service, provider } = serviceDetails;
  
  // Use service image if available, otherwise use provider logo
  const imageUrl = (service?.media_urls && service.media_urls.length > 0) 
    ? service.media_urls[0] 
    : provider?.logo_url || 'https://placehold.co/600x400?text=Service+Image';

  // Get service area from provider if available
  const fullAddress = provider?.service_area || 'Service area not specified';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} /> 
      
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{service?.title || 'Service Name Unavailable'}</Text>
          {provider && (
            <Text style={styles.providerNameText}>Provided by {provider.business_name}</Text>
          )}

          <View style={styles.metaInfoRow}>
            {service?.price !== undefined && (
              <View style={styles.metaChip}>
                <Clock size={16} color="#4B5563" />
                <Text style={styles.metaChipText}>${service?.price} / hour</Text>
              </View>
            )}
            {provider && (
              <View style={styles.metaChip}>
                <MapPin size={16} color="#4B5563" />
                <Text style={styles.metaChipText} numberOfLines={1}>{fullAddress}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this service</Text>
            <Text style={styles.sectionText}>{service?.description || 'No description provided.'}</Text>
          </View>
          
          {provider?.business_description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About {provider.business_name}</Text>
              <Text style={styles.sectionText}>{provider.business_description}</Text>
            </View>
          )}

          {provider?.credentials && provider.credentials.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credentials</Text>
              <View style={styles.tagContainer}>
                {provider.credentials.map((cred, index) => (
                  <View key={`cred-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{cred}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {provider?.service_formats && provider.service_formats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Formats</Text>
              <View style={styles.tagContainer}>
                {provider.service_formats.map((format, index) => (
                  <View key={`format-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{format}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookingButton} onPress={handleBooking}>
          <Text style={styles.bookingButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', 
  },
  scrollContentContainer: {
    paddingBottom: 100, 
  },
  imageContainer: {
    width: '100%',
    height: 300, 
    position: 'relative', 
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 40, 
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    marginTop: -20, 
    zIndex: 5,
  },
  title: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: '#1F2937', 
    marginBottom: 8,
  },
  providerNameText: {
    fontSize: 16,
    color: '#4B5563', 
    marginBottom: 16,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', 
    marginBottom: 20,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8, 
  },
  metaChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#374151', 
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', 
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20, 
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24, 
    color: '#374151',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#DBEAFE', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1E40AF', 
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff', 
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 5, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingButton: {
    backgroundColor: '#007AFF', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  containerCentered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB',
  },
  messageText: { 
    fontSize: 16, 
    color: '#4B5563',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});