import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Users, Bell } from 'lucide-react-native';
import AppHeader from '../components/AppHeader';

type Notification = {
  id: string;
  type: string;
  content: string;
  seen: boolean;
  created_at: string;
};

function parseNotificationContent(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function renderNotificationCard(notification: Notification, entitySummary?: string) {
  const parsed = parseNotificationContent(notification.content);
  // More contextual summaries
  switch (notification.type) {
    case 'post_share':
      if (parsed?.item_type === 'service_provider' && entitySummary) {
        return `A service provider was shared with you: ${entitySummary}`;
      } else if (parsed?.item_type === 'post' && entitySummary) {
        return `A post was shared with you: ${entitySummary}`;
      }
      return `An item was shared with you! Tap to view.`;
    case 'group_invite':
      if (entitySummary) return `You were invited to group: ${entitySummary}`;
      return 'You were invited to a group!';
    case 'event_invite':
      if (entitySummary) return `You were invited to event: ${entitySummary}`;
      return 'You were invited to an event!';
    case 'housing_share':
      if (entitySummary) return `A housing listing was shared: ${entitySummary}`;
      return 'A housing listing was shared!';
    case 'badge_earned':
      if (parsed && typeof parsed.points === 'number') {
        return `You earned a badge! (+${parsed.points} points)`;
      } else if (parsed && parsed.description) {
        return `You earned a badge: ${parsed.description}`;
      }
      return 'You earned a badge!';
    default:
      if (entitySummary) return entitySummary;
      return typeof notification.content === 'string' ? notification.content : 'You have a new notification.';
  }
}

function onNotificationPress(notification: Notification) {
  const parsed = parseNotificationContent(notification.content);
  if (!parsed) return;
  switch (notification.type) {
    case 'post_share':
      if (parsed.item_type === 'service_provider') {
        router.push({ pathname: '/provider/profile', params: { id: parsed.item_id } });
      } else if (parsed.item_type === 'post') {
        router.push({ pathname: '/profile/post/[postId]', params: { postId: parsed.item_id } });
      }
      break;
    case 'group_invite':
      if (parsed.item_id) {
        router.push({ pathname: '/community/groups/[id]', params: { id: parsed.item_id } });
      }
      break;
    case 'event_invite':
      if (parsed.item_id) {
        router.push({ pathname: '/community/events', params: { id: parsed.item_id } });
      }
      break;
    case 'housing_share':
      if (parsed.item_id) {
        router.push({ pathname: '/housing/[id]', params: { id: parsed.item_id } });
      }
      break;
    case 'badge_earned':
      if (parsed.badge_id) {
        router.push({ pathname: '/rewards/badge-details', params: { badgeId: parsed.badge_id } });
      }
      break;
    default:
      // fallback: do nothing or show details modal
      break;
  }
}

import { Image } from 'react-native';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, { full_name: string; avatar_url: string | null }>>({});
  const [entityImages, setEntityImages] = useState<Record<string, string | null>>({});

  async function loadNotifications() {
    // Helper to get sender_id from notification content
    function extractSenderId(content: string): string | null {
      try {
        const parsed = JSON.parse(content);
        return parsed.sender_id || null;
      } catch {
        return null;
      }
    }
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mark notifications as seen
      await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('user_id', user.id)
        .eq('seen', false);

      setNotifications(data || []);

      // --- IMAGE PREVIEW LOGIC ---
      // Helper to build a fetch plan for missing images
      const fetchPlan: { type: string; id: string; notificationId: string }[] = [];
      const imagesMap: { [key: string]: string | null } = {};
      (data || []).forEach(n => {
        let parsed = null;
        try { parsed = JSON.parse(n.content); } catch {}
        let imgUrl = null;
        let type = null, id = null;
        // Service
        if (parsed && parsed.item_type === 'service_provider' && parsed.media_url) {
          imgUrl = parsed.media_url;
        } else if (parsed && parsed.item_type === 'service_provider' && parsed.item_id) {
          type = 'services'; id = parsed.item_id;
        }
        // Housing
        else if (parsed && parsed.item_type === 'housing' && parsed.media_url) {
          imgUrl = parsed.media_url;
        } else if (parsed && parsed.item_type === 'housing' && parsed.item_id) {
          type = 'housing_listings'; id = parsed.item_id;
        }
        // Group
        else if (parsed && parsed.item_type === 'group' && parsed.media_url) {
          imgUrl = parsed.media_url;
        } else if (parsed && parsed.item_type === 'group' && parsed.item_id) {
          type = 'groups'; id = parsed.item_id;
        }
        // Event
        else if (parsed && parsed.item_type === 'event' && parsed.media_url) {
          imgUrl = parsed.media_url;
        } else if (parsed && parsed.item_type === 'event' && parsed.item_id) {
          type = 'group_events'; id = parsed.item_id;
        }
        // Badge
        else if ((n.type === 'badge_earned' || parsed?.badge_id) && parsed?.badge_icon) {
          imgUrl = parsed.badge_icon;
        } else if ((n.type === 'badge_earned' || parsed?.badge_id) && parsed?.badge_id) {
          type = 'badge_definitions'; id = parsed.badge_id;
        }
        if (imgUrl) {
          imagesMap[n.id] = imgUrl;
        } else if (type && id) {
          fetchPlan.push({ type, id, notificationId: n.id });
        }
      });
      // Batch fetch missing images
      async function batchFetchImages() {
        const results: { [key: string]: string | null } = {};
        const grouped = fetchPlan.reduce((acc, item) => {
          acc[item.type] = acc[item.type] || [];
          acc[item.type].push(item);
          return acc;
        }, {} as { [type: string]: { type: string; id: string; notificationId: string }[] });
        for (const type of Object.keys(grouped)) {
          const ids = grouped[type].map(i => i.id);
          let col = 'id', imgCol = 'media_url';
          if (type === 'services') imgCol = 'media_urls';
          if (type === 'housing_listings') imgCol = 'media_urls';
          if (type === 'groups') imgCol = 'image_url';
          if (type === 'group_events') imgCol = 'image_url';
          if (type === 'badge_definitions') imgCol = 'icon_url';
          const { data: rows, error } = await supabase.from(type).select(`${col}, ${imgCol}`).in(col, ids);
          if (!error && rows) {
            for (const row of rows) {
              let url = null;
              if (Array.isArray(row[imgCol])) url = row[imgCol][0];
              else url = row[imgCol];
              const notif = grouped[type].find(f => f.id === row[col]);
              if (notif) results[notif.notificationId] = url;
            }
          }
        }
        setEntityImages({ ...imagesMap, ...results }); // All keys are string IDs
      }
      if (fetchPlan.length > 0) batchFetchImages();
      else setEntityImages(imagesMap);

      // Fetch sender profiles for all notifications with sender_id
      const senderIds = Array.from(new Set((data || [])
        .map(n => extractSenderId(n.content))
        .filter(id => id && id !== 'null')));

      if (senderIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);
        if (!profileError && Array.isArray(profiles)) {
          const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
          profiles.forEach((p: { id: string; full_name?: string; avatar_url?: string | null }) => {
            profileMap[p.id] = { full_name: p.full_name || 'Unknown', avatar_url: p.avatar_url || null };
          });
          setSenderProfiles(profileMap);
        }
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#ff3b30" />;
      case 'comment':
        return <MessageCircle size={20} color="#007AFF" />;
      case 'group':
        return <Users size={20} color="#34c759" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Notifications" showBackButton={true} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
           notifications.map((notification) => {
                // Determine sender_id
                let senderId = null;
                let entitySummary = '';
                try {
                  const parsed = JSON.parse(notification.content);
                  senderId = parsed.sender_id || null;
                  // Compose summary from referenced entity fields if available
                  if (parsed.item_type === 'service_provider' && parsed.provider_name) {
                    entitySummary = parsed.provider_name;
                  } else if (parsed.item_type === 'post' && parsed.caption) {
                    entitySummary = parsed.caption;
                  } else if (parsed.item_type === 'group' && parsed.group_name) {
                    entitySummary = parsed.group_name;
                  } else if (parsed.item_type === 'event' && parsed.event_title) {
                    entitySummary = parsed.event_title;
                  } else if (parsed.item_type === 'housing' && parsed.housing_title) {
                    entitySummary = parsed.housing_title;
                  }
                } catch { senderId = null; }
                const isSystem = !senderId;
                const sender = isSystem
  ? { full_name: 'Rollodex', avatar_url: require('../assets/avatar-placeholder.png') }
  : (typeof senderId === 'string' && senderProfiles && Object.prototype.hasOwnProperty.call(senderProfiles, senderId)
      ? senderProfiles[senderId]
      : { full_name: 'Unknown', avatar_url: require('../assets/avatar-placeholder.png') });
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.seen && styles.notificationUnseen,
                    ]}
                    onPress={() => onNotificationPress(notification)}
                  >
                    <View style={styles.avatarContainer}>
                      <Image
                        source={
                          sender.avatar_url && typeof sender.avatar_url === 'string'
                            ? { uri: sender.avatar_url }
                            : sender.avatar_url
                        }
                        style={styles.avatar}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.senderName}>{sender.full_name}</Text>
                      <View style={styles.messageRow}>
                        {/* Small entity image if available */}
                        {(() => {
                          const url = typeof notification.id === 'string' && entityImages && Object.prototype.hasOwnProperty.call(entityImages, notification.id)
  ? entityImages[notification.id]
  : null;
                          if (typeof url === 'string' && url) {
                            return (
                              <Image
                                source={{ uri: url }}
                                style={styles.entityImage}
                              />
                            );
                          }
                          return null;
                        })()}
                        <Text style={styles.notificationText}>
                          {renderNotificationCard(notification, entitySummary)}
                        </Text>
                      </View>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eaeaea',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
  senderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
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
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  notificationUnseen: {
    backgroundColor: '#f8f9fa',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 22,
  },
  notificationTime: {
    fontSize: 14,
    color: '#666',
  },
});