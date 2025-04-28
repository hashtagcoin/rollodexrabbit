import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
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
  provider: {
    business_name: string;
  };
};

const lighterBlue = '#007AFF';
const lightGray = '#d3d3d3';

function HousingDetail() {
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
          provider:provider_id(business_name)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw handleApiError(fetchError);
      setListing(data);
    } catch (e: unknown) {
      const error = handleApiError(e);
      showErrorAlert(error);
      setError(error.message);
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
      const { data: members, error: membersError } = await supabase
        .from('housing_group_members')
        .select('*, user_profile:user_id(*)')
        .in('group_id', groupIds)
        .eq('status', 'approved');
      if (membersError) throw handleApiError(membersError);
      // Group members by group_id
      membersByGroup = (members || []).reduce((acc: Record<string, any[]>, m: any) => {
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
        <View style={styles.groupSectionContainer}>
          <Text style={styles.sectionTitle}>Co-living Groups</Text>
          <ActivityIndicator style={styles.groupListLoading} size="small" color={lighterBlue} />
        </View>
      );
    }

    // If groups loaded but empty, show option to create one
    if (!loadingGroups && housingGroups.length === 0) {
      return (
        <View style={styles.groupSectionContainer}>
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
      <View style={styles.groupSectionContainer}>
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
      <View style={styles.groupListContainer}>
        {housingGroups.map((group: HousingGroup) => (
          <TouchableOpacity key={group.id} onPress={() => handleJoinGroup(group.id)}>
            <GroupCard
              group={group}
            />
          </TouchableOpacity>
        ))}
      </View>
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

  // Main return statement for HousingDetail component
  return (
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
                onScroll={(event) => {
                  const contentOffsetX = event.nativeEvent.contentOffset.x;
                  const layoutMeasurementWidth = event.nativeEvent.layoutMeasurement.width;
                  // Ensure layoutMeasurementWidth is not zero to avoid division by zero
                  if (layoutMeasurementWidth > 0) {
                     const slide = Math.round(contentOffsetX / layoutMeasurementWidth);
                     if (slide !== currentImageIndex) {
                       setCurrentImageIndex(slide);
                     }
                  }
                }}
                scrollEventThrottle={16} 
              >
                {listing.media_urls.map((url, index) => (
                  <Image key={index} source={{ uri: url }} style={styles.image} resizeMode="cover" />
                ))}
              </ScrollView>
              {listing.media_urls.length > 1 && (
                <View style={styles.pagination}>
                  {listing.media_urls.map((_, index) => (
                    <Text key={index} style={index === currentImageIndex ? styles.paginationDotActive : styles.paginationDot}>•</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Title and Basic Info */}
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
          <View style={styles.providerContainer}>
            <Text style={styles.providerLabel}>Listed by:</Text>
            <Text style={styles.providerName}>{listing.provider?.business_name ?? 'Provider details unavailable'}</Text>
            {/* Add verified badge if applicable */}
          </View>
          
          {/* Virtual Tour Link */}
          {listing.virtual_tour_url && (
            <TouchableOpacity style={styles.virtualTourButton} onPress={() => {/* Add linking logic */}}>
              <Text style={styles.virtualTourButtonText}>Virtual Tour</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Render the Co-living Groups Section */}
          {renderGroupsSection()}

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background
  },
  scrollContainer: {
    // Removed paddingBottom, handled by applyButtonContainer margin
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Ensure space for fixed button
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1, // Take up full screen
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: { 
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { 
    marginTop: 10,
    fontSize: 16,
    color: '#D9534F', // Error red
    textAlign: 'center',
  },
  imageContainer: {
    width: width - 32, // Full width minus padding
    height: 250, // Fixed height for images
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden', // Clip images to rounded corners
    alignSelf: 'center',
  },
  image: {
    width: width - 32,
    height: 250,
  },
  pagination: { 
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: { 
    fontSize: 30, // Make dots larger
    color: '#ccc', 
    marginHorizontal: 4,
  },
  paginationDotActive: { 
    fontSize: 30,
    color: lighterBlue, // Active color
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  locationRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
  },
  rentBondRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline', // Align text baselines
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rentText: { 
    fontSize: 18,
    fontWeight: 'bold',
    color: lighterBlue,
  },
  bondText: { 
    fontSize: 14,
    color: '#666',
  },
  detailsGrid: { 
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%', // Roughly two items per row
    marginBottom: 10,
  },
  detailText: { 
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#444',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 16,
  },
  featureList: { 
    marginLeft: 10, // Indent feature list
    marginBottom: 16,
  },
  featureItem: { 
    fontSize: 14,
    color: '#555',
    lineHeight: 22, // Space out list items
  },
  additionalDetailsContainer: { 
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping
    justifyContent: 'flex-start', // Align items to the start
    marginTop: 8,
    marginBottom: 16,
    gap: 15, // Add gap between items
  },
  additionalDetailItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  additionalDetailText: { 
    marginLeft: 6,
    fontSize: 13,
    color: '#333',
  },
  providerContainer: { 
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  providerLabel: { 
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  virtualTourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lighterBlue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  virtualTourButtonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupSectionContainer: {
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightGray, 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  createGroupButtonText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  groupListContainer: {
    // Container for GroupCards, add styles if needed (e.g., spacing)
  },
  createGroupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f0f8ff', // Light blue background
    borderRadius: 8,
    marginTop: 10,
  },
  createGroupIcon: {
    marginRight: 8,
  },
  createGroupText: {
    fontSize: 14,
    color: '#333',
  },
  createGroupLink: {
    marginLeft: 4,
    fontSize: 14,
    color: lighterBlue,
    fontWeight: 'bold',
  },
  createGroupPromptSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e6f3ff', // Lighter blue
    borderRadius: 6,
    marginTop: 8,
  },
  createGroupTextSmall: {
    fontSize: 13,
    color: '#005A9C', // Darker blue text
    marginLeft: 5,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  avatarContainer: {
    marginRight: 6,
    position: 'relative',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffd700', // Gold color for admin
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#f8f9fa', // Match container background
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  applyButton: { 
    backgroundColor: lighterBlue,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupListLoading: { 
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGroupsContainer: { 
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  noGroupsText: { 
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default function HousingDetailWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <HousingDetail />
    </ErrorBoundary>
  );
}