import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Award,
  Trophy,
  Star,
  Calendar,
  BarChart3,
  FileText,
  Medal,
  Crown,
  Heart,
  Zap,
  UserPlus,
  CalendarCheck,
  MessageSquare,
  TrendingUp,
  Share2,
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function BadgeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadReward();
    }
  }, [id]);

  async function loadReward() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReward(data);
    } catch (error) {
      console.error('Error loading reward:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get the appropriate icon based on the metadata
  const getRewardIcon = (iconName: string, size = 40, color = '#007AFF') => {
    switch (iconName) {
      case 'award':
        return <Award size={size} color={color} />;
      case 'zap':
        return <Zap size={size} color={color} />;
      case 'user-plus':
        return <UserPlus size={size} color={color} />;
      case 'calendar-check':
        return <CalendarCheck size={size} color={color} />;
      case 'message-square':
        return <MessageSquare size={size} color={color} />;
      case 'trending-up':
        return <TrendingUp size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Badge Details" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading badge details...</Text>
        </View>
      </View>
    );
  }

  if (!reward) {
    return (
      <View style={styles.container}>
        <AppHeader title="Badge Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Badge not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Badge Details" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.badgeHero}>
          <View style={styles.badgeIconContainer}>
            {getRewardIcon(reward.metadata.icon || 'award', 80, '#007AFF')}
          </View>
          <Text style={styles.badgeName}>{reward.label}</Text>
          <Text style={styles.badgeDescription}>
            {reward.metadata.description || 'Achievement unlocked'}
          </Text>
          
          <View style={styles.badgeInfoRow}>
            <View style={styles.badgeInfoItem}>
              <Calendar size={20} color="#666" />
              <Text style={styles.badgeInfoText}>
                Earned on {new Date(reward.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.badgeInfoItem}>
              <Medal size={20} color="#666" />
              <Text style={styles.badgeInfoText}>
                {reward.metadata.points} points
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Badge</Text>
          <Text style={styles.sectionText}>
            {reward.metadata.description || 'No description available'}.
            {reward.type === 'badge' && " Badges are permanent achievements that recognize your accomplishments within the app."}
            {reward.type === 'streak' && " Streaks reward your consistent engagement with the app. Keep your streak going to earn even more rewards!"}
            {reward.type === 'referral' && " Referral rewards are earned when you invite friends to join the app. Thank you for spreading the word!"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge Perks</Text>
          <View style={styles.perkCard}>
            <View style={styles.perkIconContainer}>
              <Zap size={24} color="#FF9500" />
            </View>
            <View style={styles.perkContent}>
              <Text style={styles.perkTitle}>Bonus Points</Text>
              <Text style={styles.perkDescription}>
                This badge earned you {reward.metadata.points} points towards rewards
              </Text>
            </View>
          </View>
          
          {reward.type === 'referral' && (
            <View style={styles.perkCard}>
              <View style={styles.perkIconContainer}>
                <Award size={24} color="#FF9500" />
              </View>
              <View style={styles.perkContent}>
                <Text style={styles.perkTitle}>{reward.metadata.reward}</Text>
                <Text style={styles.perkDescription}>
                  Special bonus reward for referring friends
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Badges</Text>
          <View style={styles.relatedBadges}>
            <View style={styles.relatedBadge}>
              <View style={styles.relatedBadgeIcon}>
                {getRewardIcon('message-square', 24, '#007AFF')}
              </View>
              <Text style={styles.relatedBadgeText}>Community Contributor</Text>
            </View>
            
            <View style={styles.relatedBadge}>
              <View style={styles.relatedBadgeIcon}>
                {getRewardIcon('trending-up', 24, '#007AFF')}
              </View>
              <Text style={styles.relatedBadgeText}>Progress Champion</Text>
            </View>
            
            <View style={styles.relatedBadge}>
              <View style={styles.relatedBadgeIcon}>
                {getRewardIcon('calendar-check', 24, '#007AFF')}
              </View>
              <Text style={styles.relatedBadgeText}>Regular User</Text>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  badgeHero: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  badgeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  badgeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeInfoText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  perkCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  perkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  perkContent: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  perkDescription: {
    fontSize: 14,
    color: '#666',
  },
  relatedBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  relatedBadge: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  relatedBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  relatedBadgeText: {
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
  },
});