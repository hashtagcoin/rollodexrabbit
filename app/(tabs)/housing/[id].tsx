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

const lighterBlue = '#589AF0';
const lightBlueBackground = '#EAF2FF';

// Styles must be defined before the component that uses them
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  contentContainer: {
    padding: 16,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 24,
    padding: 16,
    backgroundColor: '#fff2f2',
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#ff3b30',
    fontSize: 16,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width,
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceLabel: {
    fontSize: 13,
    color: lighterBlue,
  },
  sdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    marginBottom: 24,
  },
  sdaBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  feature: {
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: lighterBlue,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: lighterBlue,
    marginBottom: 8,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: lighterBlue,
  },
  availabilityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: lighterBlue,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: lightBlueBackground,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: lighterBlue,
  },
  virtualTourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  virtualTourText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  providerCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  providerTitle: {
    fontSize: 13,
    color: lighterBlue,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    padding: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  footerBond: {
    fontSize: 13,
    color: lighterBlue,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  groupsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 16,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  groupsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: lighterBlue,
  },
  groupList: {
    paddingHorizontal: 16,
  },
  groupListLoading: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 0, // Align to left edge
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#e0e0e0',
  },
  groupStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  groupLoadingText: {
    marginTop: 8,
    color: '#666',
  },
  noGroupsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGroupsText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createGroupButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  groupMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4cd964',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  groupMatchText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  // Test Group Detail Styles
  testGroupDetailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  testGroupDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  testGroupDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testGroupDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  testGroupDetailClose: {
    fontSize: 16,
    color: '#007AFF',
  },
  testGroupDetailDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  testGroupDetailStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  testGroupDetailStat: {
    fontSize: 14,
    color: '#555',
  },
  testGroupDetailMembersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  testGroupDetailMembersList: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  testGroupDetailMember: {
    alignItems: 'center',
    marginRight: 16,
  },
  testGroupDetailMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  testGroupDetailMemberName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  testGroupDetailMemberAdmin: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  testGroupDetailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testGroupDetailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

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

      // Fetch housing groups associated with this listing_id
      // Also fetch all approved members and their avatars for each group
      const { data, error: groupsError } = await supabase
        .from('housing_groups')
        .select(`
          id,
          name
        `)
        .eq('listing_id', id)
        .eq('is_active', true)
        

      if (groupsError) throw handleApiError(groupsError);

      // Process data to format it as HousingGroup[] with members array
      const processedData: HousingGroup[] = (data || []).map((group: any) => {
        // Only include approved members
        const members = (group.housing_group_members || [])
          .filter((m: any) => m.status === 'approved' && m.user_profile && m.user_profile.avatar_url)
          .map((m: any) => ({
            ...m,
            user_profile: m.user_profile
          }));
        return {
          ...group,
          current_members: members.length,
          housing_group_members: undefined,
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
    return (
      <View style={styles.groupsSection}>
        <View style={styles.groupsHeader}>
          <Text style={styles.groupsTitle}>Group Housing Opportunities</Text>
          <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
            <Text style={styles.createGroupButtonText}>+ Create Group</Text>
          </TouchableOpacity>
        </View>
        
        {loadingGroups ? (
          <View style={styles.groupListLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.groupLoadingText}>Loading groups...</Text>
          </View>
        ) : (
          renderHousingGroups()
        )}
      </View>
    );
  };

  const renderHousingGroups = () => {
    console.log('Rendering housing groups, count:', housingGroups.length);
    
    if (housingGroups.length === 0) {
      return (
        <View style={styles.noGroupsContainer}>
          <Text style={styles.noGroupsText}>No housing groups have been created for this listing yet.</Text>
          <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
            <Text style={styles.createGroupButtonText}>Create a Housing Group</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.groupList}>
        {housingGroups.map((group) => (
          <View key={group.id} style={styles.groupCardContainer}>
            <Text style={styles.groupDescription}>{group.description}</Text>
            {/* Avatars Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarsRow}>
              {group.members && group.members.length > 0 && group.members.map((m, idx) => (
                <Image
                  key={m.id}
                  source={m.user_profile.avatar_url ? { uri: m.user_profile.avatar_url } : undefined}
                  style={[styles.smallAvatar, { marginLeft: idx === 0 ? 0 : -12 }]}
                />
              ))}
            </ScrollView>
            {/* Group count icon and other info can go here */}
            <View style={styles.groupStatsRow}>
              <Users size={16} color="#555" />
              <Text style={styles.statText}>{group.current_members}/{group.max_members} members</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const TestGroupDetailView = () => {
    if (!selectedTestGroup) return null;

    return (
      <View style={styles.testGroupDetailOverlay}>
        <View style={styles.testGroupDetailCard}>
          <View style={styles.testGroupDetailHeader}>
            <Text style={styles.testGroupDetailTitle}>{selectedTestGroup.name}</Text>
            <TouchableOpacity onPress={handleCloseTestGroupDetail}>
              <Text style={styles.testGroupDetailClose}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.testGroupDetailDescription}>
            {selectedTestGroup.description}
          </Text>
          
          <View style={styles.testGroupDetailStats}>
            <Text style={styles.testGroupDetailStat}>
              Members: {selectedTestGroup.current_members}/{selectedTestGroup.max_members}
            </Text>
          </View>
          
          <Text style={styles.testGroupDetailMembersTitle}>Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testGroupDetailMembersList}>
            {selectedTestGroup.members
              .filter(member => member.status === 'approved')
              .map((member: GroupMember, i: number) => (
                <View key={member.id} style={styles.testGroupDetailMember}>
                  <Image
                    source={{ uri: member.user_profile.avatar_url || `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${10 + i}.jpg` }}
                    style={styles.testGroupDetailMemberAvatar}
                  />
                  <Text style={styles.testGroupDetailMemberName}>
                    {member.user_profile.first_name}
                  </Text>
                  {member.is_admin && (
                    <Text style={styles.testGroupDetailMemberAdmin}>Admin</Text>
                  )}
                </View>
              ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.testGroupDetailButton} 
            onPress={() => {
              Alert.alert(
                'Join Group',
                'For demo purposes, you have successfully joined this test group.'
              );
              handleCloseTestGroupDetail();
            }}
          >
            <Text style={styles.testGroupDetailButtonText}>Join Group</Text>
          </TouchableOpacity>
        </View>
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

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Housing Detail" showBackButton={true} onBackPress={handleBackPress} />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.container}>
        <AppHeader title="Housing Detail" showBackButton={true} onBackPress={handleBackPress} />
        <View style={styles.error}>
          <AlertCircle size={24} color="#ff3b30" />
          <Text style={styles.errorText}>
            {error || 'Listing not found'}
          </Text>
        </View>
      </View>
    );
  }

  // Main content is rendered when we have a listing and no errors
  return (
    <View style={styles.container}>
      <AppHeader title="Housing Detail" showBackButton={true} onBackPress={handleBackPress} />
      <ScrollView>
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offset = e.nativeEvent.contentOffset.x;
              setCurrentImageIndex(Math.round(offset / width));
            }}
            scrollEventThrottle={16}
          >
            {listing.media_urls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {listing.media_urls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  currentImageIndex === index && styles.imageIndicatorActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{listing.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.location}>
                  {listing.suburb}, {listing.state}
                </Text>
                {housingGroups.length > 0 && (
                  <View style={styles.groupMatchBadge}>
                    <Users size={12} color="#fff" />
                    <Text style={styles.groupMatchText}>Group Match</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${listing.weekly_rent}</Text>
              <Text style={styles.priceLabel}>per week</Text>
            </View>
          </View>

          <View style={styles.sdaBadge}>
            <Wheelchair size={20} color="#fff" />
            <Text style={styles.sdaBadgeText}>
              {listing.sda_category.split('_').map(
                word => word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Bed size={24} color="#666" />
              <Text style={styles.featureText}>
                {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
              </Text>
            </View>
            <View style={styles.feature}>
              <Bath size={24} color="#666" />
              <Text style={styles.featureText}>
                {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
              </Text>
            </View>
            {listing.parking_spaces > 0 && (
              <View style={styles.feature}>
                <Car size={24} color="#666" />
                <Text style={styles.featureText}>
                  {listing.parking_spaces} {listing.parking_spaces === 1 ? 'Park' : 'Parks'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationDetail}>
              <MapPin size={20} color="#666" />
              <Text style={styles.locationText}>{listing.address}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityDetail}>
              <Calendar size={20} color="#666" />
              <Text style={styles.availabilityText}>
                Available from {new Date(listing.available_from).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibility Features</Text>
            <View style={styles.tags}>
              {listing.accessibility_features.map((feature, index) => (
                <View key={index} style={styles.tag}>
                  <DoorOpen size={16} color="#007AFF" />
                  <Text style={styles.tagText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Features</Text>
            <View style={styles.tags}>
              {listing.features.map((feature, index) => (
                <View key={index} style={styles.tag}>
                  <DoorOpen size={16} color="#007AFF" />
                  <Text style={styles.tagText}>{feature}</Text>
                </View>
              ))}
              {listing.pets_allowed && (
                <View style={styles.tag}>
                  <Dog size={16} color="#007AFF" />
                  <Text style={styles.tagText}>Pet Friendly</Text>
                </View>
              )}
            </View>
          </View>

          {listing.virtual_tour_url && (
            <TouchableOpacity style={styles.virtualTourButton}>
              <Text style={styles.virtualTourText}>View Virtual Tour</Text>
              <ChevronRight size={20} color="#007AFF" />
            </TouchableOpacity>
          )}

          {renderGroupsSection()}

          <View style={styles.providerCard}>
            <Text style={styles.providerTitle}>Listed by</Text>
            <Text style={styles.providerName}>{listing.provider.business_name}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerPrice}>${listing.weekly_rent}/week</Text>
            {listing.bond_amount && (
              <Text style={styles.footerBond}>
                Bond: ${listing.bond_amount}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showingTestGroupDetail && <TestGroupDetailView />}
    </View>
  );
}

export default function HousingDetailWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <HousingDetail />
    </ErrorBoundary>
  );
}