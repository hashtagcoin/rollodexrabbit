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
import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { supabase } from '../../../../lib/supabase';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../../providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from '@react-native-segmented-control/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Video, ResizeMode } from 'expo-av'; 
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { uploadMedia, MediaErrorType, MediaError } from '../../../../lib/mediaService';
import AppHeader from '../../../../components/AppHeader';
import GroupMembersSection from '../../../../components/groups/GroupMembersSection'; 
import GroupPostsSection from '../../../../components/groups/GroupPostsSection'; 
import GroupEventsSection from '../../../../components/groups/GroupEventsSection';

type ProfileBase = {
  id: string; 
  full_name: string | null;
  avatar_url: string | null;
};

type GroupMember = {
  role: 'admin' | 'member';
  joined_at: string;
  user: ProfileBase | null; 
};

type GroupPostReaction = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'sad' | 'angry';
  created_at: string;
  user: ProfileBase | null;
};

type GroupPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: ProfileBase | null;
};

type GroupPost = {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
  user_id: string;
  author: ProfileBase | null;
  reactions?: GroupPostReaction[];
  comments?: GroupPostComment[];
  _count?: {
    reactions: number;
    comments: number;
  };
  status?: 'approved' | 'pending'; // Made status optional
};

interface GroupSettings {
  id: string; 
  group_id: string;
  allowMemberPosts: boolean;
  requireApproval: boolean;
  [key: string]: any;
}

type Group = {
  id: string;
  name: string;
  type: 'interest' | 'housing' | 'event';
  description: string;
  created_at: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  owner: ProfileBase | null;
  rules: string | null;
  category: string | null;
  max_members: number | null;
  tags: string[];
  settings?: GroupSettings | null;
  posts?: GroupPost[] | null;
  members?: GroupMember[];
};

export default function GroupDetails() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser, session } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'posts' | 'events'>('posts');
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  const loadGroupDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setGroup(null);
    setIsMember(false);
    setIsAdmin(false);

    if (!groupId) {
      setError('Group ID not found.');
      setLoading(false);
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*, members:group_members(*, user:user_profiles(id, full_name, avatar_url))')
        .eq('id', groupId)
        .maybeSingle();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        setError(`Failed to load group details: ${groupError.message}`);
        setLoading(false);
        return;
      }

      if (groupData) {
        let settingsData: GroupSettings | null = null;
        const { data: fetchedSettings, error: settingsError } = await supabase
          .from('group_settings')
          .select('*')
          .eq('group_id', groupId) 
          .maybeSingle();

        if (settingsError) {
          console.error('Error fetching group settings:', settingsError);
        } else {
          settingsData = fetchedSettings as GroupSettings | null;
        }

        const fullGroupData = { ...groupData, settings: settingsData };
        setGroup(fullGroupData as Group);

        if (currentUser) {
          const currentGroupMembers = Array.isArray(groupData.members) ? groupData.members : [];

          const isMemberOfGroup = currentGroupMembers.some(
            (member: GroupMember) => member.user?.id === currentUser.id
          );
          setIsMember(isMemberOfGroup);

          const isAdminOfGroup = currentGroupMembers.some(
            (member: GroupMember) =>
              member.user?.id === currentUser.id && member.role === 'admin'
          );
          setIsAdmin(isAdminOfGroup);
        } else {
          setIsMember(false);
          setIsAdmin(false);
        }
      } else {
        setError('Group not found or access denied.');
      }
    } catch (err: any) {
      console.error('Exception in loadGroupDetails:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUser]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  const loadGroupPosts = useCallback(async (refresh = false) => {
    if (!groupId) return;

    const isFirstPage = refresh ? true : postsPage === 1;

    const itemsPerPage = 10; 
    const from = refresh ? 0 : (postsPage - 1) * itemsPerPage;
    const to = refresh ? itemsPerPage - 1 : from + itemsPerPage - 1;

    if (!refresh && postsPage > 1) {
      setLoadingMorePosts(true);
    } else {
      setLoadingPosts(true);
    }

    try {
      const { data: postData, error: postError } = await supabase
        .from('group_posts_with_users')
        .select(`
          *, 
          author:user_profiles!inner(id, full_name, avatar_url),
          reactions:group_post_reactions(*, user:user_profiles!inner(id, full_name, avatar_url)),
          comments:group_post_comments(*, user:user_profiles!inner(id, full_name, avatar_url))
        `)
        .eq('group_id', groupId)
        // .in('status', ['approved']) // Only show approved posts for now -- Temporarily removed as 'status' column doesn't exist in view
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postError) {
        console.error('Error fetching group posts:', postError.message);
        setError('Failed to load posts.');
        setLoadingPosts(false);
        setLoadingMorePosts(false);
        return;
      }

      const fetchedPosts: GroupPost[] = (postData || []).map((p: any) => ({
        id: p.group_post_id || p.id, // Use group_post_id from view, fallback to p.id
        content: p.content,
        media_url: p.media_url,
        media_type: p.media_type,
        created_at: p.post_created_at || p.created_at, // Use post_created_at from view
        user_id: p.author_profile_id || p.user_id, // This is the author's ID
        author: p.author ? { // p.author should be the object { id, full_name, avatar_url } from the join
          id: p.author.id, // This id is user_profiles.id, which is author_profile_id
          full_name: p.author.full_name,
          avatar_url: p.author.avatar_url,
        } : null,
        reactions: p.reactions || [],
        comments: p.comments || [],
        _count: {
          reactions: p.likes_count ?? 0, // Assuming likes_count is available on p from the view
          comments: p.comments_count ?? 0, // Assuming comments_count is available on p from the view
        },
        status: p.status, // status column is not in the view, so p.status will be undefined
      }));

      setHasMorePosts(fetchedPosts.length === itemsPerPage);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      if (isFirstPage) {
        setLoadingPosts(false);
      } else {
        setLoadingMorePosts(false);
      }
    }
  }, [groupId, postsPage, currentUser]); 

  useEffect(() => {
    loadGroupPosts();
  }, [loadGroupPosts]);

  const handleLoadMorePosts = () => {
    if (!loadingMorePosts && hasMorePosts) {
      setPostsPage(postsPage + 1);
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={loadGroupDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>Group not found.</Text>
      </View>
    );
  }

  const ownerProfile = group.owner; 
  const ownerName = ownerProfile?.full_name || 'Unknown Owner';
  const ownerAvatar = ownerProfile?.avatar_url || 'https://placehold.co/100x100/e1f0ff/333333?text=Own';
  const ownerId = ownerProfile?.id;

  // Derived state for post creation permission
  const canCreatePost = group && currentUser && isMember && 
                        (group.settings?.allowMemberPosts || isAdmin);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader 
        title={group?.name || 'Group Details'} 
        showBackButton={true} 
        rightActions={[
          { 
            iconName: 'Settings', 
            onPress: () => router.push({ pathname: '/(tabs)/community/groups/settings/[id]' as any, params: { id: groupId } }),
            isVisible: isAdmin // Only show settings if user is an admin of this group
          }
        ]}
      />
      <ScrollView 
        style={styles.container}
      >
        {/* Header Section with Group Info */}
        <View style={styles.headerContainer}>
          {/* ... (group avatar, name, type, etc.) ... REST OF THE HEADER JSX */}
          <Image source={{ uri: group.avatar_url || 'https://placehold.co/150x150/e1f0ff/333333?text=Grp' }} style={styles.groupAvatar} />
            <View style={styles.groupInfoContainer}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupType}>{group.type} group • {group.category || 'Uncategorized'}</Text>
              {group.max_members && (
                <Text style={styles.memberCount}>{group.members?.length}/{group.max_members} members</Text>
              )}
              {group.tags && group.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {group.tags.map((tag, index) => <Text key={index} style={styles.tag}>#{tag}</Text>)}
                </View>
              )}
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>

            {/* Join/Leave Button */} 
            {currentUser && !isMember && group.is_public && (
                <TouchableOpacity style={styles.joinButton} onPress={() => { /* TODO: Implement joinGroup logic */ }}>
                    <Text style={styles.joinButtonText}>Join Group</Text>
                </TouchableOpacity>
            )}
            {currentUser && isMember && (
                <TouchableOpacity style={styles.leaveButton} onPress={() => { /* TODO: Implement leaveGroup logic */ }}>
                    <Text style={styles.leaveButtonText}>Leave Group</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <SegmentedControl
            values={['Posts', 'Events', 'Members']}
            selectedIndex={activeTab === 'posts' ? 0 : activeTab === 'events' ? 1 : 2}
            onChange={(event: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
              const selectedIndex = event.nativeEvent.selectedSegmentIndex;
              if (selectedIndex === 0) setActiveTab('posts');
              else if (selectedIndex === 1) setActiveTab('events');
              else if (selectedIndex === 2) setActiveTab('members');
            }}
            tintColor="#007AFF"
            fontStyle={{ color: '#007AFF'}}
            activeFontStyle={{ color: 'white' }}
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'members' && groupId && currentUser?.id && (
            <GroupMembersSection groupId={groupId as string} currentUserId={currentUser?.id} isGroupAdmin={isAdmin} /> 
          )}
          {activeTab === 'posts' && groupId && (
            <GroupPostsSection groupId={groupId as string} /> 
          )}
          {activeTab === 'events' && groupId && (
            <GroupEventsSection groupId={groupId} isGroupAdminForThisGroup={isAdmin} />
          )}
        </View>
      </ScrollView>

      {canCreatePost && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push(`/community/groups/create-post?groupId=${groupId}`)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
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
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  groupInfoContainer: {
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
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  tabContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  tabContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  noMoreItems: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF', // Example color, adjust to your theme
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});