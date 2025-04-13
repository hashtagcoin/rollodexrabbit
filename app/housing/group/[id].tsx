import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import { handleApiError } from '../../../lib/errorUtils';
import {
  ChevronLeft,
  Filter,
  Heart,
  User,
  Users,
  HeartHandshake,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { HousingGroup, SupportLevel, GroupMember } from '../../(tabs)/housing/types/housing';

// Extend the GroupMember and related user profile types to include additional fields
interface ExtendedUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age_range?: string | null;
  bio?: string | null;
}

interface ExtendedGroupMember extends Omit<GroupMember, 'user_profile'> {
  user_profile: ExtendedUserProfile;
}

interface ExtendedHousingGroup extends Omit<HousingGroup, 'members'> {
  members: ExtendedGroupMember[];
}

// Define type for the housing listing summary
type HousingListingSummary = {
  id: string;
  title: string;
  address: string;
  suburb: string;
  weekly_rent: number;
  available_from: string;
  media_urls: string[];
};

// Support level utilities
const supportLevelLabels: Record<SupportLevel, string> = {
  none: 'No Support',
  light: 'Light Support',
  moderate: 'Moderate Support',
  high: 'High Support'
};

const supportLevelColors: Record<SupportLevel, string> = {
  none: '#dddddd',
  light: '#95d6a4',
  moderate: '#ffd966',
  high: '#ff9a8b'
};

export default function HousingGroupDetail() {
  const { id, action } = useLocalSearchParams<{ id: string; action: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<ExtendedHousingGroup | null>(null);
  const [listing, setListing] = useState<HousingListingSummary | null>(null);
  const [userMembership, setUserMembership] = useState<ExtendedGroupMember | null>(null);

  // Format date as Month Day
  const formatMoveInDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    console.log('Group ID changed:', id);
    
    if (!id) return;
    
    // Check if this is a test group ID
    if (typeof id === 'string' && id.startsWith('test-')) {
      console.log('This is a test group ID, skipping database load');
      // Directly call our test group handler with no database queries
      handleTestGroup(id as string).then(testGroup => {
        if (testGroup) {
          console.log('Test group loaded successfully');
        }
      });
      return;
    }
    
    // Only load from database for real UUIDs
    loadGroupDetails();
  }, [id, userId]);

  useEffect(() => {
    // If action is 'join', show the join confirmation dialog
    if (action === 'join' && group && !userMembership) {
      confirmJoinGroup();
    }
  }, [action, group, userMembership]);

  // Special handling for test groups that might not exist in the database
  const handleTestGroup = async (groupId: string) => {
    console.log('Handling test group ID:', groupId);
    if (groupId.startsWith('test-')) {
      try {
        // Real user IDs from our database for testing
        const realUserIds = [
          '7a9ed413-a880-43d1-aeb0-33805d00a3c8', // support_coordinator@example.com
          'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8', // ryan_h@example.com
          'd5e1fa56-80b7-4e51-9012-3baac98f2b9e', // lily_w@example.com
          'fc178f8d-6b47-40be-beaf-462e1c7f31a3', // dhdhd@gfgf.com
          '9e4fffdc-6dbc-40b0-8601-abcfdd9c4af4'  // bash@gmaikl.com
        ];

        // First try to find the corresponding housing listing
        const listingId = groupId.split('-')[1]; // Extract listing ID part
        
        // Fetch the housing listing to create a realistic test group
        const { data: listingData, error: listingError } = await supabase
          .from('housing_listings')
          .select('id, title, address, suburb, weekly_rent, available_from, media_urls')
          .ilike('id', `%${listingId}%`)
          .limit(1)
          .single();
          
        if (listingError) {
          console.error('Error finding listing for test group:', listingError);
          return null;
        }
        
        // Find or use current user ID
        const currentUserId = userId || realUserIds[0];
        
        // Create a test group with the current user as a member
        const testGroup: ExtendedHousingGroup = {
          id: groupId,
          name: 'Test Housing Group',
          description: 'This is a test housing group for demonstration purposes',
          listing_id: listingData.id,
          max_members: 4,
          current_members: 2,
          creator_id: currentUserId,
          created_at: new Date().toISOString(),
          move_in_date: new Date(listingData.available_from).toISOString(),
          is_active: true,
          members: [
            {
              id: `${groupId}-member1`,
              user_id: currentUserId,
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: 'I like quiet spaces and am tidy',
              support_level: 'light' as SupportLevel,
              is_admin: true,
              user_profile: {
                id: currentUserId,
                first_name: 'Jane',
                last_name: 'Doe',
                avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
                age_range: '25-34',
                bio: 'I like quiet spaces and am tidy'
              }
            },
            {
              id: `${groupId}-member2`,
              user_id: realUserIds[1],
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: 'Looking for a supportive environment',
              support_level: 'moderate' as SupportLevel,
              is_admin: false,
              user_profile: {
                id: realUserIds[1],
                first_name: 'John',
                last_name: 'Smith',
                avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
                age_range: '35-44',
                bio: 'Looking for a supportive environment'
              }
            }
          ]
        };
        
        setGroup(testGroup);
        setListing(listingData);
        
        // Check if the current user is already a member
        if (userId) {
          const memberRecord = testGroup.members.find(m => m.user_id === userId);
          if (memberRecord) {
            setUserMembership(memberRecord);
          } else {
            // Add current user as member if not found
            const newMember: ExtendedGroupMember = {
              id: `${groupId}-member-current-user`,
              user_id: userId,
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: '',
              support_level: 'none',
              is_admin: true,
              user_profile: {
                id: userId,
                first_name: 'You',
                last_name: '',
                avatar_url: null,
                age_range: null,
                bio: null
              }
            };
            testGroup.members.push(newMember);
            setUserMembership(newMember);
          }
        }
        
        return testGroup;
      } catch (error) {
        console.error('Error creating test group:', error);
        return null;
      }
    }
    return null;
  };

  // Load group details from database (only for real UUIDs)
  const loadGroupDetails = async () => {
    try {
      // Skip entirely for test group IDs
      if (typeof id === 'string' && id.startsWith('test-')) {
        console.log('Skipping real database queries for test group ID');
        return;
      }
      
      console.log('Loading real group details from database for ID:', id);
      
      setLoading(true);
      
      // Fetch the housing group with members
      const { data: groupData, error: groupError } = await supabase
        .from('housing_groups')
        .select(`
          id,
          name,
          description,
          listing_id,
          max_members,
          current_members,
          creator_id,
          created_at,
          move_in_date,
          is_active,
          members: housing_group_members!group_id (
            id,
            user_id,
            group_id,
            join_date,
            status,
            bio,
            support_level,
            is_admin,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url,
              age_range,
              bio
            )
          )
        `)
        .eq('id', id)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        throw handleApiError(groupError);
      }
      
      if (groupData) {
        // Transform the data to ensure it matches our expected types
        const transformedGroup: ExtendedHousingGroup = {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description || '',
          listing_id: groupData.listing_id,
          max_members: groupData.max_members,
          current_members: groupData.members.filter(m => m.status === 'approved').length,
          creator_id: groupData.creator_id,
          created_at: groupData.created_at,
          move_in_date: groupData.move_in_date,
          is_active: groupData.is_active,
          members: groupData.members.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            group_id: m.group_id,
            join_date: m.join_date,
            status: m.status,
            bio: m.bio || '',
            support_level: (m.support_level || 'none') as SupportLevel,
            is_admin: m.is_admin,
            user_profile: {
              first_name: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].first_name || 'User' 
                : 'User',
              last_name: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].last_name || '' 
                : '',
              avatar_url: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].avatar_url || null 
                : null,
              // Include additional fields from user profile
              id: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].id || '' 
                : '',
              age_range: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].age_range || null 
                : null,
              bio: m.profiles && Array.isArray(m.profiles) && m.profiles.length > 0 
                ? m.profiles[0].bio || null 
                : null
            }
          }))
        };

        setGroup(transformedGroup);
        
        // Check if the current user is already a member
        if (userId) {
          const memberRecord = transformedGroup.members.find(m => m.user_id === userId);
          setUserMembership(memberRecord || null);
        }

        // Fetch the housing listing summary
        if (groupData.listing_id) {
          try {
            const { data: listingData, error: listingError } = await supabase
              .from('housing_listings')
              .select(`
                id,
                title,
                address,
                suburb,
                weekly_rent,
                available_from,
                media_urls
              `)
              .eq('id', groupData.listing_id)
              .single();

            if (listingError) {
              console.error('Error fetching listing:', listingError);
            } else {
              setListing(listingData);
            }
          } catch (listingErr) {
            console.error('Error in listing fetch:', listingErr);
            // Continue without listing data rather than failing the whole operation
          }
        }
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmJoinGroup = () => {
    if (!userId) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to join housing groups.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => router.push('/auth' as any) // Type assertion for router path
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Join Group',
      'Would you like to request to join this housing group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: handleJoinGroup }
      ]
    );
  };

  const handleJoinGroup = async () => {
    if (!userId) {
      confirmJoinGroup(); // This will handle the sign-in flow
      return;
    }

    try {
      setJoining(true);

      // Check if user is already a member
      if (userMembership) {
        Alert.alert('Already in group', 'You are already a member or have a pending request to join this group.');
        setJoining(false);
        return;
      }

      // Special handling for test groups - completely avoid database queries
      if (typeof id === 'string' && id.startsWith('test-')) {
        console.log('Handling join request for test group');
        
        // For test groups, just update the local state
        const newMembership: ExtendedGroupMember = {
          id: `${id}-member-${Date.now()}`,
          user_id: userId,
          group_id: id,
          join_date: new Date().toISOString(),
          status: 'pending',
          bio: '',
          support_level: 'none',
          is_admin: false,
          user_profile: {
            id: userId,
            first_name: 'You',
            last_name: '',
            avatar_url: null,
            age_range: null,
            bio: null
          }
        };
        
        // Update the group with the new member
        if (group) {
          group.members.push(newMembership);
          setUserMembership(newMembership);
        }
        
        Alert.alert(
          'Request Sent',
          'Your request to join this group has been sent. This is a demo group, so your request is automatically processed.',
          [{ text: 'OK' }]
        );
        
        setJoining(false);
        return;
      }

      // Only do database operations for real UUIDs from here
      
      // First check if the user already has a membership record
      const { data: existingMember, error: checkError } = await supabase
        .from('housing_group_members')
        .select('id, status')
        .eq('group_id', id)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (checkError) {
        console.error('Error checking existing membership:', checkError);
      }
      
      if (existingMember) {
        // User already has a membership record
        Alert.alert(
          'Already Requested',
          `You already have a ${existingMember.status} request for this group.`,
          [{ text: 'OK' }]
        );
        setJoining(false);
        return;
      }

      // Add the user to the housing group members with pending status
      const { error } = await supabase
        .from('housing_group_members')
        .insert({
          user_id: userId,
          group_id: id,
          join_date: new Date().toISOString(),
          status: 'pending',
          support_level: 'none',
          is_admin: false
        });

      if (error) {
        console.error('Error joining group:', error);
        throw handleApiError(error);
      }

      // Update the local state to reflect the new membership
      const newMembership: ExtendedGroupMember = {
        id: `temp-${Date.now()}`, // Temporary ID until we reload
        user_id: userId,
        group_id: id,
        join_date: new Date().toISOString(),
        status: 'pending',
        bio: '',
        support_level: 'none',
        is_admin: false,
        user_profile: {
          id: '',
          first_name: 'You',
          last_name: '',
          avatar_url: null,
          age_range: null,
          bio: null
        }
      };
      
      // Update local state immediately instead of reloading
      setUserMembership(newMembership);
      
      Alert.alert(
        'Request Sent',
        'Your request to join this group has been sent. You can check the status in your profile.',
        [{ text: 'OK' }]
      );

      // Try to reload group details to reflect the change, but don't depend on it
      try {
        await loadGroupDetails();
      } catch (reloadError) {
        console.warn('Could not reload group details, but join request was successful:', reloadError);
        // Continue with updated local state
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'There was a problem sending your request. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Compute approved members for display
  const approvedMembers: ExtendedGroupMember[] = group?.members.filter(
    (member): member is ExtendedGroupMember => member.status === 'approved'
  ) || [];

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Group Living Opportunity" showBackButton={true} onBackPress={handleBackPress} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </View>
    );
  }

  if (!group || !listing) {
    return (
      <View style={styles.container}>
        <AppHeader title="Group Living Opportunity" showBackButton={true} onBackPress={handleBackPress} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found or no longer available.</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const remainingSpots = group.max_members - approvedMembers.length;

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Group Living Opportunity" 
        showBackButton={true} 
        onBackPress={handleBackPress} 
        rightElement={<Filter size={24} color="#000" />} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Property Summary */}
        {listing && (
          <View style={styles.propertySummary}>
            <Image 
              source={{ uri: listing.media_urls[0] || 'https://via.placeholder.com/100' }} 
              style={styles.propertyImage} 
            />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{listing.title}</Text>
              <Text style={styles.propertyAddress}>{listing.address}</Text>
              <Text style={styles.propertyPrice}>${listing.weekly_rent}/wk | Available from {formatMoveInDate(listing.available_from)}</Text>
            </View>
          </View>
        )}

        {/* Group Members */}
        <View style={styles.membersContainer}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <Text style={styles.sectionSubtitle}>
            {approvedMembers.length} of {group.max_members} spots filled, {remainingSpots} remaining
          </Text>
          
          {approvedMembers.length > 0 ? (
            // Cast to 'any' to work around the type checking issues
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (approvedMembers as any[]).map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <Image 
                    source={{ uri: member.user_profile?.avatar_url || 'https://via.placeholder.com/60' }} 
                    style={styles.memberAvatar} 
                  />
                  <View style={styles.memberTitleContainer}>
                    <Text style={styles.memberName}>
                      {member.user_profile?.first_name || 'User'} {(member.user_profile?.last_name || '').charAt(0)}.
                    </Text>
                    <View style={styles.memberTags}>
                      <Text style={styles.ageTag}>
                        {member.user_profile?.age_range || '25–34'}
                      </Text>
                      {member.is_admin && (
                        <Text style={styles.adminTag}>
                          Admin
                        </Text>
                      )}
                      <View style={[styles.supportTag, { backgroundColor: supportLevelColors[member.support_level as SupportLevel] }]}>
                        <Text style={styles.supportTagText}>
                          {supportLevelLabels[member.support_level as SupportLevel]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {member.bio && (
                  <View style={styles.memberBio}>
                    <Text style={styles.bioText}>{member.bio}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>No members yet</Text>
            </View>
          )}
        </View>

        {/* Remaining Spots */}
        {remainingSpots > 0 && (
          <View style={styles.remainingSpotsContainer}>
            <Text style={styles.remainingSpotsTitle}>
              Looking for {remainingSpots} more {remainingSpots === 1 ? 'person' : 'people'}
            </Text>
            {group.move_in_date && (
              <Text style={styles.moveInDate}>
                Hoping to move in by {formatMoveInDate(group.move_in_date)}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Join Button */}
      <View style={styles.bottomButtonContainer}>
        <View style={styles.joinContainer}>
          {!userMembership ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinGroup}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Users size={18} color="#fff" style={styles.joinButtonIcon} />
                  <Text style={styles.joinButtonText}>Request to Join Group</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.membershipStatusContainer}>
              <Text style={styles.membershipStatusLabel}>
                Your request status: 
              </Text>
              <Text
                style={[
                  styles.membershipStatus,
                  {
                    color:
                      userMembership.status === 'approved'
                        ? '#4CAF50'
                        : userMembership.status === 'pending'
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              >
                {userMembership.status.charAt(0).toUpperCase() + userMembership.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  propertySummary: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 14,
    color: '#666',
  },
  membersContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  memberCard: {
    marginBottom: 20,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  memberTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ageTag: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  adminTag: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  supportTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  supportTagText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  memberBio: {
    padding: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noMembersContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMembersText: {
    fontSize: 16,
    color: '#666',
  },
  remainingSpotsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  remainingSpotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  moveInDate: {
    fontSize: 14,
    color: '#666',
  },
  bottomButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  joinContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#2E4B36',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  joinButtonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  membershipStatusContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  membershipStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  membershipStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
});
