import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable
} from 'react-native';
import { useLocalSearchParams, router, useNavigation, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { handleApiError, showErrorAlert } from '../../../lib/errorUtils';
import {
  ArrowLeft,
  Bed,
  Bath,
  Car,
  MapPin,
  Calendar,
  Dog,
  Armchair as Wheelchair,
  DoorOpen,
  ChevronRight,
  CircleAlert as AlertCircle,
  Users,
  Plus,
  User,
  Info,
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import GroupCard from './components/GroupCard';
import { HousingGroup, SupportLevel, GroupMember } from './types/housing';
import { useAuth } from '../../../providers/AuthProvider';

const { width } = Dimensions.get('window');

type HousingListing = {
  id: string;
  title: string;
  description: string;
  weekly_rent: number;
  bond_amount: number | null;
  available_from: string;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;
  property_type: string;
  sda_category: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  features: string[];
  accessibility_features: string[];
  media_urls: string[];
  virtual_tour_url: string | null;
  pets_allowed: boolean;
  ndis_supported: boolean;
  provider_id: string;
  provider_details?: {
    business_name?: string;
    avatar_url?: string;
    contact_email?: string;
    contact_phone?: string;
  };
};

const lighterBlue = '#007AFF';
const lightGray = '#d3d3d3';

function HousingDetail(props: any) {
  const { id, returnIndex, returnViewMode } = useLocalSearchParams();
  const { source } = useLocalSearchParams<{ source: string }>();
  const navigation = useNavigation();
  const { session } = useAuth(); // Get user session
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<HousingListing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [housingGroups, setHousingGroups] = useState<HousingGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTestGroup, setSelectedTestGroup] = useState<HousingGroup | null>(null);
  const [showingTestGroupDetail, setShowingTestGroupDetail] = useState(false);

  // Ref for FlatList scrolling
  const flatListRef = React.useRef<FlatList<HousingGroup>>(null);

  // Calculate dynamic card width (ensure Dimensions is imported)
  const CARD_WIDTH = Dimensions.get('window').width * 0.85; // Show 1 card prominently

  // Handler for hover effect to scroll list
  const handleGroupHover = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Image carousel scroll handler
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const layoutMeasurementWidth = event.nativeEvent.layoutMeasurement.width;
    if (layoutMeasurementWidth > 0) {
      const slide = Math.round(contentOffsetX / layoutMeasurementWidth);
      if (slide !== currentImageIndex) {
        setCurrentImageIndex(slide);
      }
    }
  };


  // Set current user ID from session
  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
    }
  }, [session]);

  // Custom back handler to determine where to navigate back to
  const handleBackPress = () => {
    if (source === 'discover') {
      // Navigate back to discover screen with both returnIndex and returnViewMode
      router.push({
        pathname: "/(tabs)/discover",
        params: { 
          returnIndex,
          returnViewMode
        }
      });
    } else {
      // Default: Navigate back to housing screen with both returnIndex and returnViewMode
      router.push({
        pathname: "/(tabs)/housing",
        params: { 
          returnIndex,
          returnViewMode
        }
      });
    }
  };

  const handleApply = () => {
    router.push({
      pathname: '/housing/apply',
      params: { listingId: id }
    });
  };

  const handleCreateGroup = () => {
    if (listing) {
      router.push({
        pathname: '/housing/create-coliving',
        params: { 
          listingId: listing.id,
          listingTitle: listing.title
        }
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    console.log('Handling join group request for:', groupId);
    
    try {
      console.log(`Attempting to navigate using object format for ID: ${groupId}`);
      // For all groups, navigate to the housing group detail screen using the object format
      router.push({
        pathname: '/(tabs)/housing/group/[id]', // Literal path pattern
        params: { id: groupId },         // Dynamic parameter
      });
      console.log(`Navigation to /(tabs)/housing/group/${groupId} initiated via object format.`);
    } catch (error) {
      console.error('Error during navigation attempt:', error);
      Alert.alert('Error', 'Could not navigate to group details.');
    }
  };

  const handleCloseTestGroupDetail = () => {
    setShowingTestGroupDetail(false);
    setSelectedTestGroup(null);
  };

  async function loadListing() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('housing_listings')
        .select(`
          *,
          provider_profile:provider_id (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw handleApiError(fetchError);
      if (!data) throw new Error('Housing listing not found.');

      let displayProviderData: HousingListing['provider_details'] = {};
      const providerProfile = data.provider_profile as {
        user_id: string;
        contact_email?: string;
        contact_phone?: string;
        avatar_url?: string;
        business_name?: string;
      } | null;

      if (providerProfile && providerProfile.user_id) {
        // Step 2: Fetch service_provider data using user_id from provider_profile
        const { data: serviceProviderData, error: spError } = await supabase
          .from('service_providers')
          .select('id, business_name, logo_url')
          .eq('id', providerProfile.user_id) // Assuming service_providers.id is the user_id
          .single();

        if (spError && spError.code !== 'PGRST116') { // PGRST116: 'single' row not found, not an error here
          console.warn('Error fetching service provider data:', spError);
        }
        
        const serviceProvider = serviceProviderData as {
          id: string;
          business_name: string;
          logo_url?: string;
        } | null;

        // Step 3: Merge data for display
        displayProviderData.business_name = serviceProvider?.business_name || providerProfile?.business_name || 'N/A';
        displayProviderData.avatar_url = serviceProvider?.logo_url || providerProfile?.avatar_url;
        displayProviderData.contact_email = providerProfile?.contact_email;
        displayProviderData.contact_phone = providerProfile?.contact_phone;
      } else {
          // Fallback if no provider_profile or user_id
          displayProviderData.business_name = 'Provider information not available';
      }

      setListing({
        ...(data as any), // Cast to any to avoid intermediate type conflicts before full mapping
        provider_details: displayProviderData,
        // Clear out old provider structures if they were part of housingData implicitly
        provider_profile: undefined, 
      });

    } catch (e: any) {
      console.error('Failed to fetch housing details:', e);
      setError(e.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadHousingGroups() {
    if (!id) return; // Don't run if listing ID is not available
    try {
      setLoadingGroups(true);
      console.log('Loading REAL housing groups for listing:', id);

      // Fetch housing groups for this listing
      const { data: groups, error: groupsError } = await supabase
        .from('housing_groups')
        .select('*')
        .eq('listing_id', id)
        .eq('is_active', true);

      if (groupsError) throw handleApiError(groupsError);

      // For each group, fetch approved members and join with user_profiles
      const groupIds = (groups || []).map((g: any) => g.id);
      let membersByGroup: Record<string, any[]> = {};
      if (groupIds.length > 0) {
        // Step 1: Fetch members (no join)
        const { data: members, error: membersError } = await supabase
          .from('housing_group_members')
          .select('*')
          .in('group_id', groupIds)
          .eq('status', 'approved');
        if (membersError) throw handleApiError(membersError);

        // Step 2: Collect unique user_ids
        const userIds = [...new Set((members || []).map((m: any) => m.user_id).filter(Boolean))];
        let profiles: any[] = [];
        if (userIds.length > 0) {
          // Step 3: Fetch user_profiles for these user IDs (id column)
          console.log('Fetching user_profiles for IDs:', userIds);
          const { data: fetchedProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .in('id', userIds);
          if (profilesError) throw handleApiError(profilesError);
          profiles = fetchedProfiles || [];
        }

        // Step 4: Merge profile data into each member
        const profilesById = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
        const membersWithProfiles = (members || []).map((m: any) => ({
          ...m,
          user_profile: profilesById[m.user_id] || null,
        }));

        // Step 5: Group members by group_id
        membersByGroup = (membersWithProfiles || []).reduce((acc: Record<string, any[]>, m: any) => {
          if (!acc[m.group_id]) acc[m.group_id] = [];
          acc[m.group_id].push(m);
          return acc;
        }, {});
      }
      // Compose processedData
      const processedData: HousingGroup[] = (groups || []).map((group: any) => {
        const members = (membersByGroup[group.id] || []).map((m: any) => ({
          ...m,
          user_profile: m.user_profile
        }));
        return {
          ...group,
          current_members: members.length,
          members
        };
      });
      console.log(`Fetched ${processedData.length} active groups for listing ${id}`);
      setHousingGroups(processedData);
    } catch (e: unknown) {
      const error = handleApiError(e);
      console.error('Error loading housing groups:', error);
      // Decide if you want to show an error to the user for groups failing to load
      // showErrorAlert(error, 'Could not load housing groups');
    } finally {
      setLoadingGroups(false);
    }
  }

  const renderGroupsSection = () => {
    // If no groups loaded yet, show loading or empty state
    if (loadingGroups) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Co-living Groups</Text>
          <ActivityIndicator style={styles.groupListLoading} size="small" color={lighterBlue} />
        </View>
      );
    }

    // If groups loaded but empty, show option to create one
    if (!loadingGroups && housingGroups.length === 0) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Co-living Groups</Text>
          <TouchableOpacity style={styles.createGroupPrompt} onPress={handleCreateGroup}>
            <Plus size={20} color={lighterBlue} style={styles.createGroupIcon} />
            <Text style={styles.createGroupText}>Be the first to create a co-living group for this home</Text>
            <ChevronRight size={20} color={lighterBlue} />
          </TouchableOpacity>
        </View>
      );
    }

    // If groups exist, render them
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.groupSectionHeader}>
          <Text style={styles.sectionTitle}>Co-living Groups ({housingGroups.length})</Text>
          <TouchableOpacity onPress={handleCreateGroup}>
            <Text style={styles.createGroupLink}>Create Group</Text>
          </TouchableOpacity>
        </View>
        {renderHousingGroups()} 
      </View>
    );
  };

  const renderHousingGroups = () => {
    // Check if housingGroups is empty or undefined
    if (!housingGroups || housingGroups.length === 0) {
      // Render a message or component indicating no groups are available
      // Optionally, show a button to create a group if appropriate here
      return (
        <View style={styles.noGroupsContainer}>
          <Text style={styles.noGroupsText}>No co-living groups available for this listing yet.</Text>
          {/* You might want the create button here instead of just in renderGroupsSection */}
           <TouchableOpacity style={styles.createGroupPromptSmall} onPress={handleCreateGroup}>
             <Plus size={16} color={lighterBlue} />
             <Text style={styles.createGroupTextSmall}> Create one?</Text>
           </TouchableOpacity>
        </View>
      );
    }
    
    // If showing the detail modal for a test group - Removed as per previous logic simplification
    // if (showingTestGroupDetail && selectedTestGroup) { ... }

    // Main rendering logic for the list of actual groups
    return (
      <FlatList
        ref={flatListRef}
        data={housingGroups}
        keyExtractor={(group: HousingGroup) => group.id}
        renderItem={({ item }: { item: HousingGroup }) => (
          <GroupCard
            group={item}
            onJoinGroup={handleJoinGroup}
            onGroupHover={handleGroupHover}
            cardWidth={CARD_WIDTH}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        snapToAlignment="start"
        decelerationRate="fast"
        pagingEnabled
        // getItemLayout={(_data, index) => ({
        //   length: CARD_WIDTH + 16, // card width + separator
        //   offset: (CARD_WIDTH + 16) * index,
        //   index,
        // })}
        snapToInterval={CARD_WIDTH + 16}
        style={{ marginVertical: 8, minHeight: 220 }}
      />
    );
  };

  useEffect(() => {
    console.log('--- Housing Detail Screen ---');
    console.log('Current Listing ID being viewed:', id);
    if (id) {
      loadListing();
      loadHousingGroups();
    } else {
      setError('No listing ID provided.');
      setLoading(false);
      setLoadingGroups(false);
    }
  }, [id]);

  // Set current user ID from session
  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
    }
  }, [session]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const goBackPath = params.goBackPath as string | undefined;

  const handleBack = useCallback(() => {
    if (goBackPath) {
      // TypeScript/Expo Router workaround: use double cast for strict literal route types
      router.navigate(goBackPath as unknown as import('expo-router').LinkProps['href']);
    } else {
      router.back();
    }
  }, [goBackPath, router]);

  // Main return statement for HousingDetail component
  return (
    <View style={{ flex: 1 }}>
      {/* Custom Back Button */}
      <View style={{ paddingTop: 40, paddingLeft: 12, backgroundColor: '#fff', zIndex: 10 }}>
        <Pressable onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 24 }}>
          <Text style={{ fontSize: 18, color: '#007AFF', fontWeight: 'bold', marginRight: 6 }}>{'←'}</Text>
          <Text style={{ fontSize: 16, color: '#007AFF' }}>Back</Text>
        </Pressable>
      </View>
      <View style={styles.container}>
        <AppHeader title={listing?.title ?? 'Housing Detail'} showBackButton onBackPress={handleBackPress} />
        {loading && (
          <View style={[styles.loadingContainer, styles.centeredContent]}>
            <ActivityIndicator size="large" color={lighterBlue} />
            <Text style={styles.loadingText}>Loading housing details...</Text>
          </View>
        )}
        {error && !loading && (
          <View style={[styles.errorContainer, styles.centeredContent]}>
            <AlertCircle size={24} color="#D9534F" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!loading && !error && listing && (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
            {/* Image Carousel */}
            {listing.media_urls && listing.media_urls.length > 0 && (
              <View style={styles.imageContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {listing.media_urls.map((url, index) => (
                    <Image key={index} source={{ uri: url }} style={styles.image} resizeMode="cover" />
                  ))}
                </ScrollView>
                {listing.media_urls.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {listing.media_urls.map((_, index) => (
                      <Text key={index} style={index === currentImageIndex ? styles.paginationDotActive : styles.paginationDot}>•</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Title and Address */}
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#666" />
              <Text style={styles.locationText}>{`${listing.suburb}, ${listing.state} ${listing.postcode}`}</Text>
            </View>

           {/* Rent and Bond */}
           <View style={styles.rentBondRow}>
             <Text style={styles.rentText}>${listing.weekly_rent}/week</Text>
             {listing.bond_amount && <Text style={styles.bondText}>Bond: ${listing.bond_amount}</Text>}
           </View>

          {/* Property Details Grid */}
           <View style={styles.detailsGrid}>
             <View style={styles.detailItem}>
               <Bed size={20} color="#666" />
               <Text style={styles.detailText}>{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</Text>
             </View>
             <View style={styles.detailItem}>
               <Bath size={20} color="#666" />
               <Text style={styles.detailText}>{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</Text>
             </View>
             <View style={styles.detailItem}>
               <Car size={20} color="#666" />
               <Text style={styles.detailText}>{listing.parking_spaces} park{listing.parking_spaces !== 1 ? 's' : ''}</Text>
             </View>
             <View style={styles.detailItem}>
               <Calendar size={20} color="#666" />
               <Text style={styles.detailText}>Avail. {new Date(listing.available_from).toLocaleDateString()}</Text>
             </View>
           </View>
           
          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {/* Features & Accessibility */}
          {(listing.features?.length > 0 || listing.accessibility_features?.length > 0) && (
            <View>
              {listing.features?.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Features</Text>
                  <View style={styles.featureList}>
                    {listing.features.map((feature, index) => (
                      <Text key={index} style={styles.featureItem}>• {feature}</Text>
                    ))}
                  </View>
                </View>
              )}
              {listing.accessibility_features?.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Accessibility</Text>
                  <View style={styles.featureList}>
                    {listing.accessibility_features.map((feature, index) => (
                      <Text key={index} style={styles.featureItem}>♿ {feature}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Additional Details (Pets, NDIS) */}
          <View style={styles.additionalDetailsContainer}>
             <View style={styles.additionalDetailItem}>
               <Dog size={18} color={listing.pets_allowed ? '#4CAF50' : '#F44336'} />
               <Text style={styles.additionalDetailText}>{listing.pets_allowed ? 'Pets Allowed' : 'No Pets'}</Text>
             </View>
             {listing.ndis_supported && (
               <View style={styles.additionalDetailItem}>
                 <Info size={18} color={lighterBlue} /> 
                 <Text style={styles.additionalDetailText}>NDIS Supported</Text>
               </View>
             )}
             {/* SDA Category if applicable */}
             {listing.sda_category && listing.sda_category !== 'None' && (
                <View style={styles.additionalDetailItem}>
                  <Wheelchair size={18} color='#8A2BE2'/>
                  <Text style={styles.additionalDetailText}>SDA: {listing.sda_category}</Text>
                </View>
             )}
           </View>

          {/* Provider Info */}
          <View style={styles.providerInfoContainer}>
            <Text style={styles.providerLabel}>Listed by:</Text>
            <Text style={styles.providerName}>{listing.provider_details?.business_name ?? 'Provider details unavailable'}</Text>
            {/* Add verified badge if applicable */}
          </View>
          
          {/* Virtual Tour Link */}
          {listing.virtual_tour_url && (
            <TouchableOpacity style={styles.virtualTourButton} onPress={() => {/* Add linking logic */}}>
              <Text style={styles.virtualTourButtonText}>Virtual Tour</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Render the Co-Living Groups Section */}
          <View style={styles.sectionContainer}>
            {renderGroupsSection()}
          </View>

          {/* Location Section */}
          {listing && listing.address && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>
                  Map will be displayed here. Requires 'react-native-maps' and coordinates.
                </Text>
              </View>
              <Text style={styles.addressText}>{`${listing.address}, ${listing.suburb}, ${listing.state} ${listing.postcode}`}</Text>
            </View>
          )}

          {/* Contact Provider Section */}
          {listing && listing.provider_details && (
            <View style={styles.sectionContainer}> 
              <Text style={styles.sectionTitle}>Contact Provider</Text>
              {listing.provider_details ? (
                <View style={styles.providerInfoContainer}>
                  <Image 
                    source={listing.provider_details.avatar_url ? { uri: listing.provider_details.avatar_url } : require('../../../assets/avatar-placeholder.png')} 
                    style={styles.providerAvatar} 
                  />
                  <View style={styles.providerTextContainer}>
                    <Text style={styles.providerName}>{listing.provider_details.business_name}</Text>
                    {listing.provider_details.contact_email && <Text style={styles.providerContactText}>Email: {listing.provider_details.contact_email}</Text>}
                    {listing.provider_details.contact_phone && <Text style={styles.providerContactText}>Phone: {listing.provider_details.contact_phone}</Text>}
                  </View>
                </View>
              ) : (
                <Text>Provider information is not available.</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Apply Button Fixed at Bottom */}
      {!loading && !error && listing && (
        <View style={styles.applyButtonContainer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    </View> // Closes styles.container
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFDFD' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FDFDFD' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 20 },
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  scrollContainer: { flexGrow: 1 },

  // Image Carousel Styles
  imageContainer: { width: '100%', height: 300, marginBottom: 20, backgroundColor: '#E0E0E0' },
  image: { width: Dimensions.get('window').width, height: 300 }, // Assumes Dimensions is imported
  paginationContainer: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.4)', marginHorizontal: 4 },
  paginationDotActive: { backgroundColor: '#FFFFFF' },

  // Content Styles
  contentContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  sectionContainer: { marginBottom: 20, padding: 15, backgroundColor: '#FFFFFF', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 5 },
  regularText: { fontSize: 16, color: '#4F4F4F', lineHeight: 24, marginBottom: 5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  detailLabel: { fontSize: 16, fontWeight: '500', color: '#4F4F4F' },
  detailValue: { fontSize: 16, color: '#1A1A1A' },
  availabilityTextGreen: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  availabilityTextRed: { fontSize: 16, fontWeight: 'bold', color: '#C62828' },
  bulletPoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletIcon: { marginRight: 10, marginTop: 4, color: '#007AFF' },
  bulletText: { fontSize: 16, color: '#4F4F4F', lineHeight: 24, flex: 1 },
  expandButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  expandButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '500', marginRight: 5 },

  // Map and Address
  mapPlaceholder: { height: 200, backgroundColor: '#E9E9EF', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 10 },
  mapPlaceholderText: { color: '#8A8A8E', fontSize: 16 },
  addressText: { fontSize: 16, color: '#4F4F4F', textAlign: 'center', marginBottom: 20 },

  // Provider Info
  providerInfoContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFFFFF', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginTop: 10 },
  providerAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#E0E0E0' },
  providerTextContainer: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  providerContactText: { fontSize: 15, color: '#007AFF', lineHeight: 22 }, // Was '#007AFF'

  // Button Styles
  primaryButton: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  viewAgreementButton: { borderColor: '#007AFF', borderWidth: 1, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  viewAgreementButtonText: { color: '#007AFF', fontSize: 17, fontWeight: '600' },
  disabledButton: { backgroundColor: '#BDBDBD' },

  // Group Creation Prompt
  createGroupPrompt: { padding: 15, backgroundColor: '#E6F2FF', borderRadius: 8, marginTop: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, // Added flexDirection and justifyContent
  createGroupText: { fontSize: 16, color: '#00529B', textAlign: 'left', flex:1, marginRight: 10, lineHeight: 22 }, // Changed textAlign, added flex, marginRight
  createGroupButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  createGroupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },

  // Existing Group Info / Group Card Styles (consolidated)
  groupInfoContainer: { marginTop: 20, padding: 15, backgroundColor: '#F0F8FF', borderRadius: 8, borderWidth: 1, borderColor: '#D1E9FF' },
  groupInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e5637', marginBottom: 10 }, // Dark green title from testGroupDetailTitle
  groupMemberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8F4FF' },
  groupMemberName: { fontSize: 16, color: '#333', marginLeft: 10 },
  leaveGroupButton: { backgroundColor: '#FF6B6B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  leaveGroupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  
  groupCard: { 
    backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eeeeee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  groupName: { 
    fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 8,
  },
  groupMemberCount: { 
    fontSize: 15, color: '#555', marginBottom: 12,
  },
  joinButton: { 
    backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center',
  },
  joinButtonText: { 
    color: '#ffffff', fontSize: 15, fontWeight: '500',
  },
  groupDetailContainer: { // For displaying details of a selected/joined group
    padding: 15, backgroundColor: '#ffffff', borderRadius: 8, marginTop: 10,
  },
  groupDetailTitle: { // Re-using from testGroupDetailTitle for consistency
    fontSize: 18, fontWeight: 'bold', color: '#1e5637', marginBottom: 8,
  },
  groupDetailText: { // Re-using from testGroupDetailText
    fontSize: 15, color: '#333', lineHeight: 22,
  },
  groupListLoading: { marginVertical: 20 },
  createGroupIcon: { marginRight: 8 },
  groupSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  createGroupLink: { color: '#007AFF', fontWeight: '500', fontSize: 16 },
  noGroupsContainer: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  noGroupsText: { fontSize: 16, color: '#666', marginBottom: 15, textAlign: 'center' },
  createGroupPromptSmall: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#E6F2FF', borderRadius: 6 },
  createGroupTextSmall: { fontSize: 15, color: '#00529B', marginLeft: 6 },  
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 17, color: '#4F4F4F' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationText: { fontSize: 17, color: '#333333', marginLeft: 8 },
  rentBondRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 15, borderBottomWidth: 1, borderColor: '#EEE', paddingBottom:15 },
  rentText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  bondText: { fontSize: 17, color: '#4F4F4F' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 12, backgroundColor: '#F8F9FA', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, borderWidth:1, borderColor: '#E9ECEF' },
  detailText: { fontSize: 16, color: '#333333', marginLeft: 10 },
  description: { fontSize: 16, color: '#4F4F4F', lineHeight: 24, marginBottom: 20, marginTop: 5 },
  featureList: { marginLeft: 10, marginBottom: 15 },
  featureItem: { fontSize: 16, color: '#4F4F4F', lineHeight: 24, marginBottom: 6 },
  additionalDetailsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 15, marginBottom: 20, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EEE' },
  additionalDetailItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 8, padding: 8, backgroundColor: '#F8F9FA', borderRadius: 6 },
  additionalDetailText: { fontSize: 15, color: '#333333', marginLeft: 8 },
  providerLabel: { fontSize: 16, fontWeight: '600', color: '#4F4F4F', marginBottom: 5 },
  virtualTourButton: { flexDirection: 'row', backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 15, marginBottom: 10 },
  virtualTourButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', marginRight: 8 },
  applyButtonContainer: { paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  applyButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});

// Standardize export as per previous diff indication
const HousingDetailWithErrorBoundary = (props: any) => (
  <ErrorBoundary>
    <HousingDetail {...props} />
  </ErrorBoundary>
);

export default HousingDetailWithErrorBoundary;