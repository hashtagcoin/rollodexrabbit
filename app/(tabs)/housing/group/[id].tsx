import React, { useState, useEffect, useCallback } from 'react';
import { RemoteImageWithPlaceholder } from './RemoteImageWithPlaceholder';
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
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../providers/AuthProvider';
import { handleApiError } from '../../../../lib/errorUtils'; // Reverted path
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
import AppHeader from '../../../../components/AppHeader';
import { HousingGroup, GroupMember } from '../types/housing';
import { type Database } from '../types/database.types'; // Adjusted path

// Define Tables type from Supabase generated types
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
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
  // ...existing code...

  // Handler for joining group
  // ...existing state declarations...

    if (!group || !userId) return;
    setError(null);
    try {
      const { error } = await supabase.from('housing_group_members').insert([
        {
          user_id: userId,
          group_id: group.id,
          status: 'pending',
          join_date: new Date().toISOString(),
          is_admin: false,
        },
      ]);
      if (error) throw error;
      // Refresh membership state after join
      await loadGroupDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };
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
  const [avatarErrorStates, setAvatarErrorStates] = useState<boolean[]>([]);

  // Format date as Month Day
  const formatMoveInDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Load group details from database (only for real UUIDs)
  // Use useCallback to prevent unnecessary re-renders if passed as prop
  const loadGroupDetails = async () => {
    if (!id || !userId) return;

    setLoading(true);
    setError(null);

    console.log(`Querying details for Housing Group ID: ${id}`);

    // Define the fields needed from user_profiles
    const profileSelect = `
      id,
      full_name,
      avatar_url,
      sex,
      bio
    `;

    try {
      // Step 1: Fetch group, listing, members (base data), and user's membership (base data)
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
        .single();

      if (groupError) throw groupError;
      if (!groupData) throw new Error('Housing group not found.');

      console.log(`Querying details for Housing Group ID: ${id}, Listing ID: ${groupData.listing_id}`);

      const [listingResult, membersResult, userMembershipResult] = await Promise.all([
        supabase.from('housing_listings').select(`id, title, address, suburb, weekly_rent, available_from, media_urls`).eq('id', groupData.listing_id).single(),
        // Fetch members (approved)
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
        // Fetch user's specific membership status (maybeSingle)
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

      if (userMembershipResult.error) throw userMembershipResult.error;

      const fetchedListing = listingResult.data;
      const fetchedMembersData = membersResult.data || [];
      const fetchedUserMembershipData = userMembershipResult.data;

      // Step 2: Collect all unique user IDs
      const userIds = new Set<string>();
      fetchedMembersData.forEach(m => userIds.add(m.user_id));
      if (fetchedUserMembershipData) {
        userIds.add(fetchedUserMembershipData.user_id);
      }

      // Step 3: Fetch user profiles for all unique IDs if any exist
      let userProfilesMap = new Map<string, ExtendedUserProfile>();
      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select(profileSelect)
          .in('id', Array.from(userIds));

        if (profilesError) throw profilesError;

        // Create a map for easy lookup
        profilesData?.forEach(profile => {
          // Ensure the profile matches the structure expected by ExtendedUserProfile
          // If not, provide default values or handle appropriately.
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

      // Step 4: Process members and combine with profiles
      const processedMembers: ExtendedGroupMember[] = fetchedMembersData
        ? fetchedMembersData.map((m) => {
          const userProfile = userProfilesMap.get(m.user_id) || {
            // Fallback profile if not found in map (should ideally not happen if fetched correctly)
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
        })
        : [];

      // Process user's specific membership
      let fetchedUserMembership: ExtendedGroupMember | null = null;
      if (fetchedUserMembershipData) {
        const userProfile = userProfilesMap.get(fetchedUserMembershipData.user_id) || {
          id: fetchedUserMembershipData.user_id,
          full_name: 'You',
          avatar_url: null,
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

      setListing(fetchedListing);
      setGroup({
        ...groupData,
        description: groupData.description || 'No description provided.', 
        current_members: processedMembers.length, 
        members: processedMembers, 
      });
      setUserMembership(fetchedUserMembership); 

      console.log('Successfully loaded group details, listing, members, and user status.');
    } catch (error: any) {
      console.error('Error in loadGroupDetails:', error?.message || 'An unexpected error occurred');
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to load details when id or userId changes
  useEffect(() => {
    loadGroupDetails();
  }, [id, userId]);

  useEffect(() => {
    setAvatarErrorStates(
      group && Array.isArray(group.members)
        ? Array(group.members.length).fill(false)
        : []
    );
  }, [group]);

  // --- RENDER ACTUAL CONTENT --- 
  // Check if group and listing data are loaded before rendering the main UI
  if (!group) {
    // This covers the case where loading is false but group is still null (e.g., not found or error)
    return (
      <View style={styles.centered}> 
        <Text style={styles.errorText}>{error || 'Group not found.'}</Text>
        <TouchableOpacity onPress={loadGroupDetails} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If group exists, render the detailed view
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Scrollable content area */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        {/* Group Header */}
        <TouchableOpacity
          style={styles.listingCard}
          activeOpacity={0.8}
          onPress={() => {
            if (listing) {
              // Log the full listing object for debugging
              console.log('Listing object:', listing);
            } else {
              console.log('No listing loaded');
            }
          }}
        >
          {/* Listing Image with Placeholder */}
          <Image
            source={listing && listing.media_urls && listing.media_urls[0]
              ? { uri: listing.media_urls[0] }
              : { uri: 'https://via.placeholder.com/400x300?text=No+Image' }}
            style={styles.listingImage}
          />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle}>{listing?.title}</Text>
            <Text style={styles.listingAddress}>{listing?.address}</Text>
            <Text style={styles.listingPrice}>${listing?.weekly_rent}/week</Text>
          </View>
        </TouchableOpacity>
        {/* Group Details */}
        <View style={styles.listingCard}>
          <Text style={styles.listingTitle}>{group?.name}</Text>
          <Text style={styles.listingSubtitle}>{group?.description}</Text>
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>About the Group</Text>
          <Text style={styles.listingSubtitle}>{group?.description}</Text>
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>Move-in Date</Text>
          <Text style={styles.listingSubtitle}>{formatMoveInDate(group?.move_in_date || '')}</Text>
        </View>
        {/* Members */}
        <View style={styles.listingCard}>
          <Text style={styles.sectionTitle}>Members ({group?.current_members || 0}/{group?.max_members || 0})</Text>
          {group?.members.map((member, index) => (
            <View key={member.id} style={styles.memberCard}>
              {/* Member Avatar with Placeholder */}
          {(!member.user_profile.avatar_url || avatarErrorStates[index]) ? (
  <View style={[styles.memberAvatar, { backgroundColor: '#ccc', borderRadius: styles.memberAvatar.width ? styles.memberAvatar.width / 2 : 24, justifyContent: 'center', alignItems: 'center' }]} />
) : (
  <Image
    source={{ uri: `https://smtckdlpdfvdycocwoip.supabase.co/storage/v1/object/public/avatars/${member.user_profile.avatar_url}` }}
    style={styles.memberAvatar}
    onError={() => handleAvatarError(index)}
  />
)}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.user_profile.full_name}</Text>
                <View style={styles.memberTags}>
                  {member.support_level && (
                    <Text style={[styles.tag, styles.supportTag]}>{member.support_level}</Text>
                  )}
                  {member.is_admin && <Text style={styles.tag}>Admin</Text>}
                </View>
                <Text style={styles.memberBio}>{member.bio}</Text>
              </View>
            </View>
          ))}
          {group?.members.length === 0 && (
            <Text style={styles.noMembersText}>No members yet.</Text>
          )}
        </View>
        {/* Looking For */}
        <View style={styles.lookingForSection}>
          <Text style={styles.lookingForTitle}>Looking for:</Text>
          <Text style={styles.lookingForSubtitle}>{group?.description}</Text>
        </View>
        {/* Action Button */}
        {userMembership && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              userMembership.status === 'pending' ? styles.pendingButton : styles.alreadyMemberButton,
            ]}
            onPress={() => console.log('Pressed action button')}
          >
            <Text style={styles.actionButtonText}>
              {userMembership.status === 'pending' ? 'Pending' : 'Already a member'}
            </Text>
          </TouchableOpacity>
        )}
        {!userMembership && (
          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton, joining && styles.disabledButton]}
            onPress={joinGroupHandler}
            disabled={joining}
          >
            <Text style={styles.actionButtonText}>{joining ? 'Joining...' : 'Join Group'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  // --- Deduplicated keys below ---
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#333',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Listing Card Styles
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', 
  },
  listingImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  listingInfo: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  listingSubtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
  },
  listingAddress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 14,
    color: '#007AFF', 
    fontWeight: '500',
  },
  placeholderCard: {
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, 
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  // Member Card Styles
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
    width: 60, 
    height: 60,
    borderRadius: 30, 
    marginRight: 16,
  },
  memberInfo: {
    flex: 1, 
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E8E8E8', 
    color: '#555',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 6, 
    overflow: 'hidden', 
  },
  supportTag: {
    backgroundColor: '#D0EFFF', 
    color: '#005A9C',
  },
  memberBio: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noMembersText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
    marginBottom: 20,
  },
  // Looking For Section Styles
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
  actionButton: {
    backgroundColor: '#007AFF', 
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50, 
  },
  joinButton: {
    backgroundColor: '#28a745', 
  },
  alreadyMemberButton: {
    backgroundColor: '#6c757d', 
  },
  pendingButton: {
    backgroundColor: '#ffc107', 
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Loading and Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  centered: { 
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
});
