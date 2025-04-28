import React, { useState, useEffect, useCallback } from 'react';
import { RemoteImageWithPlaceholder } from './RemoteImageWithPlaceholder'; // Kept unused import
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert, // Kept unused import
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../providers/AuthProvider';
import { handleApiError } from '../../../../lib/errorUtils'; // Reverted path
import {
  ChevronLeft,
  Filter, // Kept unused import
  Heart, // Kept unused import
  User, // Kept unused import
  Users, // Kept unused import
  HeartHandshake, // Kept unused import
  MapPin, // Kept unused import
  Calendar, // Kept unused import
} from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader'; // Kept unused import
import { HousingGroup, GroupMember } from '../types/housing';
import { type Database } from '../types/database.types'; // Adjusted path

// Define Tables type from Supabase generated types
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]; // Kept unused type
type UserProfileType = Tables<'user_profiles'>; // Define UserProfileType

// Extend the GroupMember and related user profile types to include additional fields
interface ExtendedUserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sex: string | null;
  bio?: string | null;
}

interface ExtendedGroupMember extends Omit<Tables<'housing_group_members'>, 'user_profile' | 'bio' | 'support_level'> {
  user_profile: ExtendedUserProfile;
  support_level: string | null;
  bio?: string | null;
}

interface ExtendedHousingGroup extends Omit<HousingGroup, 'members'> {
  members: ExtendedGroupMember[];
  description: string;
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

export default function HousingGroupDetail() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  console.log('GroupDetail: received id param:', id);
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<ExtendedHousingGroup | null>(null);
  const [listing, setListing] = useState<HousingListingSummary | null>(null);
  const [userMembership, setUserMembership] = useState<ExtendedGroupMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarErrorStates, setAvatarErrorStates] = useState<{ [key: number]: boolean }>({}); // Use object for sparse state

  // Format date as Month Day
  const formatMoveInDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'; // Handle null/undefined case
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date'; // Handle invalid date strings
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };


  // Load group details from database
  const loadGroupDetails = useCallback(async () => {
    // Ensure both id and userId are present before fetching
    if (!id || !userId) {
      console.log('Waiting for id or userId...', { id, userId });
      if (!id) setError('Group ID is missing.');
      setLoading(false); // Stop loading if prerequisites aren't met
      return;
    }

    setLoading(true);
    setError(null);
    setGroup(null); // Reset group state on reload
    setListing(null); // Reset listing state on reload
    setUserMembership(null); // Reset membership state
    setAvatarErrorStates({}); // Reset avatar errors

    console.log(`Querying details for Housing Group ID: ${id} by User ID: ${userId}`);

    const profileSelect = `
      id,
      full_name,
      avatar_url,
      sex,
      bio
    `;

    try {
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
          is_active
        `)
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle to handle not found gracefully

      if (groupError) throw groupError;
      if (!groupData) {
         setError('Housing group not found.');
         setLoading(false);
         return; // Stop execution if group not found
      }

      console.log(`Found group: ${groupData.name}, Listing ID: ${groupData.listing_id}`);

      const [listingResult, membersResult, userMembershipResult] = await Promise.all([
        groupData.listing_id
          ? supabase.from('housing_listings').select(`id, title, address, suburb, weekly_rent, available_from, media_urls`).eq('id', groupData.listing_id).single()
          : Promise.resolve({ data: null, error: null }), // Handle case where listing_id might be null
        supabase
          .from('housing_group_members')
          .select(`
            id,
            user_id,
            group_id,
            join_date,
            status,
            support_level,
            is_admin,
            bio
          `)
          .eq('group_id', id)
          .eq('status', 'approved'),
        supabase
          .from('housing_group_members')
          .select(`
            id,
            user_id,
            group_id,
            join_date,
            status,
            support_level,
            is_admin,
            bio
          `)
          .eq('group_id', id)
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      // Check errors for each promise
      if (listingResult.error && listingResult.error.code !== 'PGRST116') { // Ignore 'not found' for listing if optional
         console.warn('Error fetching listing:', listingResult.error);
         // Decide if this is a fatal error or if the page can still render
      }
      if (membersResult.error) throw membersResult.error;
      if (userMembershipResult.error) throw userMembershipResult.error;


      const fetchedListing = listingResult.data;
      const fetchedMembersData = membersResult.data || [];
      const fetchedUserMembershipData = userMembershipResult.data;

      const userIds = new Set<string>();
      fetchedMembersData.forEach(m => userIds.add(m.user_id));
      if (fetchedUserMembershipData) {
        userIds.add(fetchedUserMembershipData.user_id);
      }

      let userProfilesMap = new Map<string, ExtendedUserProfile>();
      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select(profileSelect)
          .in('id', Array.from(userIds));

        if (profilesError) throw profilesError;

        profilesData?.forEach(profile => {
          const mappedProfile: ExtendedUserProfile = {
            id: profile.id,
            full_name: profile.full_name || 'Unknown User',
            avatar_url: profile.avatar_url || null,
            sex: profile.sex || null,
            bio: profile.bio || null
          };
          userProfilesMap.set(profile.id, mappedProfile);
        });
      }

      const processedMembers: ExtendedGroupMember[] = fetchedMembersData
        .map((m) => {
          const userProfile = userProfilesMap.get(m.user_id) || {
            id: m.user_id,
            full_name: 'Unknown User',
            avatar_url: null,
            sex: null,
            bio: null
          };
          return {
            id: m.id,
            user_id: m.user_id,
            group_id: m.group_id,
            join_date: m.join_date,
            status: m.status,
            is_admin: m.is_admin,
            support_level: m.support_level || 'none',
            user_profile: userProfile,
            bio: m.bio ?? userProfile.bio ?? null,
          };
        });

      let fetchedUserMembership: ExtendedGroupMember | null = null;
      if (fetchedUserMembershipData) {
        const userProfile = userProfilesMap.get(fetchedUserMembershipData.user_id) || {
          id: fetchedUserMembershipData.user_id,
          full_name: 'You', // Or fetch profile name if preferred
          avatar_url: null, // Or fetch profile avatar
          sex: null,
          bio: null
        };
        fetchedUserMembership = {
          id: fetchedUserMembershipData.id,
          user_id: fetchedUserMembershipData.user_id,
          group_id: fetchedUserMembershipData.group_id,
          join_date: fetchedUserMembershipData.join_date,
          status: fetchedUserMembershipData.status,
          is_admin: fetchedUserMembershipData.is_admin,
          user_profile: userProfile,
          support_level: fetchedUserMembershipData.support_level || 'none',
          bio: fetchedUserMembershipData.bio ?? userProfile.bio ?? null,
        };
      }

      setListing(fetchedListing as HousingListingSummary | null); // Assert type or handle null
      setGroup({
        ...groupData,
        description: groupData.description || 'No description provided.',
        // Use actual members count for current_members, not the potentially outdated DB value
        current_members: processedMembers.length,
        members: processedMembers,
      });
      setUserMembership(fetchedUserMembership);

      console.log('Successfully loaded group details, listing, members, and user status.');
    } catch (error: any) {
      console.error('Error in loadGroupDetails:', error?.message || 'An unexpected error occurred');
      const processedError = handleApiError(error);
      setError(processedError?.message || 'Failed to load group details.'); // Fix: Extract .message
    } finally {
      setLoading(false);
    }
  }, [id, userId]); // Dependencies for useCallback


  // Effect to load details when id or userId changes
  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]); // Depend on the memoized loadGroupDetails


  // *** FIX 2: Define joinGroupHandler ***
  const joinGroupHandler = async () => {
    if (!group || !userId || joining) return; // Added check for 'joining' state

    setJoining(true); // Set joining state
    setError(null);
    try {
      const { error: insertError } = await supabase.from('housing_group_members').insert([
        {
          user_id: userId,
          group_id: group.id,
          status: 'pending', // Default status
          join_date: new Date().toISOString(),
          is_admin: false, // Default non-admin
        },
      ]);
      if (insertError) throw insertError;

      console.log('Successfully requested to join group.');
      // Refresh details to show pending status
      await loadGroupDetails();

    } catch (err: any) { // Renamed 'error' to 'err' for clarity
       console.error('Error joining group:', err);
       const processedError = handleApiError(err);
       setError(processedError?.message || 'Failed to join group'); // Fix: Extract .message
       // Optionally use Alert for user feedback (import is present)
       // Alert.alert('Error', processedError?.message || 'Failed to join group');
    } finally {
      setJoining(false); // Reset joining state
    }
  };

  // *** FIX 3: Define handleAvatarError ***
  const handleAvatarError = (index: number) => {
    console.log(`Avatar failed to load for member at index: ${index}`);
    setAvatarErrorStates(prev => ({ ...prev, [index]: true }));
  };


  // --- RENDER LOGIC ---

  // Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Group Details...</Text>
      </View>
    );
  }

  // Error State (after loading attempt)
  if (error && !group) { // Show error only if loading failed and group isn't loaded
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
            {/* Optional: Add Back Button even on error */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOnError}>
              <ChevronLeft size={24} color="#333" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadGroupDetails} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Group Not Found State (specific case after loading finishes without error but no data)
  if (!group) {
     return (
        <SafeAreaView style={styles.safeArea}>
           <View style={styles.errorContainer}>
              {/* Optional: Add Back Button */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOnError}>
                 <ChevronLeft size={24} color="#333" />
                 <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.errorText}>Group not found.</Text>
               {/* Optionally allow retry */}
               <TouchableOpacity onPress={loadGroupDetails} style={styles.retryButton}>
                 <Text style={styles.retryButtonText}>Retry Load</Text>
               </TouchableOpacity>
           </View>
        </SafeAreaView>
     );
  }


  // --- RENDER ACTUAL CONTENT ---
  // If loading is false, no major error preventing display, and group exists
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Scrollable content area */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Listing Header */}
        {listing ? (
          <TouchableOpacity
            style={styles.listingCard}
            activeOpacity={0.8}
            onPress={() => {
              // Navigate to listing detail page if needed
               console.log('Navigate to Listing ID:', listing.id);
              // Example navigation: router.push(`/housing/listings/${listing.id}`);
            }}
          >
            <Image
              source={listing.media_urls && listing.media_urls.length > 0
                ? { uri: listing.media_urls[0] } // Use first image
                // Fallback to placeholder if needed - Ensure you have this asset
                : require('../../../../assets/images/placeholder.png')}
              style={styles.listingImage}
              resizeMode="cover" // Ensure image covers the area
            />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.listingAddress} numberOfLines={1}>{listing.address}, {listing.suburb}</Text>
              <Text style={styles.listingPrice}>${listing.weekly_rent}/week</Text>
            </View>
          </TouchableOpacity>
        ) : (
            <View style={[styles.listingCard, styles.placeholderCard]}>
                <Text>No associated listing found.</Text>
            </View>
        )}

        {/* Group Details Card */}
        <View style={styles.groupDetailsCard}>
          <Text style={styles.groupName}>{group.name}</Text>
           <View style={styles.separatorThin} />
          <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              {/* Changed listingSubtitle style to detailValue for consistency */}
              <Text style={styles.detailValue}>{group.description || 'N/A'}</Text>
          </View>
           <View style={styles.separatorThin} />
          <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Move-in Date:</Text>
               {/* Changed listingSubtitle style to detailValue for consistency */}
              <Text style={styles.detailValue}>{formatMoveInDate(group.move_in_date)}</Text>
          </View>
        </View>


        {/* Members Card */}
        <View style={styles.membersCard}>
           <Text style={styles.sectionTitle}>
               Members ({group.current_members}/{group.max_members})
           </Text>
          {group.members.length > 0 ? (
            group.members.map((member, index) => (
              <View key={member.id || index} style={styles.memberItem}>
                 {/* Member Avatar with Placeholder Logic */}
                 {avatarErrorStates[index] || !member.user_profile.avatar_url ? (
                    <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarPlaceholderText}>
                            {member.user_profile.full_name ? member.user_profile.full_name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                 ) : (
                   <Image
                     source={{ uri: member.user_profile.avatar_url }} // Use avatar_url directly
                     style={styles.memberAvatar}
                     onError={() => handleAvatarError(index)} // Use defined handler
                     resizeMode="cover"
                   />
                 )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user_profile.full_name || 'Unknown User'}</Text>
                  <View style={styles.memberTags}>
                     {member.support_level && member.support_level !== 'none' && (
                         <View style={[styles.tag, styles.supportTag]}>
                           <Text style={styles.tagTextSupport}>{member.support_level}</Text> {/* Use specific text style */}
                         </View>
                     )}
                     {member.is_admin && (
                        <View style={[styles.tag, styles.adminTag]}>
                           <Text style={styles.tagTextAdmin}>Admin</Text> {/* Use specific text style */}
                        </View>
                     )}
                  </View>
                  {member.bio && <Text style={styles.memberBio} numberOfLines={2}>{member.bio}</Text>}
                </View>
              </View>
            ))
          ) : (
             <View>
               <Text style={styles.noMembersText}>No members have joined yet.</Text>
             </View>
          )}
        </View>

        {/* Looking For Section (Removed as per previous correction, re-add if needed) */}
        {/*
        <View style={styles.lookingForSection}>
          <Text style={styles.lookingForTitle}>Looking for:</Text>
          <Text style={styles.lookingForSubtitle}>{group?.description}</Text>
        </View>
        */}

        {/* Action Button Logic */}
        <View style={styles.actionButtonsContainer}>
          {userMembership ? ( // User has some status in the group
            <View // Use View instead of TouchableOpacity for non-interactive states
              style={[
                styles.actionButton,
                userMembership.status === 'approved' ? styles.alreadyMemberButton : styles.pendingButton,
              ]}
            >
              <Text style={styles.actionButtonText}>
                {userMembership.status === 'pending' ? 'Request Pending' : 'You are a Member'}
              </Text>
            </View>
          ) : ( // User is not in the group and has no pending request
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.joinButton,
                (joining || group.current_members >= group.max_members) && styles.disabledButton // Disable if joining or group is full
              ]}
              onPress={joinGroupHandler}
              disabled={joining || group.current_members >= group.max_members} // Prevent action when joining or full
            >
               <Text style={styles.actionButtonText}>
                  {joining ? 'Sending Request...' :
                   group.current_members >= group.max_members ? 'Group Full' : 'Request to Join'}
               </Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// *** FIX 1: Removed the extra closing brace that was here ***

// --- Styles --- (Includes styles from previous correction)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F5F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
   backButtonOnError: {
     position: 'absolute',
     top: 16,
     left: 16,
     flexDirection: 'row',
     alignItems: 'center',
     padding: 8,
   },
  backButtonText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Listing Card Styles
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 200,
  },
  listingInfo: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#172B4D',
    marginBottom: 4,
  },
   // Added back listingSubtitle style (if needed elsewhere, or replace its usages)
  listingSubtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
  },
  listingAddress: {
    fontSize: 14,
    color: '#6B778C',
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 16,
    color: '#0052CC',
    fontWeight: 'bold',
  },
  placeholderCard: {
     height: 150,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#EFEFEF',
  },
  // Group Details Card Styles
  groupDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172B4D',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B778C',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#172B4D',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  separatorThin: {
     height: 1,
     backgroundColor: '#EBECF0',
     marginVertical: 12,
  },
   // Added back separator style (if needed elsewhere)
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24, // Note: Different margin than separatorThin
  },
  // Members Card Styles
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18, // Adjusted from 20 to 18
    fontWeight: 'bold',
    color: '#172B4D',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBECF0',
  },
   // Added back memberCard style definition (if needed elsewhere)
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memberAvatar: {
    width: 50, // Adjusted from 60 to 50
    height: 50, // Adjusted from 60 to 50
    borderRadius: 25, // Adjusted from 30 to 25
    marginRight: 12, // Adjusted from 16 to 12
    backgroundColor: '#DFE1E6',
  },
  memberAvatarPlaceholder: {
     width: 50,
     height: 50,
     borderRadius: 25,
     marginRight: 12,
     backgroundColor: '#0052CC',
     justifyContent: 'center',
     alignItems: 'center',
  },
  memberAvatarPlaceholderText: {
     color: '#FFFFFF',
     fontSize: 20,
     fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16, // Adjusted from 17 to 16
    fontWeight: '600',
    color: '#172B4D',
    marginBottom: 4, // Adjusted from 6 to 4
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6, // Adjusted from 8 to 6
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8', // Default background from original
  },
  tagText: { // Default text color from original tag style wasn't specified, using a sensible default
      fontSize: 11, // Adjusted from 12
      fontWeight: '500',
      color: '#555', // Default grey text
  },
  supportTag: {
    backgroundColor: '#E3FCEF',
    borderColor: '#00875A',
    borderWidth: 1,
  },
  tagTextSupport: { // Specific text style for support tag
    fontSize: 11,
    fontWeight: '500',
    color: '#006644',
  },
  adminTag: {
     backgroundColor: '#DEEBFF',
     borderColor: '#0747A6',
     borderWidth: 1,
  },
   tagTextAdmin: { // Specific text style for admin tag
     fontSize: 11,
     fontWeight: '500',
     color: '#0747A6',
   },
  memberBio: {
    fontSize: 14,
    color: '#6B778C', // Adjusted from #444
    lineHeight: 20,
  },
  noMembersText: {
    textAlign: 'center',
    color: '#6B778C', // Adjusted from #777
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  // Looking For Section Styles (Added back from original)
  lookingForSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lookingForTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  lookingForSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  // Action Button Styles
  actionButtonsContainer: {
    marginTop: 10,
    paddingHorizontal: 0, // Match original (no horizontal padding here)
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Match corrected style
    shadowOpacity: 0.15, // Match corrected style
    shadowRadius: 3, // Match corrected style
    elevation: 2, // Match corrected style
    marginTop: 10, // Added from original style definition
    backgroundColor: '#007AFF', // Default blue from original
  },
  joinButton: {
    backgroundColor: '#28a745', // Green from original
  },
  alreadyMemberButton: {
    backgroundColor: '#6c757d', // Grey from original
  },
  pendingButton: {
    backgroundColor: '#ffc107', // Yellow from original
  },
  actionButtonText: {
    color: '#FFFFFF', // White from original
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#AEB6C1', // Use corrected disabled color
    opacity: 0.7,
     shadowOpacity: 0,
     elevation: 0,
  },
  // Error and Retry Styles
  errorText: {
    color: '#BF2600', // Use corrected error color
    fontSize: 16, // Use corrected size
    marginBottom: 16,
    textAlign: 'center',
  },
   // Added back 'centered' style definition
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Added alignItems
  },
  retryButton: {
    backgroundColor: '#1976d2', // Blue from original retry
    borderRadius: 6, // Original radius
    paddingVertical: 8, // Original padding
    paddingHorizontal: 20, // Original padding
    alignItems: 'center',
    marginTop: 8,
    // Removed shadow from corrected version to match original
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14, // Original size
    fontWeight: 'bold',
  },
});