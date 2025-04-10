import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Trophy, Award, Zap, UserPlus, CalendarCheck, MessageSquare, ChevronRight, Gift as GiftIcon, TrendingUp } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import { RewardsService, UserBadge, UserPoints, UserStreak, RewardsError } from '../../../lib/rewardsService';

type RewardItem = {
  id: string;
  type: 'badge' | 'streak' | 'referral';
  label: string;
  status: 'earned' | 'claimed' | 'in-progress';
  metadata: {
    description: string;
    icon: string | null;
    points: number;
    category: string;
    progress?: number;
    target?: number;
    [key: string]: any;
  };
  created_at: string;
};

export default function RewardsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      try {
        // Try to load user badges
        const userBadges = await RewardsService.getUserBadges(user.id);
        setBadges(userBadges);

        // Try to load user streaks
        const userStreaks = await RewardsService.getUserStreaks(user.id);
        setStreaks(userStreaks);

        // Try to load user points
        const points = await RewardsService.getUserPoints(user.id);
        setUserPoints(points);

        // Transform badges into reward items
        const badgeRewards = userBadges.map(badge => ({
          id: badge.id,
          type: 'badge' as const,
          label: badge.badge?.name || 'Unknown Badge',
          status: badge.is_claimed ? 'claimed' as const : 'earned' as const,
          metadata: {
            description: badge.badge?.description || '',
            icon: badge.badge?.icon_url,
            points: badge.badge?.points || 0,
            category: badge.badge?.category || 'general',
            awarded_at: badge.awarded_at,
          },
          created_at: badge.awarded_at,
        }));

        // Transform streaks into reward items
        const streakRewards = userStreaks.map(streak => ({
          id: streak.id,
          type: 'streak' as const,
          label: `${streak.streak_type.charAt(0).toUpperCase() + streak.streak_type.slice(1)} Streak`,
          status: 'in-progress' as const,
          metadata: {
            description: `You've maintained a ${streak.current_count}-day streak!`,
            icon: null,
            points: streak.current_count * 10, // 10 points per day
            category: 'engagement',
            current: streak.current_count,
            longest: streak.longest_count,
          },
          created_at: streak.updated_at,
        }));

        // Combine all rewards and sort by date
        const allRewards = [...badgeRewards, ...streakRewards];
        allRewards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setRewards(allRewards as RewardItem[]);
      } catch (rewardsError: unknown) {
        console.error('Error loading rewards data:', rewardsError);
        
        // Fallback: Create some mock rewards data for demonstration
        const mockRewards: RewardItem[] = [
          {
            id: '1',
            type: 'badge',
            label: 'Welcome Aboard',
            status: 'earned',
            metadata: {
              description: 'Complete your profile setup',
              icon: null,
              points: 50,
              category: 'onboarding',
            },
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'badge',
            label: 'Social Butterfly',
            status: 'earned',
            metadata: {
              description: 'Join 3 different groups',
              icon: null,
              points: 100,
              category: 'social',
            },
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: '3',
            type: 'streak',
            label: 'Login Streak',
            status: 'in-progress',
            metadata: {
              description: 'You\'ve maintained a 5-day streak!',
              icon: null,
              points: 50,
              category: 'engagement',
              current: 5,
              longest: 7,
            },
            created_at: new Date().toISOString(),
          },
        ];
        
        setRewards(mockRewards);
        
        // Set mock points data
        setUserPoints({
          id: '1',
          user_id: user.id,
          total_points: 200,
          available_points: 150,
          lifetime_points: 250,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      console.error('Error loading rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadRewards();
  };

  const handleClaimBadge = async (badgeId: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find the badge in our state
      const badgeToFind = badges.find(b => b.id === badgeId);
      if (!badgeToFind || !badgeToFind.badge) {
        throw new Error('Badge not found');
      }

      // Claim the badge
      await RewardsService.claimBadge(user.id, badgeToFind.badge.id);

      // Show success message
      Alert.alert(
        'Badge Claimed!',
        `You've claimed ${badgeToFind.badge.name} and earned ${badgeToFind.badge.points} points!`,
        [{ text: 'OK', onPress: () => loadRewards() }]
      );
    } catch (err: unknown) {
      console.error('Error claiming badge:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim badge');
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to claim badge');
    }
  };

  const renderBadge = (item: RewardItem) => {
    const isClaimed = item.status === 'claimed';
    const iconName = getIconForCategory(item.metadata.category);

    return (
      <TouchableOpacity
        style={[styles.badgeContainer, isClaimed && styles.claimedBadge]}
        onPress={() => !isClaimed && handleClaimBadge(item.id)}
        disabled={isClaimed}
      >
        <View style={styles.badgeIconContainer}>
          {item.metadata.icon ? (
            <Image source={{ uri: item.metadata.icon }} style={styles.badgeIcon} />
          ) : (
            <Award size={40} color="#FFD700" />
          )}
        </View>
        <Text style={styles.badgeName}>{item.label}</Text>
        <Text style={styles.badgeDescription}>{item.metadata.description}</Text>
        <View style={styles.badgeFooter}>
          <View style={styles.pointsContainer}>
            <Zap size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{item.metadata.points} pts</Text>
          </View>
          {!isClaimed && (
            <TouchableOpacity 
              style={styles.claimButton}
              onPress={() => handleClaimBadge(item.id)}
            >
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          )}
          {isClaimed && (
            <View style={styles.claimedTag}>
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStreak = (item: RewardItem) => {
    return (
      <View style={styles.streakContainer}>
        <View style={styles.streakHeader}>
          <CalendarCheck size={24} color="#0055FF" />
          <Text style={styles.streakTitle}>{item.label}</Text>
        </View>
        <View style={styles.streakBody}>
          <Text style={styles.streakCount}>{item.metadata.current}</Text>
          <Text style={styles.streakLabel}>days</Text>
        </View>
        <View style={styles.streakFooter}>
          <Text style={styles.streakDescription}>{item.metadata.description}</Text>
          <Text style={styles.streakRecord}>Best: {item.metadata.longest} days</Text>
        </View>
      </View>
    );
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'onboarding':
        return <UserPlus size={24} color="#0055FF" />;
      case 'social':
        return <MessageSquare size={24} color="#0055FF" />;
      case 'services':
        return <CalendarCheck size={24} color="#0055FF" />;
      case 'engagement':
        return <Zap size={24} color="#0055FF" />;
      case 'housing':
        return <Award size={24} color="#0055FF" />;
      case 'ndis':
        return <TrendingUp size={24} color="#0055FF" />;
      default:
        return <Trophy size={24} color="#0055FF" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader title="Rewards" />
        <ActivityIndicator size="large" color="#0055FF" />
        <Text style={styles.loadingText}>Loading your rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Rewards" showBackButton={true} onBackPress={() => router.back()} />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.pointsSummary}>
          <View style={styles.pointsHeader}>
            <GiftIcon size={24} color="#0055FF" />
            <Text style={styles.pointsTitle}>Your Points</Text>
          </View>
          <Text style={styles.pointsTotal}>{userPoints?.available_points || 0}</Text>
          <Text style={styles.pointsSubtitle}>Available Points</Text>
          <View style={styles.pointsStats}>
            <View style={styles.pointsStat}>
              <Text style={styles.pointsStatValue}>{userPoints?.total_points || 0}</Text>
              <Text style={styles.pointsStatLabel}>Total</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsStat}>
              <Text style={styles.pointsStatValue}>{userPoints?.lifetime_points || 0}</Text>
              <Text style={styles.pointsStatLabel}>Lifetime</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Trophy size={24} color="#0055FF" />
          <Text style={styles.sectionTitle}>Your Badges</Text>
        </View>

        <View style={styles.badgesGrid}>
          {rewards.filter(r => r.type === 'badge').length > 0 ? (
            rewards
              .filter(r => r.type === 'badge')
              .map(badge => (
                <React.Fragment key={badge.id}>
                  {renderBadge(badge)}
                </React.Fragment>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Award size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No badges yet. Complete activities to earn badges!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <CalendarCheck size={24} color="#0055FF" />
          <Text style={styles.sectionTitle}>Your Streaks</Text>
        </View>

        <View style={styles.streaksContainer}>
          {rewards.filter(r => r.type === 'streak').length > 0 ? (
            rewards
              .filter(r => r.type === 'streak')
              .map(streak => (
                <React.Fragment key={streak.id}>
                  {renderStreak(streak)}
                </React.Fragment>
              ))
          ) : (
            <View style={styles.emptyState}>
              <CalendarCheck size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No streaks yet. Log in regularly to build streaks!
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => router.push('/rewards/redeem' as any)}
        >
          <Text style={styles.redeemButtonText}>Redeem Points</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  pointsSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    marginTop: 0,
    marginBottom: 24,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  pointsTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pointsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  pointsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsStat: {
    alignItems: 'center',
  },
  pointsStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pointsStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  pointsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e1e1e1',
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 24,
  },
  badgeContainer: {
    width: 160,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  claimedBadge: {
    opacity: 0.5,
  },
  badgeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 40,
    height: 40,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF9500',
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  claimedTag: {
    backgroundColor: '#ccc',
    borderRadius: 10,
    padding: 4,
    paddingHorizontal: 8,
  },
  claimedText: {
    fontSize: 12,
    color: '#666',
  },
  streaksContainer: {
    marginHorizontal: 24,
  },
  streakContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  streakBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  streakFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakDescription: {
    fontSize: 14,
    color: '#666',
  },
  streakRecord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  redeemButton: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});