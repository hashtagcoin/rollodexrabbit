import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Switch,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added React import
import { supabase } from '../../../../lib/supabase';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../../providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from '@react-native-segmented-control/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Video, ResizeMode } from 'expo-av'; // Added Video import
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { uploadMedia, MediaErrorType, MediaError } from '../../../../lib/mediaService';
import AppHeader from '../../../../components/AppHeader';

type ProfileBase = {
  id: string; // Ensure ID is always included
  full_name: string | null;
  avatar_url: string | null;
};

type GroupMember = {
  role: 'admin' | 'member';
  joined_at: string;
  user: ProfileBase[] | null; // Use ProfileBase
};

type Subgroup = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: ProfileBase[] | null;
};

type GroupPostReaction = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'sad' | 'angry';
  created_at: string;
  user: ProfileBase[] | null;
};

type GroupPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: ProfileBase[] | null;
};

type GroupPost = {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
  user_id: string;
  author: ProfileBase[] | null;
  reactions?: GroupPostReaction[];
  comments?: GroupPostComment[];
  _count?: {
    reactions: number;
    comments: number;
  };
  status: 'approved' | 'pending';
};

type GroupEvent = {
  id: string;
  group_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    venue_name?: string;
  } | null;
  max_participants: number | null;
  created_by: string;
  created_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: ProfileBase[] | null;
  participants: {
    user: ProfileBase[] | null;
    status: 'going' | 'maybe' | 'not_going';
  }[];
};

type Group = {
  id: string;
  name: string;
  type: 'interest' | 'housing';
  description: string;
  created_at: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  owner: ProfileBase[] | null; // Use ProfileBase
  rules: string | null;
  category: string | null;
  max_members: number | null;
  tags: string[];
  settings: {
    allowMemberPosts: boolean;
    requireApproval: boolean;
    [key: string]: any;
  } | null;
  posts: GroupPost[] | null;
  events: GroupEvent[] | null;
};

interface NewEventState {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    venue_name?: string;
  } | null;
  maxParticipants: string;
}

export default function GroupDetails() {
  const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateSubgroup, setShowCreateSubgroup] = useState(false);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modalIsPublic, setModalIsPublic] = useState(group?.is_public ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    location: null,
    maxParticipants: '',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [eventsPage, setEventsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const ITEMS_PER_PAGE = 10;

  const groupId = Array.isArray(id) ? id[0] : id;

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          owner:user_profiles!owner_id(id, full_name, avatar_url),
          members:group_members(
            role,
            joined_at,
            user:user_profiles(id, full_name, avatar_url)
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        throw new Error(groupError.message);
      }

      if (!groupData) {
        throw new Error('Group not found');
      }

      setGroup(groupData);

      // Check if current user is a member
      if (currentUser) {
        const isMemberOfGroup = groupData.members?.some(
          (member: GroupMember) => member.user?.[0]?.id === currentUser.id
        );
        setIsMember(!!isMemberOfGroup);

        // Check if current user is an admin
        const isAdmin = groupData.members?.some(
          (member: GroupMember) => 
            member.user?.[0]?.id === currentUser.id && 
            member.role === 'admin'
        );
        setIsGroupAdmin(!!isAdmin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group');
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUser]);

  useEffect(() => {
    loadGroup();
    loadEvents(1);
    loadPosts(1);
  }, [loadGroup, id]);

  useEffect(() => {
    if (group) {
      setModalIsPublic(group.is_public);
    }
  }, [group]);

  const joinGroup = async () => {
    if (!currentUser || !group) return;
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: currentUser.id,
        role: 'member',
      });
      if (error) throw error;
      Alert.alert('Success', 'You have joined the group!');
      loadGroup();
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Could not join group: ' + error.message);
    }
  };

  const leaveGroup = async () => {
    if (!currentUser || !group) return;
    Alert.alert('Confirm Leave', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('group_members')
              .delete()
              .eq('group_id', group.id)
              .eq('user_id', currentUser.id);
            if (error) throw error;
            Alert.alert('Success', 'You have left the group.');
            router.back();
          } catch (error: any) {
            console.error('Error leaving group:', error);
            Alert.alert('Error', 'Could not leave group: ' + error.message);
          }
        },
      },
    ]);
  };

  const createSubgroup = async () => {
    if (!newSubgroupName.trim() || !currentUser || !group) {
      Alert.alert('Error', 'Subgroup name cannot be empty.');
      return;
    }
    console.log('Subgroup Name:', newSubgroupName);
    Alert.alert('Info', 'Subgroup creation logic not yet implemented.');
    setShowCreateSubgroup(false);
    setNewSubgroupName('');
  };

  const handleAvatarChange = async () => {
    if (!group) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fileExt = fileUri.split('.').pop();
      const fileName = `${group.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, fileName);

      setIsUploading(true);
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('group-avatars')
          .upload(filePath, formData, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('group-avatars')
          .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) throw new Error("Could not get public URL");
        const newAvatarUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
          .from('groups')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', group.id);

        if (updateError) throw updateError;

        Alert.alert('Success', 'Group avatar updated!');
        loadGroup();
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        Alert.alert('Error', 'Could not update avatar: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePrivacyChange = async () => {
    if (!group) return;
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_public: modalIsPublic })
        .eq('id', group.id);

      if (error) throw error;

      Alert.alert('Success', `Group privacy set to ${modalIsPublic ? 'Public' : 'Private'}`);
      loadGroup();
    } catch (error: any) {
      console.error('Error updating privacy:', error);
      Alert.alert('Error', 'Could not update privacy: ' + error.message);
    }
  };

  const pickMedia = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image library - allow images and videos
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow images and videos
      allowsEditing: false, // Editing might be complex for videos
      // aspect: [4, 3], // Maybe remove aspect ratio constraint for general posts
      quality: 0.7, // Adjust quality as needed
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia(result.assets[0]);
    } else {
      setSelectedMedia(null); // Clear if cancelled or no asset
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser || !group || (!newPostContent.trim() && !selectedMedia)) {
      Alert.alert("Empty Post", "Please write something or attach media.");
      return;
    }

    setIsPosting(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'video' | null = null;

      // 1. Upload media if selected
      if (selectedMedia) {
        try {
          const asset = selectedMedia;
          const fileUri = asset.uri;
          const fileType = asset.type === 'video' ? 'video' : 'image';
          mediaType = fileType;
          
          // Generate a unique filename
          const fileExt = fileUri.split('.').pop();
          const fileName = `${group.id}-${currentUser.id}-${Date.now()}.${fileExt}`;
          
          // Convert URI to Blob for upload
          const response = await fetch(fileUri);
          const blob = await response.blob();
          
          // Upload using our secure media service
          mediaUrl = await uploadMedia(
            blob,
            'group-posts',
            fileName,
            fileType,
            true, // Public access for group posts
            {
              userId: currentUser.id,
              groupId: group.id,
              contentType: fileType
            }
          );
        } catch (mediaError: unknown) {
          if (mediaError instanceof MediaError) {
            switch (mediaError.type) {
              case MediaErrorType.UNSUPPORTED_TYPE:
                throw new Error(`Unsupported file type. Please use a supported image or video format.`);
              case MediaErrorType.FILE_TOO_LARGE:
                throw new Error(`File too large. Images must be under 5MB and videos under 50MB.`);
              default:
                throw new Error(`Media upload failed: ${mediaError.message}`);
            }
          } else {
            throw new Error(`Failed to upload media: ${mediaError instanceof Error ? mediaError.message : 'Unknown error'}`);
          }
        }
      }

      // 2. Insert post record into the table
      const { data, error } = await supabase
        .from('group_posts')
        .insert({
          group_id: group.id,
          user_id: currentUser.id,
          content: newPostContent.trim() || null, // Store null if only media exists
          media_url: mediaUrl,
          media_type: mediaType,
          status: group.settings?.requireApproval ? 'pending' : 'approved',
        })
        .select();

      if (error) throw error;

      // Clear input and selected media
      setNewPostContent(''); 
      setSelectedMedia(null);
      
      // Show appropriate feedback based on post status
      if (group.settings?.requireApproval) {
        Alert.alert(
          "Post Submitted", 
          "Your post has been submitted and is pending approval from a group admin."
        );
      } else {
        Alert.alert("Success", "Your post has been published to the group.");
      }
      
      // Reload group data to refresh posts
      loadGroup();

    } catch (err: unknown) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReaction = async (postId: string, type: 'like' | 'love' | 'laugh' | 'sad' | 'angry') => {
    if (!currentUser || !group) return;

    try {
      // Check if user already reacted with this type
      const { data: existingReaction } = await supabase
        .from('group_post_reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', type)
        .single();

      if (existingReaction) {
        // Remove reaction if it exists
        const { error } = await supabase
          .from('group_post_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('group_post_reactions')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            reaction_type: type,
          });

        if (error) throw error;
      }

      // Reload group data to refresh reactions
      loadGroup();
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Could not update reaction: ' + error.message);
    }
  };

  const handleComment = async (postId: string) => {
    if (!currentUser || !group || !newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      loadGroup();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Could not add comment: ' + error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !group) return;

    try {
      // Check if user is post author or group admin
      const post = group.posts?.find(p => p.id === postId);
      if (!post) return;

      const isAuthor = post.user_id === currentUser.id;
      const canDelete = isAuthor || isGroupAdmin;

      if (!canDelete) {
        Alert.alert('Error', 'You do not have permission to delete this post');
        return;
      }

      // Delete post reactions and comments first
      await supabase
        .from('group_post_reactions')
        .delete()
        .eq('post_id', postId);

      await supabase
        .from('group_post_comments')
        .delete()
        .eq('post_id', postId);

      // Delete post media if exists
      if (post.media_url) {
        const mediaPath = post.media_url.split('/').pop();
        if (mediaPath) {
          await supabase.storage
            .from('group-posts')
            .remove([mediaPath]);
        }
      }

      // Delete the post
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      Alert.alert('Success', 'Post deleted successfully');
      loadGroup();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Could not delete post: ' + error.message);
    }
  };

  const handleReportPost = async (postId: string) => {
    if (!currentUser || !group) return;

    try {
      const { error } = await supabase
        .from('group_post_reports')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          group_id: group.id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Post reported. Group admins will review it.');
    } catch (error: any) {
      console.error('Error reporting post:', error);
      Alert.alert('Error', 'Could not report post: ' + error.message);
    }
  };

  const handleModeratePost = async (postId: string, action: 'approve' | 'reject') => {
    if (!currentUser || !group || !isGroupAdmin) return;

    try {
      if (action === 'reject') {
        await handleDeletePost(postId);
      } else {
        const { error } = await supabase
          .from('group_posts')
          .update({ status: 'approved' })
          .eq('id', postId);

        if (error) throw error;
        Alert.alert('Success', 'Post approved');
      }

      loadGroup();
    } catch (error: any) {
      console.error('Error moderating post:', error);
      Alert.alert('Error', 'Could not moderate post: ' + error.message);
    }
  };

  const handleCreateEvent = async () => {
    if (!currentUser) {
      setError('You must be logged in to create an event');
      return;
    }

    if (!newEvent.title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!newEvent.description.trim()) {
      setError('Event description is required');
      return;
    }

    if (newEvent.endTime <= newEvent.startTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const maxParticipantsNum = newEvent.maxParticipants ? parseInt(newEvent.maxParticipants, 10) : null;
      
      const { error: createError } = await supabase
        .from('group_events')
        .insert({
          group_id: id,
          title: newEvent.title.trim(),
          description: newEvent.description.trim(),
          start_time: newEvent.startTime.toISOString(),
          end_time: newEvent.endTime.toISOString(),
          location: newEvent.location,
          max_participants: maxParticipantsNum,
          created_by: currentUser.id,
          status: 'upcoming',
        });

      if (createError) {
        throw new Error(createError.message);
      }

      setShowCreateEvent(false);
      setNewEvent({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(),
        location: null,
        maxParticipants: ''
      });
      loadEvents(); // Refresh events list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create event');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!currentUser) {
      setError('You must be logged in to RSVP');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Check if user already has an RSVP for this event
      const { data: existingRSVP, error: checkError } = await supabase
        .from('group_event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', currentUser.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw new Error(checkError.message);
      }

      let rsvpError;
      
      if (existingRSVP) {
        // Update existing RSVP
        const { error } = await supabase
          .from('group_event_participants')
          .update({ status: status })
          .eq('event_id', eventId)
          .eq('user_id', currentUser.id);
          
        rsvpError = error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('group_event_participants')
          .insert({
            event_id: eventId,
            user_id: currentUser.id,
            status: status
          });
          
        rsvpError = error;
      }

      if (rsvpError) {
        throw new Error(rsvpError.message);
      }

      loadEvents(); // Refresh events list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update RSVP');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loadEvents = async (page = 1) => {
    try {
      setLoadingEvents(true);
      setError(null);

      // Skip real database queries for demo build
      console.log('Using test events data only');
      
      // Create test events for the group
      const testEvents = createTestGroupEvents(id as string);
      
      // Set the events in state
      setEvents(testEvents);
      setHasMoreEvents(false); // No more events to load in test mode
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadPosts = async (page = 1) => {
    try {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoadingPosts(true);
      } else {
        setLoadingMorePosts(true);
      }
      setError(null);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select(`
          *,
          author:user_profiles!user_id(id, full_name, avatar_url),
          reactions:group_post_reactions(
            id,
            reaction_type,
            user:user_profiles(id, full_name, avatar_url)
          ),
          comments:group_post_comments(
            id,
            content,
            created_at,
            user:user_profiles(id, full_name, avatar_url)
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postsError) {
        throw new Error(postsError.message);
      }

      if (isFirstPage) {
        setPosts(postsData || []);
      } else {
        setPosts(prev => [...prev, ...(postsData || [])]);
      }
      
      setHasMorePosts((postsData || []).length === ITEMS_PER_PAGE);
      setPostsPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      if (page === 1) {
        setLoadingPosts(false);
      } else {
        setLoadingMorePosts(false);
      }
    }
  };

  const handleLoadMoreEvents = () => {
    if (!loadingMoreEvents && hasMoreEvents) {
      loadEvents(eventsPage + 1);
    }
  };

  const handleLoadMorePosts = () => {
    if (!loadingMorePosts && hasMorePosts) {
      loadPosts(postsPage + 1);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom) {
      if (activeTab === 0 && hasMorePosts) {
        handleLoadMorePosts();
      } else if (activeTab === 3 && hasMoreEvents) {
        handleLoadMoreEvents();
      }
    }
  };

  const renderMember = ({ item }: { item: GroupMember }) => {
    const memberProfile = item.user?.[0];
    const avatarUrl = memberProfile?.avatar_url || 'https://placehold.co/100x100/e1f0ff/333333?text=Usr';
    const memberName = memberProfile?.full_name || 'Unknown Member';
    const memberId = memberProfile?.id;

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => memberId && router.push({ pathname: '/users/[id]', params: { id: memberId } })}
        disabled={!memberId}
      >
        <TouchableOpacity onPress={() => memberId && router.push({ pathname: '/users/[id]', params: { id: memberId } })}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.listItemTextContainer}>
          <TouchableOpacity onPress={() => memberId && router.push({ pathname: '/users/[id]', params: { id: memberId } })}>
            <Text style={styles.listItemName}>{memberName}</Text>
          </TouchableOpacity>
          <Text style={styles.listItemRole}>{item.role} - Joined: {new Date(item.joined_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubgroup = ({ item }: { item: Subgroup }) => {
    const creatorProfile = item.created_by?.[0];
    const creatorName = creatorProfile?.full_name || 'Unknown';

    return (
      <View style={styles.listItem}>
        <View style={styles.listItemTextContainer}>
          <Text style={styles.listItemName}>{item.name}</Text>
          <Text style={styles.listItemDescription}>{item.description || 'No description'}</Text>
          <Text style={styles.listItemMeta}>Created by {creatorName} on {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  const renderPost = (post: GroupPost) => {
    const postReactions = post.reactions || [];
    const postComments = post.comments || [];
    const isSelected = selectedPost === post.id;

    return (
      <View style={styles.postContainer} key={post.id}>
        <View style={styles.postHeader}>
          <Image
            source={post.author?.[0]?.avatar_url ? { uri: post.author[0].avatar_url } : require('../../../../assets/images/default-avatar.png')}
            style={styles.postAuthorAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthorName}>{post.author?.[0]?.full_name || 'Unknown'}</Text>
            <Text style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>
          {(post.user_id === currentUser?.id || isGroupAdmin) && (
            <TouchableOpacity
              style={styles.postMenuButton}
              onPress={() => {
                Alert.alert(
                  'Post Options',
                  'What would you like to do?',
                  [
                    {
                      text: 'Delete',
                      onPress: () => handleDeletePost(post.id),
                      style: 'destructive',
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ],
                );
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          )}
          {currentUser && post.user_id !== currentUser.id && (
            <TouchableOpacity
              style={styles.postMenuButton}
              onPress={() => {
                Alert.alert(
                  'Report Post',
                  'Are you sure you want to report this post?',
                  [
                    {
                      text: 'Report',
                      onPress: () => handleReportPost(post.id),
                      style: 'destructive',
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ],
                );
              }}
            >
              <Ionicons name="flag-outline" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {post.content && (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {post.media_url && (
          <View style={styles.postMedia}>
            {post.media_type === 'image' ? (
              <Image
                source={{ uri: post.media_url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : post.media_type === 'video' ? (
              <Video
                source={{ uri: post.media_url }}
                style={styles.postImage}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            ) : null}
          </View>
        )}

        <View style={styles.postActions}>
          <View style={styles.reactionButtons}>
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'like')}
            >
              <Ionicons
                name={postReactions.some(r => r.user_id === currentUser?.id && r.reaction_type === 'like')
                  ? 'thumbs-up' : 'thumbs-up-outline'}
                size={20}
                color="#007AFF"
              />
              <Text style={styles.reactionCount}>
                {postReactions.filter(r => r.reaction_type === 'like').length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'love')}
            >
              <Ionicons
                name={postReactions.some(r => r.user_id === currentUser?.id && r.reaction_type === 'love')
                  ? 'heart' : 'heart-outline'}
                size={20}
                color="#FF3B30"
              />
              <Text style={styles.reactionCount}>
                {postReactions.filter(r => r.reaction_type === 'love').length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'laugh')}
            >
              <Ionicons
                name={postReactions.some(r => r.user_id === currentUser?.id && r.reaction_type === 'laugh')
                  ? 'happy' : 'happy-outline'}
                size={20}
                color="#FFD60A"
              />
              <Text style={styles.reactionCount}>
                {postReactions.filter(r => r.reaction_type === 'laugh').length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => handleReaction(post.id, 'sad')}
            >
              <Ionicons
                name={postReactions.some(r => r.user_id === currentUser?.id && r.reaction_type === 'sad')
                  ? 'sad' : 'sad-outline'}
                size={20}
                color="#8E8E93"
              />
              <Text style={styles.reactionCount}>
                {postReactions.filter(r => r.reaction_type === 'sad').length}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => setSelectedPost(isSelected ? null : post.id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.commentCount}>{postComments.length}</Text>
          </TouchableOpacity>
        </View>

        {isSelected && (
          <View style={styles.commentsSection}>
            {postComments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={comment.user?.[0]?.avatar_url
                    ? { uri: comment.user[0].avatar_url }
                    : require('../../../../assets/images/default-avatar.png')}
                  style={styles.commentAuthorAvatar}
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthorName}>
                    {comment.user?.[0]?.full_name || 'Unknown'}
                  </Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))}

            <View style={styles.addCommentSection}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                multiline
              />
              <TouchableOpacity
                style={styles.sendCommentButton}
                onPress={() => handleComment(post.id)}
              >
                <Ionicons name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEvent = (event: GroupEvent) => {
    const userRSVP = event.participants?.find(p => p.user?.[0]?.id === currentUser?.id);
    const goingCount = event.participants?.filter(p => p.status === 'going').length || 0;
    const isFull = event.max_participants !== null && goingCount >= event.max_participants;

    return (
      <View style={styles.eventContainer} key={event.id}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={[styles.eventStatus, styles[`status${event.status}`]]}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Text>
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
            </Text>
          </View>

          {event.location && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{event.location.address || event.location.venue_name}</Text>
            </View>
          )}

          <View style={styles.eventDetailRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              {goingCount} going
              {event.max_participants !== null && ` (${event.max_participants - goingCount} spots left)`}
            </Text>
          </View>

          <View style={styles.eventDetailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              Organized by {event.organizer?.[0]?.full_name || 'Unknown'}
            </Text>
          </View>
        </View>

        {event.status === 'upcoming' && (
          <View style={styles.rsvpButtons}>
            <TouchableOpacity
              style={[
                styles.rsvpButton,
                userRSVP?.status === 'going' && styles.rsvpButtonActive,
                isFull && styles.rsvpButtonDisabled,
              ]}
              onPress={() => handleRSVP(event.id, 'going')}
              disabled={isFull && userRSVP?.status !== 'going'}
            >
              <Text style={[
                styles.rsvpButtonText,
                userRSVP?.status === 'going' && styles.rsvpButtonTextActive,
              ]}>
                Going
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpButton,
                userRSVP?.status === 'maybe' && styles.rsvpButtonActive,
              ]}
              onPress={() => handleRSVP(event.id, 'maybe')}
            >
              <Text style={[
                styles.rsvpButtonText,
                userRSVP?.status === 'maybe' && styles.rsvpButtonTextActive,
              ]}>
                Maybe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpButton,
                userRSVP?.status === 'not_going' && styles.rsvpButtonActive,
              ]}
              onPress={() => handleRSVP(event.id, 'not_going')}
            >
              <Text style={[
                styles.rsvpButtonText,
                userRSVP?.status === 'not_going' && styles.rsvpButtonTextActive,
              ]}>
                Not Going
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderCreatePost = () => {
    if (!isMember) return null;

    return (
      <View style={styles.createPostContainer}>
        <TextInput
          style={styles.postInput}
          placeholder="Write something..."
          value={newPostContent}
          onChangeText={setNewPostContent}
          multiline
        />
        {selectedMedia && (
          <View style={styles.mediaPreviewContainer}>
            {selectedMedia.type === 'image' && (
              <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
            )}
            <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeMediaButton}>
              <Ionicons name="close-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.postActionsContainer}>
          <TouchableOpacity onPress={pickMedia} style={styles.attachButton}>
            <Ionicons name="attach" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!newPostContent.trim() && !selectedMedia || isPosting) && styles.disabledButton
            ]}
            onPress={handleCreatePost}
            disabled={!newPostContent.trim() && !selectedMedia || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadEvents(0)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (accessDenied) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Access Denied' }} />
        <Ionicons name="lock-closed-outline" size={60} color="#dc3545" />
        <Text style={styles.errorText}>You do not have permission to view this group.</Text>
        <Text style={styles.errorSubText}>This group is private, and you are not a member.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
        <Text style={styles.errorText}>Group not found or could not be loaded.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ownerProfile = group.owner?.[0];
  const ownerName = ownerProfile?.full_name || 'Unknown Owner';
  const ownerAvatar = ownerProfile?.avatar_url || 'https://placehold.co/100x100/e1f0ff/333333?text=Own';
  const ownerId = ownerProfile?.id;

  return (
    <>
      <AppHeader title={group.name} />
      <ScrollView 
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {group.cover_image_url && (
          <Image
            source={{ uri: group.cover_image_url }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
        )}
        <View style={styles.header}>
          <Image
            source={group.avatar_url ? { uri: group.avatar_url } : require('../../../../assets/images/default-group.png')}
            style={styles.avatar}
          />
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupType}>{group.type} group • {group.category || 'Uncategorized'}</Text>
            {group.max_members && (
              <Text style={styles.memberCount}>{members.length}/{group.max_members} members</Text>
            )}
            {group.tags && group.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {group.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <Text style={styles.description}>{group.description}</Text>
        {group.rules && (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Group Rules</Text>
            <Text style={styles.rules}>{group.rules}</Text>
          </View>
        )}

        <SegmentedControl
          values={['Posts', 'Members', 'Subgroups', 'Events']}
          selectedIndex={activeTab}
          onChange={(event) => {
            const selectedTab = event.nativeEvent.selectedSegmentIndex;
            setActiveTab(selectedTab);
          }}
          style={styles.segmentedControl}
        />

        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <View style={styles.tabContent}>
              {renderCreatePost()}
              {loadingPosts ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <>
                  {posts.map(post => renderPost(post))}
                  {loadingMorePosts && (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  )}
                  {!hasMorePosts && posts.length > 0 && (
                    <Text style={styles.noMoreItems}>No more posts</Text>
                  )}
                </>
              )}
            </View>
          )}
          {activeTab === 1 && (
            <View style={styles.tabContent}>
              {members.length > 0 ? (
                <FlatList
                  data={members}
                  renderItem={renderMember}
                  keyExtractor={(item, index) => item.user?.[0]?.id || `member-${index}`}
                  ListEmptyComponent={<Text style={styles.emptyText}>No members found.</Text>}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No members yet.</Text>
              )}
            </View>
          )}
          {activeTab === 2 && (
            <View style={styles.tabContent}>
              {isGroupAdmin && (
                <TouchableOpacity
                  style={styles.createSubgroupButton}
                  onPress={() => setShowCreateSubgroup(true)}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                  <Text style={styles.createSubgroupButtonText}>Create Subgroup</Text>
                </TouchableOpacity>
              )}
              {showCreateSubgroup && (
                <View style={styles.createSubgroupContainer}>
                  <TextInput
                    style={styles.subgroupInput}
                    placeholder="New Subgroup Name"
                    value={newSubgroupName}
                    onChangeText={setNewSubgroupName}
                  />
                  <TouchableOpacity style={styles.subgroupSubmitButton} onPress={createSubgroup}>
                    <Text style={styles.subgroupSubmitButtonText}>Create</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.subgroupCancelButton} onPress={() => setShowCreateSubgroup(false)}>
                    <Text style={styles.subgroupCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {subgroups.length > 0 ? (
                <FlatList
                  data={subgroups}
                  renderItem={renderSubgroup}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={<Text style={styles.emptyText}>No subgroups found.</Text>}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No subgroups yet.</Text>
              )}
            </View>
          )}
          {activeTab === 3 && (
            <View style={styles.tabContent}>
              {isGroupAdmin && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateEvent(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}

              {loadingEvents ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <>
                  {events.map(event => renderEvent(event))}
                  {loadingMoreEvents && (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  )}
                  {!hasMoreEvents && events.length > 0 && (
                    <Text style={styles.noMoreItems}>No more events</Text>
                  )}
                </>
              )}
            </View>
          )}
        </View>

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSettingsModal}
          onRequestClose={() => {
            setShowSettingsModal(false);
            setModalIsPublic(group?.is_public ?? true);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Group Settings</Text>

              {/* Privacy Setting */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Public Group</Text>
                <Switch
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={modalIsPublic ? '#007AFF' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={(newValue) => setModalIsPublic(newValue)}
                  value={modalIsPublic}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handlePrivacyChange}>
                <Text style={styles.saveButtonText}>Save Privacy Setting</Text>
              </TouchableOpacity>

              {/* Change Avatar */}
              <TouchableOpacity
                style={[styles.modalButton, isUploading && styles.disabledButton]}
                onPress={handleAvatarChange}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Change Group Avatar</Text>
                )}
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => {
                  setShowSettingsModal(false);
                  setModalIsPublic(group?.is_public ?? true);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showCreateEvent}
          onRequestClose={() => setShowCreateEvent(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Event</Text>

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TextInput
                style={styles.input}
                value={newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
                placeholder="Event Title"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEvent.description}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                placeholder="Event Description"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text>Start Time: {newEvent.startTime.toLocaleString()}</Text>
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={newEvent.startTime}
                  mode="datetime"
                  display="default"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setNewEvent(prev => ({ ...prev, startTime: selectedDate }));
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text>End Time: {newEvent.endTime.toLocaleString()}</Text>
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={newEvent.endTime}
                  mode="datetime"
                  display="default"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setNewEvent(prev => ({ ...prev, endTime: selectedDate }));
                    }
                  }}
                />
              )}

              <TextInput
                style={styles.input}
                value={newEvent.location?.address || ''}
                onChangeText={(text) => setNewEvent(prev => ({ 
                  ...prev, 
                  location: { 
                    address: text,
                    venue_name: text 
                  } 
                }))}
                placeholder="Location (optional)"
              />

              <TextInput
                style={styles.input}
                value={newEvent.maxParticipants}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, maxParticipants: text }))}
                placeholder="Max Participants (optional)"
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateEvent(false);
                    setError(null);
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.createButton,
                    submitting && styles.disabledButton
                  ]}
                  onPress={handleCreateEvent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Event</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  coverImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  tabContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  segmentedControl: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  textArea: {
    height: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalCreateButton: {
    backgroundColor: '#28a745',
  },
  modalCreateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  listItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemRole: {
    fontSize: 14,
    color: '#666',
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listItemMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postMenuButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMedia: {
    marginVertical: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 12,
  },
  reactionButtons: {
    flexDirection: 'row',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  commentCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  commentsSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAuthorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    padding: 10,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    marginRight: 12,
  },
  sendCommentButton: {
    padding: 10,
  },
  eventContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventStatus: {
    fontSize: 14,
    color: '#666',
  },
  statusupcoming: {
    color: '#007AFF',
  },
  statusongoing: {
    color: '#28a745',
  },
  statuscompleted: {
    color: '#6c757d',
  },
  statuscancelled: {
    color: '#dc3545',
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  rsvpButtonActive: {
    backgroundColor: '#007AFF',
  },
  rsvpButtonText: {
    fontSize: 14,
    color: '#666',
  },
  rsvpButtonTextActive: {
    color: '#fff',
  },
  rsvpButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  rulesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rules: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  createPostContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  postInput: {
    height: 100,
    textAlignVertical: 'top',
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  mediaPreviewContainer: {
    marginTop: 12,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  postActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  attachButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  postButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createSubgroupButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createSubgroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createSubgroupContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  subgroupInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  subgroupSubmitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  subgroupSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subgroupCancelButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  subgroupCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  noMoreItems: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

// Helper function to create test group events
const createTestGroupEvents = (groupId: string) => {
  const baseDate = new Date();
  
  // Create 3 upcoming events
  return [
    {
      id: `test-event-1-${groupId}`,
      title: 'Weekly Meetup',
      description: 'Join us for our weekly community meetup! We\'ll discuss upcoming events and opportunities.',
      location: 'Community Center, 123 Main St',
      group_id: groupId,
      start_time: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      end_time: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      is_public: true,
      created_at: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_participants: 15,
      status: 'upcoming',
      organizer: {
        id: '7a9ed413-a880-43d1-aeb0-33805d00a3c8',
        full_name: 'Jane Coordinator',
        avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      participants: [
        {
          user: {
            id: '7a9ed413-a880-43d1-aeb0-33805d00a3c8',
            full_name: 'Jane Coordinator',
            avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
          },
          status: 'going'
        },
        {
          user: {
            id: 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8',
            full_name: 'Ryan H',
            avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          status: 'going'
        }
      ],
      created_by: {
        id: '7a9ed413-a880-43d1-aeb0-33805d00a3c8',
        first_name: 'Jane',
        last_name: 'Coordinator',
        avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    },
    {
      id: `test-event-2-${groupId}`,
      title: 'Coffee Chat',
      description: 'Casual coffee meet-up for members to connect and share experiences.',
      location: 'Brew & Bean Cafe, 456 Oak Ave',
      group_id: groupId,
      start_time: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      end_time: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours later
      is_public: true,
      created_at: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      max_participants: 10,
      status: 'upcoming',
      organizer: {
        id: 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8',
        full_name: 'Ryan H',
        avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      participants: [
        {
          user: {
            id: 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8',
            full_name: 'Ryan H',
            avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          status: 'going'
        }
      ],
      created_by: {
        id: 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8',
        first_name: 'Ryan',
        last_name: 'H',
        avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    },
    {
      id: `test-event-3-${groupId}`,
      title: 'Workshop: Building Community Connections',
      description: 'Interactive workshop focused on strengthening community bonds and support networks.',
      location: 'Community Hub, 789 Pine Street',
      group_id: groupId,
      start_time: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      end_time: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
      is_public: true,
      created_at: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      max_participants: 25,
      status: 'upcoming',
      organizer: {
        id: 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e',
        full_name: 'Lily W',
        avatar_url: 'https://randomuser.me/api/portraits/women/22.jpg'
      },
      participants: [
        {
          user: {
            id: 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e',
            full_name: 'Lily W',
            avatar_url: 'https://randomuser.me/api/portraits/women/22.jpg'
          },
          status: 'going'
        },
        {
          user: {
            id: '7a9ed413-a880-43d1-aeb0-33805d00a3c8',
            full_name: 'Jane Coordinator',
            avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
          },
          status: 'going'
        },
        {
          user: {
            id: 'e68f752a-2d85-4dfb-9743-cbf3fb6bf8e8',
            full_name: 'Ryan H',
            avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          status: 'going'
        }
      ],
      created_by: {
        id: 'd5e1fa56-80b7-4e51-9012-3baac98f2b9e',
        first_name: 'Lily',
        last_name: 'W',
        avatar_url: 'https://randomuser.me/api/portraits/women/22.jpg'
      }
    }
  ];
};