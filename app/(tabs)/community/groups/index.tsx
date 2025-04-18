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
import { ArrowLeft, Users, Plus, Chrome as Home, Heart, Filter, Lock, CalendarDays } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';

type Group = {
  id: string;
  name: string;
  type: 'interest' | 'housing' | 'event';
  description: string;
  created_at: string;
  avatar_url: string | null;
  is_public: boolean;
  member_count: { count: number }[];
  owner: {
    full_name: string;
    avatar_url: string;
  } | null;
  event_date?: string;
  event_location?: string;
};

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState<'all' | 'interest' | 'housing' | 'event'>('all');

  async function loadGroups() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          type,
          description,
          created_at,
          avatar_url,
          is_public,
          event_date,
          event_location,
          member_count:group_members!group_id(count),
          owner:user_profiles!owner_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Raw data from Supabase:', JSON.stringify(data, null, 2)); // Log raw data

      const groupsData = data || [];

      if (error) {
        console.error('Error loading groups:', error);
      }

      const transformedGroups: Group[] = groupsData.map((group: any) => ({
        ...group,
        type: group.type || 'interest', // fallback for legacy/null types
        member_count: group.member_count || [], // Ensure member_count is always an array
      }));

      let filteredGroups = transformedGroups;
      if (filter !== 'all') {
        filteredGroups = transformedGroups.filter((group) => {
          return group.type === filter;
        });
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
      
      <View style={styles.headerActions}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterSelected]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'interest' && styles.filterSelected]}
            onPress={() => setFilter('interest')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'interest' && styles.filterTextSelected,
              ]}
            >
              Interest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'housing' && styles.filterSelected]}
            onPress={() => setFilter('housing')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'housing' && styles.filterTextSelected,
              ]}
            >
              Housing
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'event' && styles.filterSelected]}
            onPress={() => setFilter('event')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'event' && styles.filterTextSelected,
              ]}
            >
              Events
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/community/groups/create')}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Group</Text>
        </View>
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
                <View style={styles.typeLabel}>
                  <Text style={[
                    styles.typeLabelText, 
                    { 
                      backgroundColor: 
                        group.type === 'interest' ? '#6C5CE7' : 
                        group.type === 'housing' ? '#00B894' : 
                        '#FF9F43' 
                    }
                  ]}>
                    {group.type === 'interest' ? 'Interest' : 
                     group.type === 'housing' ? 'Housing' : 'Event'}
                  </Text>
                </View>
                
                <View style={styles.groupTouchable}>
                  <Image 
                    source={{ uri: group.avatar_url || 'https://placehold.co/100x100/e1f0ff/333333?text=Grp' }} 
                    style={styles.groupAvatar} 
                  />
                  <View style={styles.groupTextContent}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{group.name}
            {group.type === 'housing' && (
              <Text style={styles.housingTag}>  [Housing]</Text>
            )}
            {group.type === 'event' && (
              <Text style={styles.eventTag}>  [Event]</Text>
            )}
          </Text>
                      {!group.is_public && <Lock size={16} color="#666" style={styles.privacyIcon} />}
                    </View>
                    <Text style={styles.groupDescription} numberOfLines={2}>
                      {group.description}
                    </Text>
                    
                    {group.type === 'event' && group.event_date && (
                      <View style={styles.eventInfo}>
                        <CalendarDays size={14} color="#666" />
                        <Text style={styles.eventDate}>
                          {new Date(group.event_date).toLocaleDateString()}
                        </Text>
                        {group.event_location && (
                          <>
                            <Text style={styles.eventLocation}>at {group.event_location}</Text>
                          </>
                        )}
                      </View>
                    )}
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
                      source={{ uri: group.owner?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop' }}
                      style={styles.ownerAvatar}
                    />
                    <Text style={styles.ownerName}>
                      by {group.owner?.full_name ?? 'Unknown Owner'}
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
  housingTag: {
    color: '#00B894',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  eventTag: {
    color: '#FF9F43',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterSelected: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  filterTextSelected: {
    color: '#fff',
  },
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 2,
  },
  buttonLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
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
    padding: 12,
    gap: 8, // Reduced from 16 to 8
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
    marginBottom: 8, // Added to decrease distance between cards
    position: 'relative', // For absolute positioning of the type label
  },
  typeLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  typeLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  groupTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#e1f0ff',
  },
  groupTextContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    fontSize: 18, // Increased from 16 to 18
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
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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