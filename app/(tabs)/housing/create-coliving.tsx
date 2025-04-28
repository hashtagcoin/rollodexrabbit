import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from './PickerShim';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Users,
  Heart,
} from 'lucide-react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { SupportLevel } from './types/housing';

export default function CreateCoLivingGroup() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const { listingId, listingTitle } = params;

  // State for the listing
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for user preferences
  const [userProfile, setUserProfile] = useState<any>(null);
  const [genderPreference, setGenderPreference] = useState<'Any' | 'Male' | 'Female' | 'Non-binary'>('Any');
  const [supportNeeds, setSupportNeeds] = useState<SupportLevel>('light');
  const [moveInTimeline, setMoveInTimeline] = useState('In 1-3 months');
  const [inviteLink, setInviteLink] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!listingId) {
      setError('No listing ID provided');
      setLoading(false);
      return;
    }
    
    // Load the listing details
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('housing_listings')
          .select('*')
          .eq('id', listingId)
          .single();
          
        if (error) throw error;
        setListing(data);
      } catch (err: any) {
        console.error('Error fetching listing:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Load user profile
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        setUserProfile(data);
        
        // Set default support needs from user profile
        if (data.support_level) {
          setSupportNeeds(data.support_level as SupportLevel);
        }
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchListing();
    fetchUserProfile();
  }, [listingId, session]);

  const handleBackPress = () => {
    router.back();
  };
  
  const handleCreateGroup = async () => {
    if (!session?.user?.id || !listing) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Create a housing group
      const { data: groupData, error: groupError } = await supabase
        .from('housing_groups')
        .insert({
          name: `${userProfile?.first_name || 'New'}'s Co-Living Group`,
          description: groupDescription && groupDescription.trim().length > 0
            ? groupDescription.trim()
            : `Co-living group for ${listing.title}`,
          listing_id: listing.id,
          max_members: 4, // Default max members
          creator_id: session.user.id,
          is_active: true,
          // Store the creator's avatar with the group if supported by schema
          avatar_url: userProfile?.avatar_url || null,
        })
        .select()
        .single();
        
      if (groupError) throw groupError;
      
      // Add the current user as the first member and admin
      const { error: memberError } = await supabase
        .from('housing_group_members')
        .insert({
          group_id: groupData.id,
          user_id: session.user.id,
          status: 'approved',
          bio: userProfile?.bio || '',
          support_level: supportNeeds,
          is_admin: true,
          gender_preference: genderPreference,
          move_in_timeline: moveInTimeline,
        });
        
      if (memberError) throw memberError;
      
      // If an invite link is provided, store it with the group
      if (inviteLink) {
        await supabase
          .from('housing_group_invites')
          .insert({
            group_id: groupData.id,
            invite_link: inviteLink,
            created_by: session.user.id,
          });
      }
      
      Alert.alert(
        'Success', 
        'Your co-living group has been created!',
        [
          { 
            text: 'View Group', 
            onPress: () => router.push(`/housing/group/${groupData.id}`) 
          }
        ]
      );
    } catch (err: any) {
      console.error('Error creating group:', err);
      Alert.alert('Error', err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Co-Living Group</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5c39" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Co-Living Group</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.button} onPress={handleBackPress}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create a Co-Living Group</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionLabel}>This group will apply for:</Text>
        
        {/* Property Card */}
        <TouchableOpacity style={styles.propertyCard}>
          {listing?.media_urls && listing.media_urls.length > 0 ? (
            <Image 
              source={{ uri: listing.media_urls[0] }} 
              style={styles.propertyImage} 
            />
          ) : (
            <View style={[styles.propertyImage, styles.placeholderImage]}>
              <Text>No Image</Text>
            </View>
          )}
          
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{listing?.title || 'Loading...'}</Text>
            <Text style={styles.propertyPrice}>${listing?.weekly_rent || '0'}/wk • {listing?.suburb ? `${(listing.suburb.length > 15 ? listing.suburb.substring(0, 12) + '...' : listing.suburb)} away` : '0.0 km away'}</Text>
            <Text style={styles.propertyAvailability}>Available from {new Date(listing?.available_from || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(listing?.available_from || Date.now()).getFullYear()}</Text>
          </View>
          
          <ChevronRight size={20} color="#666" style={styles.chevronIcon} />
        </TouchableOpacity>
        
        {/* User Bio Section */}
        <Text style={styles.sectionLabel}>Your Bio</Text>
        <View style={styles.bioContainer}>
          {userProfile?.avatar_url ? (
            <Image 
              source={{ uri: userProfile.avatar_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={[styles.avatarImage, styles.placeholderAvatar]}>
              <User size={24} color="#aaa" />
            </View>
          )}
          
          <View style={styles.bioInfo}>
            <Text style={styles.userName}>
              {userProfile?.first_name || ''} {userProfile?.last_name?.charAt(0) || ''}
              {userProfile?.last_name ? '.' : ''}
            </Text>
            
            <View style={styles.badgeContainer}>
              <Text style={styles.ageBadge}>
                {userProfile?.age_range || '18-30'}
              </Text>
              <Text style={styles.personalityBadge}>
                {userProfile?.personality_traits?.join(' • ') || 'Quiet • Independent'}
              </Text>
              <Text style={styles.supportBadge}>
                {supportNeeds.charAt(0).toUpperCase() + supportNeeds.slice(1)}
              </Text>
            </View>
            
            <Text style={styles.bioText}>
              {userProfile?.bio || 'Artist who likes to cook. Needs daily support.'}
            </Text>
          </View>
        </View>
        
        {/* Preferences Section */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
  <Text style={styles.preferenceLabel}>Roommate gender preference</Text>
  <Picker
    selectedValue={genderPreference}
    onValueChange={(itemValue: 'Any' | 'Male' | 'Female' | 'Non-binary') => setGenderPreference(itemValue)}
    style={styles.picker}
  >
    <Picker.Item label="Any" value="Any" />
    <Picker.Item label="Male" value="Male" />
    <Picker.Item label="Female" value="Female" />
    <Picker.Item label="Non-binary" value="Non-binary" />
  </Picker>
</View>
        
        <View style={styles.preferenceItem}>
  <Text style={styles.preferenceLabel}>Support needs</Text>
  <Picker
    selectedValue={supportNeeds}
    onValueChange={(itemValue: SupportLevel) => setSupportNeeds(itemValue)}
    style={styles.picker}
  >
    <Picker.Item label="None" value="none" />
    <Picker.Item label="Light" value="light" />
    <Picker.Item label="Moderate" value="moderate" />
    <Picker.Item label="High" value="high" />
  </Picker>
</View>
        
        <View style={styles.preferenceItem}>
  <Text style={styles.preferenceLabel}>Move-in timeline</Text>
  <Picker
    selectedValue={moveInTimeline}
    onValueChange={(itemValue: string) => setMoveInTimeline(itemValue)}
    style={styles.picker}
  >
    <Picker.Item label="ASAP" value="ASAP" />
    <Picker.Item label="In 1-3 months" value="In 1-3 months" />
    <Picker.Item label="In 3-6 months" value="In 3-6 months" />
    <Picker.Item label="More than 6 months" value="More than 6 months" />
  </Picker>
</View>
        
        {/* Group Description Section */}
        <Text style={styles.sectionLabel}>Group Description</Text>
        <TextInput
          style={styles.groupDescriptionInput}
          placeholder="Describe your group, its vibe, goals, or anything important..."
          value={groupDescription}
          onChangeText={setGroupDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        {/* Invite Friends Section */}
        <Text style={styles.sectionLabel}>Invite Friends (Optional)</Text>
        <TextInput
          style={styles.inviteInput}
          placeholder="Enter email or link"
          value={inviteLink}
          onChangeText={setInviteLink}
        />
        
        {/* Create Group Button */}
        <TouchableOpacity 
          style={styles.createGroupButton}
          onPress={handleCreateGroup}
          disabled={isCreating}
        >
          <Text style={styles.createGroupButtonText}>
            {isCreating ? 'Creating...' : 'Create Group Listing'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    width: '100%',
    minHeight: 44,
    marginTop: 8,
    marginBottom: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  groupDescriptionInput: {
    width: '100%',
    minHeight: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 10,
    marginTop: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  propertyImage: {
    width: 70,
    height: 70,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyAvailability: {
    fontSize: 13,
    color: '#666',
  },
  chevronIcon: {
    alignSelf: 'center',
    marginRight: 12,
  },
  bioContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  ageBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    fontSize: 12,
    marginBottom: 4,
  },
  personalityBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    fontSize: 12,
    marginBottom: 4,
  },
  supportBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 15,
    color: '#333',
  },
  preferenceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceSelectorText: {
    fontSize: 15,
    marginRight: 8,
    color: '#666',
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  createGroupButton: {
    backgroundColor: '#2c5c39',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
