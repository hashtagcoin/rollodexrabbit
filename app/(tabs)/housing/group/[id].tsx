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
  SafeAreaView,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../providers/AuthProvider';
import { handleApiError } from '../../../../lib/errorUtils';
import {
  ChevronLeft,
  Users,
  User,
  HeartHandshake,
  MapPin,
  Calendar,
  MessageSquare,
  Heart,
  Share as ShareIcon,
} from 'lucide-react-native';
import { HousingGroup, SupportLevel, GroupMember } from '../types/housing';

// Extend the GroupMember and related user profile types to include additional fields
interface ExtendedUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age_range?: string | null;
  bio?: string | null;
  gender?: string | null;
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
  high: 'High Support',
};

const supportLevelColors: Record<SupportLevel, string> = {
  none: '#dddddd',
  light: '#a5d6a7', // Lighter Green
  moderate: '#ffcc80', // Lighter Orange
  high: '#ef9a9a', // Lighter Red
};

const ageRangeColors: Record<string, string> = {
  '18-24': '#8e44ad', // Purple
  '25-34': '#3498db', // Blue
  '35-44': '#2980b9', // Darker Blue
  '45+': '#16a085', // Teal
};

const genderColors: Record<string, string> = {
  'Male': '#2c3e50',
  'Female': '#c0392b',
  'Non-binary': '#27ae60',
  'Other': '#d35400',
};

const lighterBlue = '#589AF0'; // Define lighter blue
const lightBlueBackground = '#EAF2FF'; // Define light blue background

export default function HousingGroupDetail() {
  const { id, action } = useLocalSearchParams<{ id: string; action: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<ExtendedHousingGroup | null>(null);
  const [listing, setListing] = useState<HousingListingSummary | null>(null);
  const [userMembership, setUserMembership] = useState<ExtendedGroupMember | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'member' | 'error'>('idle');

  // Format date as Month Day
  const formatMoveInDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Handle navigation back
  const handleBack = () => {
    router.back();
  };

  // Handle sharing the group
  const handleShare = async () => {
    if (!group || !listing) return;
    try {
      await Share.share({
        message: `Check out this Group Living Opportunity on Rollodex: ${listing.title} at ${listing.address}. More info: [Link to Group/Listing if available]`, // Replace with actual link if possible
        title: `Group Opportunity: ${listing.title}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // Load group details when the ID changes
  useEffect(() => {
    if (!id || !userId) {
      if (!id) {
        console.log("Group ID is missing.");
        // Optionally handle missing ID error (e.g., show message, navigate back)
        setLoading(false);
        return;
      }
      // If only userId is missing, maybe wait or handle guest state?
      // For now, we'll proceed assuming userId will become available.
      // If it stays null, the fetch might fail gracefully or require specific handling.
      console.log("Waiting for user session...");
      // setLoading(true); // Keep loading state potentially
      return; // Don't fetch yet if userId is missing
    }

    // Check if this is a test group ID
    if (typeof id === 'string' && id.startsWith('test-')) {
      console.log('Loading test group data');
      handleTestGroup(id as string);
      return;
    }

    loadGroupDetails(id, userId); // Pass userId
  }, [id, userId]); // Re-run if id or userId changes

  // Handle join action if provided
  useEffect(() => {
    if (action === 'join' && group && !userMembership) {
      confirmJoinGroup();
    }
  }, [action, group, userMembership]);

  // Load group details from the database
  const loadGroupDetails = async (groupId: string, currentUserId: string) => {
    console.log(`Loading real group details for ID: ${groupId} and User: ${currentUserId}`);
    setLoading(true);
    try {
      // 1. Fetch Group Details (including listing and members with profiles)
      const { data: groupData, error: groupError } = await supabase
        .from('housing_groups')
        .select(`
          *,
          listing:housing_listings (*),
          members:housing_group_members (
            *,
            user_profile:user_profiles (*)
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!groupData) throw new Error('Group not found.');

      setGroup(groupData as ExtendedHousingGroup);
      setListing(groupData.listing as HousingListingSummary);

      // 2. Fetch Current User's Membership Status for this group
      const { data: membershipData, error: membershipError } = await supabase
        .from('housing_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
        .maybeSingle(); // Use maybeSingle as user might not be a member

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
        // Decide how to handle - maybe allow viewing but disable join button?
        // For now, assume 'idle' if fetch fails
        setRequestStatus('idle'); // Or set to 'error'?
      } else if (membershipData) {
        setUserMembership(membershipData as ExtendedGroupMember);
        // Set initial request status based on fetched data
        setRequestStatus(membershipData.status === 'pending' ? 'pending' : 'member');
        console.log("User membership status:", membershipData.status);
      } else {
        setUserMembership(null);
        setRequestStatus('idle'); // User is not a member and hasn't requested
        console.log("User is not a member of this group.");
      }

      // 3. Check if favorite (optional, implement if needed)
      // await checkFavoriteStatus(groupId, currentUserId);

    } catch (error) {
      console.error('Error loading real group details:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
      setGroup(null); // Clear data on error
      setListing(null);
      setUserMembership(null);
      setRequestStatus('idle'); // Reset status on error
    } finally {
      setLoading(false);
    }
  };

  // Handle test group data
  const handleTestGroup = async (groupId: string) => {
    if (groupId.startsWith('test-')) {
      try {
        // Real user IDs from our database for testing
        const realUserIds = [
          '7a9ed413-a880-43d1-aeb0-33805d00a3c8', // support_coordinator@example.com
          'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8', // ryan_h@example.com
          'd5e1fa56-80b7-4e51-9012-3baac98f2b9e', // lily_w@example.com
          'fc178f8d-6b47-40be-beaf-462e1c7f31a3', // dhdhd@gfgf.com
          '9e4fffdc-6dbc-40b0-8601-abcfdd9c4af4', // bash@gmaikl.com
        ];

        // Extract listing ID part from test group ID
        const listingId = groupId.split('-')[1];

        // Create test listing data
        const listingData = {
          id: `${listingId}`,
          title: 'Greenwood House',
          address: '26 Maple St',
          suburb: 'Richmond',
          weekly_rent: 420,
          available_from: '2025-05-01T00:00:00.000Z',
          media_urls: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
        };

        // Use current user ID or fall back to a test ID
        const currentUserId = userId || realUserIds[0];

        // Create test group data
        const testGroup: ExtendedHousingGroup = {
          id: groupId,
          name: 'Group Living Opportunity',
          description: 'A shared living opportunity',
          listing_id: listingData.id,
          max_members: 4,
          current_members: 3,
          creator_id: currentUserId,
          created_at: new Date().toISOString(),
          move_in_date: new Date('2025-05-01').toISOString(),
          is_active: true,
          members: [
            {
              id: `${groupId}-member1`,
              user_id: realUserIds[0],
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: 'Loves gardening and quiet nights. Needs part-time support.',
              support_level: 'light' as SupportLevel,
              is_admin: true,
              user_profile: {
                id: realUserIds[0],
                first_name: 'Sarah',
                last_name: 'M.',
                avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
                age_range: '35-44',
                bio: 'Loves gardening and quiet nights.',
                gender: 'Female',
              },
            },
            {
              id: `${groupId}-member2`,
              user_id: realUserIds[1],
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: 'Friendly and active, enjoys sports and being outdoors.',
              support_level: 'high' as SupportLevel,
              is_admin: false,
              user_profile: {
                id: realUserIds[1],
                first_name: 'David',
                last_name: 'K.',
                avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
                age_range: '45+',
                bio: 'Friendly and active, enjoys sports and being outdoors.',
                gender: 'Male',
              },
            },
            {
              id: `${groupId}-member3`,
              user_id: realUserIds[2],
              group_id: groupId,
              join_date: new Date().toISOString(),
              status: 'approved',
              bio: 'Easygoing and loves animals.',
              support_level: 'moderate' as SupportLevel,
              is_admin: false,
              user_profile: {
                id: realUserIds[2],
                first_name: 'Jess',
                last_name: 'B.',
                avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
                age_range: '25-34',
                bio: 'Easygoing and loves animals.',
                gender: 'Female',
              },
            },
          ],
        };

        setGroup(testGroup);
        setListing(listingData);

        // Check if current user is a member
        if (userId) {
          const memberRecord = testGroup.members.find((m) => m.user_id === userId);
          if (memberRecord) {
            setUserMembership(memberRecord);
            setRequestStatus('member');
          }
        }

        setLoading(false);
        return testGroup;
      } catch (error) {
        console.error('Error creating test group:', error);
        setLoading(false);
        return null;
      }
    }
    setLoading(false);
    return null;
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);

    // In a real implementation, we would save this to the database
    // For demo purposes, we'll just show an alert
    if (!isFavorite) {
      Alert.alert(
        'Added to Favorites',
        'This housing group has been added to your favorites.',
      );
    } else {
      Alert.alert(
        'Removed from Favorites',
        'This housing group has been removed from your favorites.',
      );
    }
  };

  // Show join confirmation dialog
  const confirmJoinGroup = () => {
    if (!userId) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to join housing groups.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.replace('/'), // Navigate to home screen instead
          },
        ],
      );
      return;
    }

    Alert.alert(
      'Join Group',
      'Would you like to request to join this housing group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: handleJoinGroup },
      ],
    );
  };

  // Handle joining the group
  const handleJoinGroup = async () => {
    if (!userId) {
      confirmJoinGroup();
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

      // For test groups, just update the local state
      if (typeof id === 'string' && id.startsWith('test-')) {
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
            bio: null,
          },
        };

        // Update the group with the new member
        if (group) {
          const updatedGroup = { ...group };
          updatedGroup.members.push(newMembership);
          setGroup(updatedGroup);
          setUserMembership(newMembership);
        }

        setRequestStatus('pending');

        Alert.alert(
          'Request Sent',
          'Your request to join this group has been sent. You will be notified when the group admin approves your request.',
          [{ text: 'OK' }],
        );

        setJoining(false);
        return;
      }

      // For real groups, we would handle database operations here
      setJoining(false);
      Alert.alert('Success', 'Your request to join this group has been sent.');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Living Opportunity</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No group found state
  if (!group || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Living Opportunity</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.noGroupContainer}>
          <Text style={styles.noGroupText}>This housing group couldn't be found.</Text>
          <TouchableOpacity onPress={handleBack} style={styles.backToListingButton}>
            <Text style={styles.backToListingText}>Back to Listing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name || 'Group Details'}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerRight}>
          <ShareIcon size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Fixed property info card */}
      <View style={styles.propertyCard}>
        <Image source={{ uri: listing.media_urls[0] }} style={styles.propertyImage} />
        <View style={styles.propertyInfo}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyName}>{listing.title}</Text>
            <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
              <Heart size={24} color={isFavorite ? "#ff4757" : "#666"} fill={isFavorite ? "#ff4757" : "none"} />
            </TouchableOpacity>
          </View>
          <Text style={styles.propertyAddress}>{listing.address}</Text>
          <Text style={styles.propertyPrice}>${listing.weekly_rent}/wk | Available from {formatMoveInDate(listing.available_from)}</Text>
        </View>
      </View>

      {/* Scrollable members list */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.membersList}>
          {group.members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <Image
                source={{
                  uri: member.user_profile.avatar_url ||
                  `https://randomuser.me/api/portraits/${member.user_profile.gender === 'Male' ? 'men' : 'women'}/44.jpg`,
                }}
                style={styles.memberAvatar}
              />
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{member.user_profile.first_name} {member.user_profile.last_name}</Text>
                  <View style={styles.memberDetails}>
                    <View style={[styles.labelContainer, styles.ageLabel]}>
                      <Text style={styles.labelText}>{member.user_profile.age_range}</Text>
                    </View>
                    {member.user_profile.gender && (
                      <View style={[styles.labelContainer, styles.genderLabel]}>
                        <Text style={styles.labelText}>{member.user_profile.gender}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.supportLevelContainer}>
                  <View
                    style={[
                      styles.labelContainer,
                      styles.supportLabel,
                      { backgroundColor: supportLevelColors[member.support_level] },
                    ]}
                  >
                    <Text style={[styles.supportLabelText, { paddingHorizontal: 4 }]}> {supportLevelLabels[member.support_level]}</Text>
                  </View>
                </View>
                <Text style={styles.memberBio}>{member.bio}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer with looking for more section and join button */}
      <View style={styles.footer}>
        <View style={styles.lookingForMore}>
          <View style={styles.lookingForContent}>
            <View>
              <Text style={styles.lookingForText}>Looking for 1 more person</Text>
              <Text style={styles.moveInDate}>Hoping to move in by {group.move_in_date ? formatMoveInDate(group.move_in_date) : 'May 1'}</Text>
            </View>
            <TouchableOpacity style={styles.chatButton}>
              <MessageSquare size={24} color="#007AFF" />
              <Text style={styles.chatButtonText}>Group Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.joinButton}
          onPress={confirmJoinGroup}
          disabled={joining || requestStatus === 'pending' || requestStatus === 'member'}
        >
          {joining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.joinButtonText}>
              {requestStatus === 'member'
                ? 'Already a Member'
                : requestStatus === 'pending'
                ? 'Request Pending'
                : 'Request to Join Group'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  backButton: {
    padding: 4,
    width: 40, // Ensure consistent width for alignment
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    padding: 4,
    width: 40, // Ensure consistent width for alignment
    alignItems: 'flex-end', // Align icon to the right
  },
  propertyCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteButton: {
    padding: 2,
  },
  propertyImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  propertyPrice: {
    fontSize: 14,
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  membersList: {
    paddingBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelContainer: {
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 0, 
    backgroundColor: lightBlueBackground,
    alignSelf: 'flex-start', 
  },
  labelText: {
    color: lighterBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  ageLabel: {},
  genderLabel: {},
  supportLabel: {
    // Background color is set dynamically
  },
  supportLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 4, 
  },
  supportLevelContainer: {
    marginBottom: 6,
  },
  memberBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  lookingForMore: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 16,
  },
  lookingForContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatButton: {
    alignItems: 'center',
    padding: 4,
  },
  chatButtonText: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 2,
  },
  lookingForText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  moveInDate: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noGroupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noGroupText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  backToListingButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToListingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
