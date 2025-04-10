import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Gift, ChevronLeft, Zap, Check } from 'lucide-react-native';
import { RewardsService, UserPoints } from '../../lib/rewardsService';

type RedeemableReward = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
  stock_remaining: number | null;
};

export default function RedeemRewardsScreen() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<RedeemableReward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRedeemableRewards();
  }, []);

  async function loadRedeemableRewards() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load user points
      const points = await RewardsService.getUserPoints(user.id);
      setUserPoints(points);

      // For now, we'll use mock data for redeemable rewards
      // In a real app, this would come from the database
      const mockRewards: RedeemableReward[] = [
        {
          id: '1',
          name: '$10 Service Credit',
          description: 'Get $10 credit to use on any service booking',
          points_cost: 1000,
          image_url: null,
          category: 'service',
          is_available: true,
          stock_remaining: null,
        },
        {
          id: '2',
          name: 'Premium Profile Badge',
          description: 'Show off your status with a premium profile badge',
          points_cost: 750,
          image_url: null,
          category: 'profile',
          is_available: true,
          stock_remaining: null,
        },
        {
          id: '3',
          name: 'Priority Support',
          description: 'Get priority support for 30 days',
          points_cost: 500,
          image_url: null,
          category: 'support',
          is_available: true,
          stock_remaining: null,
        },
        {
          id: '4',
          name: 'Exclusive Group Access',
          description: 'Get access to exclusive community groups',
          points_cost: 1200,
          image_url: null,
          category: 'community',
          is_available: true,
          stock_remaining: null,
        },
        {
          id: '5',
          name: 'NDIS Plan Review Assistance',
          description: 'Get professional help with your NDIS plan review',
          points_cost: 2000,
          image_url: null,
          category: 'ndis',
          is_available: true,
          stock_remaining: null,
        },
      ];

      setRewards(mockRewards);
    } catch (err: unknown) {
      console.error('Error loading redeemable rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load redeemable rewards');
    } finally {
      setLoading(false);
    }
  }

  const handleRedeemReward = async (reward: RedeemableReward) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user has enough points
      if (!userPoints || userPoints.available_points < reward.points_cost) {
        Alert.alert('Insufficient Points', 'You don\'t have enough points to redeem this reward.');
        return;
      }

      // In a real app, we would call an API to redeem the reward
      // For now, we'll just show a success message
      Alert.alert(
        'Reward Redeemed!',
        `You've successfully redeemed ${reward.name} for ${reward.points_cost} points.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Update user points (this would normally be done by the server)
              if (userPoints) {
                const updatedPoints = {
                  ...userPoints,
                  available_points: userPoints.available_points - reward.points_cost,
                  total_points: userPoints.total_points - reward.points_cost,
                };
                setUserPoints(updatedPoints);
              }
            },
          },
        ]
      );
    } catch (err: unknown) {
      console.error('Error redeeming reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to redeem reward');
    }
  };

  const canRedeem = (reward: RedeemableReward) => {
    return (
      reward.is_available &&
      (reward.stock_remaining === null || reward.stock_remaining > 0) &&
      userPoints &&
      userPoints.available_points >= reward.points_cost
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0055FF" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem Points</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsLabel}>Available Points</Text>
        <View style={styles.pointsValueContainer}>
          <Zap size={20} color="#FFD700" />
          <Text style={styles.pointsValue}>{userPoints?.available_points || 0}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Available Rewards</Text>

        {rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardIconContainer}>
              <Gift size={24} color="#FF9500" />
            </View>
            <View style={styles.rewardDetails}>
              <Text style={styles.rewardTitle}>{reward.name}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
              <View style={styles.rewardPointsContainer}>
                <Zap size={16} color="#FFD700" />
                <Text style={styles.rewardPoints}>{reward.points_cost} points</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.redeemButton,
                !canRedeem(reward) && styles.disabledRedeemButton,
              ]}
              onPress={() => handleRedeemReward(reward)}
              disabled={!canRedeem(reward)}
            >
              <Text
                style={[
                  styles.redeemButtonText,
                  !canRedeem(reward) && styles.disabledRedeemButtonText,
                ]}
              >
                Redeem
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>How Points Work</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Earning Points</Text>
          <View style={styles.infoItem}>
            <Check size={16} color="#0055FF" />
            <Text style={styles.infoText}>Complete your profile</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0055FF" />
            <Text style={styles.infoText}>Join and participate in groups</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0055FF" />
            <Text style={styles.infoText}>Book services through the app</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0055FF" />
            <Text style={styles.infoText}>Maintain daily login streaks</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0055FF" />
            <Text style={styles.infoText}>Refer friends to join Rollodex</Text>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerRight: {
    width: 40,
  },
  pointsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pointsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 16,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
    marginBottom: 16,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 16,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disabledRedeemButton: {
    backgroundColor: '#e1e1e1',
  },
  disabledRedeemButtonText: {
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
});
