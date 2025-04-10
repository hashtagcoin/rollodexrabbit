import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Wallet, Calendar, MapPin, Star } from 'lucide-react-native';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
    ndis_number: string | null;
    preferred_categories: string[] | null;
    role: string | null;
  } | null>(null);
  const [wallet, setWallet] = useState<{
    total_balance: number;
    category_breakdown: {
      core_support: number;
      capacity_building: number;
      capital_support: number;
    }
  } | null>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, ndis_number, preferred_categories, role')
        .eq('id', user.id)
        .single();

      setProfile(profile);

      // Try to get the wallet
      let { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing wallet

      // If wallet doesn't exist, create one
      if (!walletData) {
        const defaultWalletData = {
          user_id: user.id,
          total_balance: 15000,
          category_breakdown: {
            core_support: 8000,
            capacity_building: 5000,
            capital_support: 2000
          }
        };

        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert(defaultWalletData)
          .select()
          .single();

        if (createError) {
          console.error("Error creating wallet:", createError);
        } else {
          walletData = newWallet;
        }
      }

      setWallet(walletData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when the screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      ref={scrollViewRef}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          {profile?.ndis_number && (
            <Text style={styles.ndisNumber}>NDIS: {profile.ndis_number}</Text>
          )}
        </View>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletIcon}>
            <Wallet size={24} color="#007AFF" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>NDIS Wallet Balance</Text>
            <Text style={styles.walletBalance}>
              ${wallet?.total_balance?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>
        <View style={styles.walletCategories}>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Core Support</Text>
            <Text style={styles.categoryAmount}>
              ${wallet?.category_breakdown?.core_support?.toLocaleString() || '0'}
            </Text>
            <View style={[styles.categoryBar, { width: '75%' }]} />
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Capacity Building</Text>
            <Text style={styles.categoryAmount}>
              ${wallet?.category_breakdown?.capacity_building?.toLocaleString() || '0'}
            </Text>
            <View style={[styles.categoryBar, { width: '45%' }]} />
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Capital Support</Text>
            <Text style={styles.categoryAmount}>
              ${wallet?.category_breakdown?.capital_support?.toLocaleString() || '0'}
            </Text>
            <View style={[styles.categoryBar, { width: '25%' }]} />
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewWallet}
          onPress={() => {
            if (profile?.role === 'provider') {
              router.push('/provider/wallet');
            } else {
              router.push('/wallet');
            }
          }}
        >
          <Text style={styles.viewWalletText}>View Wallet</Text>
          <ChevronRight size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <View style={styles.appointmentCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.providerImage}
          />
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentTitle}>Physiotherapy Session</Text>
            <View style={styles.appointmentMeta}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="#666" />
                <Text style={styles.metaText}>Tomorrow at 10:00 AM</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={16} color="#666" />
                <Text style={styles.metaText}>2.5 km away</Text>
              </View>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Dr. Sarah Wilson</Text>
              <View style={styles.rating}>
                <Star size={16} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
          {[1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.serviceCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.serviceImage}
              />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>Occupational Therapy</Text>
                <Text style={styles.serviceProvider}>HealthBridge Services</Text>
                <View style={styles.serviceMeta}>
                  <Text style={styles.servicePrice}>$120/session</Text>
                  <Text style={styles.serviceLocation}>2km away</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    flex: 1,
  },
  welcome: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ndisNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
  },
  avatarPlaceholder: {
    backgroundColor: '#e1e1e1',
  },
  walletCard: {
    margin: 24,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  walletCategories: {
    marginBottom: 16,
    gap: 12,
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryBar: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  viewWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  viewWalletText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    overflow: 'hidden',
  },
  providerImage: {
    width: 100,
    height: 100,
  },
  appointmentInfo: {
    flex: 1,
    padding: 16,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  appointmentMeta: {
    gap: 4,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  servicesScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  serviceCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginRight: 16,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 160,
  },
  serviceInfo: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceLocation: {
    fontSize: 14,
    color: '#666',
  },
});