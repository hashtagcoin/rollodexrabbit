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
import { useAuth } from '../../../../providers/AuthProvider';
import defaultGroupAvatar from '../../../../assets/images/default-group.png';

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
  }[] | null;
  event_date?: string;
  event_location?: string;
  membership_status?: 'pending' | 'approved';
  listing_title?: string;
  listing_media_urls?: string[];
  source: 'groups' | 'housing_groups';
};

export default function GroupsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState<'all' | 'interest' | 'housing' | 'event'>('all');

  async function loadGroups() {
    setLoading(true);
    let combinedGroups: Group[] = [];
    const groupIds = new Set<string>();

    try {
      // --- MODIFIED CONDITION: Include 'housing' filter case ---
      if (filter === 'all' || filter === 'interest' || filter === 'event' || filter === 'housing') {
        const query = supabase
          .from('groups')
          .select(`
            id, name, type, description, created_at, avatar_url, is_public, event_date, event_location,
            member_count:group_members!group_id(count),
            owner:user_profiles!owner_id (full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          // Apply the type filter if not 'all'
          query.eq('type', filter);
        }

        const { data: standardGroupsData, error: standardGroupsError } = await query;

        if (standardGroupsError) {
          console.error('Error loading standard groups:', standardGroupsError);
          throw standardGroupsError;
        }

        if (standardGroupsData) {
          standardGroupsData.forEach(group => {
            if (!groupIds.has(group.id)) {
              combinedGroups.push({
                ...group,
                member_count: group.member_count || [],
                owner: group.owner || null,
                source: 'groups'
              });
              groupIds.add(group.id);
            }
          });
        }
      }

      // --- Fetch co-living groups (only if filter is 'all' or 'housing') ---
      // This part remains the same
      if (userId && (filter === 'all' || filter === 'housing')) {
        const { data: userHousingGroupsData, error: userHousingGroupsError } = await supabase
          .from('housing_group_members')
          .select(`
            status,
            group:housing_groups!inner (
              id,
              name,
              description,
              created_at,
              listing:housing_listings!inner (
                title,
                media_urls
              )
            )
          `)
          .eq('user_id', userId);

        if (userHousingGroupsError) {
          console.error('Error loading user housing groups:', userHousingGroupsError);
        }

        if (userHousingGroupsData) {
          const potentiallyUnsafeData = userHousingGroupsData as any[];

          const mappedHousingGroups: Group[] = potentiallyUnsafeData
            .filter(item => item && item.group)
            .map((item) => {
              const group = item.group as any;
              const listing = group.listing;

              return {
                id: group.id,
                name: group.name || listing?.title || 'Housing Group',
                type: 'housing' as const,
                description: group.description || '',
                created_at: group.created_at || new Date().toISOString(),
                avatar_url: listing?.media_urls?.[0] || null,
                is_public: false,
                member_count: [],
                owner: null,
                membership_status: item.status as ('pending' | 'approved'),
                listing_title: listing?.title,
                listing_media_urls: listing?.media_urls || [],
                source: 'housing_groups'
              };
            });

          mappedHousingGroups.forEach(group => {
            if (!groupIds.has(group.id)) {
              combinedGroups.push({
                ...group,
                source: 'housing_groups'
              }); 
              groupIds.add(group.id);
            }
          });
        }
      }

      combinedGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setGroups(combinedGroups);
    } catch (error) {
      console.error('Error in loadGroups:', error);
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
                onPress={() => {
                  if (group.type === 'housing') {
                    // Pass source as a query parameter
                    router.push(`/housing/group/${group.id}?source=${group.source}`);
                  } else {
                    router.push(`/community/groups/${group.id}`);
                  }
                }}
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

                {group.type === 'housing' && group.membership_status === 'pending' && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                )}

                <Image
                  source={group.avatar_url ? { uri: group.avatar_url } : defaultGroupAvatar}
                  style={styles.groupImage}
                  resizeMode="cover"
                />

                <View style={styles.groupInfo}>
                  <View style={styles.groupNameContainer}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {!group.is_public && group.type !== 'housing' && (
                      <Lock size={14} color="#666" />
                    )}
                  </View>
                  
                  {group.type === 'housing' && group.listing_title ? (
                     <Text style={styles.groupMeta}>Listing: {group.listing_title}</Text>
                  ) : group.owner && group.owner.length > 0 ? (
                     <Text style={styles.groupMeta}>Owner: {group.owner[0].full_name}</Text>
                  ) : null }

                  {group.type !== 'housing' ? (
                    <Text style={styles.groupMeta}>
                      {group.member_count?.[0]?.count || 0} Members
                    </Text>
                   ) : (
                     <Text style={styles.groupMeta}>Housing Group</Text>
                   )}

                  {group.type === 'event' && group.event_date && (
                      <View style={styles.eventDetails}>
                          <CalendarDays size={14} color="#666" />
                          <Text style={styles.eventText}>Event Date: {new Date(group.event_date).toLocaleDateString()}</Text>
                      </View>
                  )}
                  {group.type === 'event' && group.event_location && (
                       <View style={styles.eventDetails}>
                           <Text style={styles.eventText}>Location: {group.event_location}</Text>
                       </View>
                  )}
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
    gap: 8,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'orange',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 2,
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#e1f0ff',
  },
  groupInfo: {
    flex: 1,
    alignItems: 'center',
    marginRight: 4,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 5,
  },
  groupMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  eventText: {
    fontSize: 12,
    color: '#666',
  },
});