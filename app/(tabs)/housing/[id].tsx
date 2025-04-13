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
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { ErrorBoundary } from './components/ErrorBoundary';

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

type HousingGroup = {
  id: string;
  name: string;
  listing_id: string;
  max_members: number;
  current_members: number;
  creator_id: string;
  created_at: string;
  members: GroupMember[];
};

type GroupMember = {
  id: string;
  user_id: string;
  group_id: string;
  join_date: string;
  status: string;
  bio: string;
  support_level: string;
  user_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
};

// Styles must be defined before the component that uses them
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 14,
    color: '#666',
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
    gap: 24,
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
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
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  availabilityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityText: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e1f0ff',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
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
    marginBottom: 100,
  },
  providerTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    padding: 24,
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
    fontSize: 14,
    color: '#666',
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
  groupSection: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createGroupText: {
    fontSize: 14,
    color: '#007AFF',
  },
  groupList: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e1f0ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  memberName: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  joinGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  joinGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  groupEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  groupEmptyStateText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
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
});

function HousingDetail() {
  const { id, returnIndex, returnViewMode } = useLocalSearchParams();
  const { source } = useLocalSearchParams<{ source: string }>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<HousingListing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [housingGroups, setHousingGroups] = useState<HousingGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

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
        pathname: '/community/groups/create',
        params: { 
          listingId: listing.id,
          listingTitle: listing.title
        }
      });
    }
  };

  const handleJoinGroup = (groupId: string) => {
    router.push({
      pathname: "/(tabs)/community/groups/[id]",
      params: { 
        id: groupId,
        action: 'join'
      }
    });
  };

  useEffect(() => {
    loadListing();
  }, [id]);

  useEffect(() => {
    if (listing) {
      loadHousingGroups();
    }
  }, [listing]);

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
    try {
      setLoadingGroups(true);
      
      const { data, error } = await supabase
        .from('housing_groups')
        .select(`
          *,
          members: housing_group_members (
            *,
            user_profile: user_id (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('listing_id', id);

      if (error) throw handleApiError(error);
      setHousingGroups(data || []);
    } catch (e) {
      console.error('Error loading housing groups:', e);
      // Don't show this error to the user as it's non-critical
    } finally {
      setLoadingGroups(false);
    }
  }

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

          <View style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Group Housing Opportunities</Text>
              <TouchableOpacity 
                style={styles.createGroupButton}
                onPress={handleCreateGroup}
              >
                <Plus size={16} color="#007AFF" />
                <Text style={styles.createGroupText}>Create Group</Text>
              </TouchableOpacity>
            </View>
            
            {loadingGroups ? (
              <ActivityIndicator color="#007AFF" />
            ) : housingGroups.length > 0 ? (
              <View style={styles.groupList}>
                {housingGroups.map(group => (
                  <View key={group.id} style={styles.groupCard}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <View style={styles.groupStats}>
                      <Users size={16} color="#666" />
                      <Text style={styles.memberCount}>
                        {group.current_members} of {group.max_members} members
                      </Text>
                    </View>
                    
                    <View style={styles.membersList}>
                      {group.members.slice(0, 3).map(member => (
                        <View key={member.id} style={styles.memberItem}>
                          {member.user_profile.avatar_url ? (
                            <Image 
                              source={{ uri: member.user_profile.avatar_url }} 
                              style={styles.memberAvatar} 
                            />
                          ) : (
                            <View style={styles.memberAvatar}>
                              <User size={16} color="#fff" />
                            </View>
                          )}
                          <Text style={styles.memberName}>
                            {member.user_profile.first_name}
                          </Text>
                        </View>
                      ))}
                      {group.members.length > 3 && (
                        <View style={styles.memberItem}>
                          <Text style={styles.memberName}>
                            +{group.members.length - 3} more
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.joinGroupButton}
                      onPress={() => handleJoinGroup(group.id)}
                    >
                      <Text style={styles.joinGroupText}>View Group</Text>
                      <ChevronRight size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.groupEmptyState}>
                <Users size={20} color="#666" />
                <Text style={styles.groupEmptyStateText}>
                  No housing groups for this property yet. Create a group to find roommates!
                </Text>
              </View>
            )}
          </View>

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