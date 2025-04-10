import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Users, Plus, Chrome as Home, Heart, Filter, Lock } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';

type Group = {
  id: string;
  name: string;
  type: 'interest' | 'housing';
  description: string;
  created_at: string;
  avatar_url: string | null;
  is_public: boolean;
  member_count: { count: number }[];
  owner: {
    full_name: string;
    avatar_url: string;
  }[] | null;
};

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState<'all' | 'interest' | 'housing'>('all');

  async function loadGroups() {
    try {
      setLoading(true);
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          type,
          description,
          created_at,
          avatar_url,
          is_public,
          member_count:group_members!group_id(count),
          owner:user_profiles!owner_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      let filteredGroups = groupsData || [];
      if (filter !== 'all') {
        filteredGroups = filteredGroups.filter((group) => group.type === filter);
      }

      if (error) {
        console.error('Error loading groups:', error);
      }

      setGroups(filteredGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Community Groups" showBackButton={true} />
      
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/community/groups/create')}
      >
        <Plus size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterSelected]}
          onPress={() => setFilter('all')}
        >
          <Filter size={16} color={filter === 'all' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextSelected,
            ]}
          >
            All Groups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'interest' && styles.filterSelected]}
          onPress={() => setFilter('interest')}
        >
          <Heart size={16} color={filter === 'interest' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'interest' && styles.filterTextSelected,
            ]}
          >
            Interest Groups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'housing' && styles.filterSelected]}
          onPress={() => setFilter('housing')}
        >
          <Home size={16} color={filter === 'housing' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'housing' && styles.filterTextSelected,
            ]}
          >
            Housing Groups
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading groups...</Text>
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Groups Found</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Create a new group to get started'
                : `No ${filter} groups available`}
            </Text>
          </View>
        ) : (
          <View style={styles.groupsGrid}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => router.push(`/community/groups/${group.id}`)}
              >
                <View style={styles.groupTouchable}>
                  <Image 
                    source={{ uri: group.avatar_url || 'https://placehold.co/100x100/e1f0ff/333333?text=Grp' }} 
                    style={styles.groupAvatar} 
                  />
                  <View style={styles.groupTextContent}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      {!group.is_public && <Lock size={16} color="#666" style={styles.privacyIcon} />}
                    </View>
                    <Text style={styles.groupDescription} numberOfLines={2}>
                      {group.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.groupFooter}>
                  <View style={styles.memberCount}>
                    <Users size={16} color="#666" />
                    <Text style={styles.memberCountText}>
                      {group.member_count?.[0]?.count ?? 0} members
                    </Text>
                  </View>

                  <View style={styles.owner}>
                    <Image
                      source={{ uri: group.owner?.[0]?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' }}
                      style={styles.ownerAvatar}
                    />
                    <Text style={styles.ownerName}>
                      by {group.owner?.[0]?.full_name ?? 'Unknown Owner'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  filterSelected: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  groupsGrid: {
    padding: 24,
    gap: 16,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
  },
  groupTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#e1f0ff',
  },
  groupTextContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 5,
  },
  privacyIcon: {
    marginLeft: 5,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 14,
    color: '#666',
  },
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
  },
});