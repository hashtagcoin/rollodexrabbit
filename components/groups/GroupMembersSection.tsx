import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjust path as needed
import { Ionicons } from '@expo/vector-icons'; // For icons

interface ProfileBase {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  // Add other profile fields if needed, e.g., username
}

export interface GroupMember {
  user_id: string; // from group_members table
  group_id: string; // from group_members table
  role: 'admin' | 'member' | 'moderator'; // Roles defined in your system
  joined_at: string;
  user: ProfileBase | null; // Joined user_profiles data
}

interface GroupMembersSectionProps {
  groupId: string;
  currentUserId?: string; // ID of the currently logged-in user
  isGroupAdmin: boolean;
}

const GroupMembersSection: React.FC<GroupMembersSectionProps> = ({ groupId, currentUserId, isGroupAdmin }) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_id,
          role,
          joined_at,
          user:user_profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (fetchError) {
        console.error('Error fetching group members:', fetchError);
        throw fetchError;
      }
      const mappedData = data ? data.map(member => {
        // Handle cases where Supabase types might return user as an array despite !inner join
        // or if the select implies a potential array that needs to be narrowed.
        const userProfile = Array.isArray(member.user) ? (member.user[0] as ProfileBase) : (member.user as ProfileBase | null);
        return {
          ...member,
          user: userProfile,
        };
      }) : [];
      setMembers(mappedData as GroupMember[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load members.');
      console.error('Catch block error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      fetchMembers();
    }
  }, [groupId, fetchMembers]);

  const handleRemoveMember = (memberUserId: string) => {
    // TODO: Implement remove member logic (only for admins)
    console.log(`Admin action: Remove member ${memberUserId}`);
    // Needs confirmation, then Supabase call to delete from group_members
    // Refresh list afterwards
  };

  const handleChangeRole = (memberUserId: string, newRole: string) => {
    // TODO: Implement change role logic (only for admins)
    console.log(`Admin action: Change role for ${memberUserId} to ${newRole}`);
    // Needs role selection UI, confirmation, Supabase call to update group_members
    // Refresh list afterwards
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItemContainer}>
      <Image 
        source={{ uri: item.user?.avatar_url || 'https://placehold.co/60x60/e1f0ff/333333?text=User' }} 
        style={styles.avatar} 
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user?.full_name || 'User'}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>
      {isGroupAdmin && item.user?.id !== currentUserId && (
        <View style={styles.adminActions}>
          <TouchableOpacity onPress={() => handleRemoveMember(item.user_id)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="red" />
          </TouchableOpacity>
          {/* Add more actions like change role here if needed */}
          {/* Example: Promote/Demote - this would need a modal or dropdown for role selection
          <TouchableOpacity onPress={() => handleChangeRole(item.user_id, 'admin')} style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={20} color="green" />
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchMembers} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (members.length === 0) {
    return <View style={styles.center}><Text>No members found in this group.</Text></View>;
  }

  return (
    <FlatList
      data={members}
      renderItem={renderMemberItem}
      keyExtractor={(item) => item.user_id}
      style={styles.list}
      contentContainerStyle={styles.listContentContainer}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContentContainer: {
    paddingVertical: 10,
  },
  memberItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10, // Space out buttons if multiple
    padding: 5, // Make touch target larger
  },
});

export default GroupMembersSection;
