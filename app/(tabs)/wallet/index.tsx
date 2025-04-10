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
import { supabase } from '../../../lib/supabase';
import { Wallet as WalletIcon, TrendingUp, Clock, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

type WalletData = {
  total_balance: number;
  category_breakdown: {
    core_support: number;
    capacity_building: number;
    capital_support: number;
  };
};

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadWallet() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get the wallet
      let { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('total_balance, category_breakdown')
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
          .select('total_balance, category_breakdown')
          .single();

        if (createError) {
          console.error("Error creating wallet:", createError);
          setError("Failed to create wallet. Please try again later.");
          walletData = {
            total_balance: 0,
            category_breakdown: {
              core_support: 0,
              capacity_building: 0,
              capital_support: 0
            }
          };
        } else {
          walletData = newWallet;
        }
      }

      // Fetch claims
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          id,
          amount,
          status,
          created_at,
          booking:service_bookings (
            service:services (
              title,
              provider:service_providers (
                business_name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (claimsError) {
        console.error("Error loading claims:", claimsError);
      }

      setWallet(walletData);
      setRecentClaims(claims || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
      setError("Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My NDIS Wallet" showBackButton={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.walletHeader}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.push('/wallet/submit-claim')}
          >
            <Text style={styles.submitButtonText}>Submit Claim</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <WalletIcon size={24} color="#007AFF" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ${wallet?.total_balance?.toLocaleString() || '0.00'}
              </Text>
            </View>
          </View>

          <View style={styles.categories}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Core Support</Text>
              <Text style={styles.categoryAmount}>
                ${wallet?.category_breakdown?.core_support?.toLocaleString() || '0.00'}
              </Text>
              <View style={[styles.categoryBar, { width: wallet?.category_breakdown?.core_support ? '75%' : '0%' }]} />
            </View>

            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Capacity Building</Text>
              <Text style={styles.categoryAmount}>
                ${wallet?.category_breakdown?.capacity_building?.toLocaleString() || '0.00'}
              </Text>
              <View style={[styles.categoryBar, { width: wallet?.category_breakdown?.capacity_building ? '45%' : '0%' }]} />
            </View>

            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Capital Support</Text>
              <Text style={styles.categoryAmount}>
                ${wallet?.category_breakdown?.capital_support?.toLocaleString() || '0.00'}
              </Text>
              <View style={[styles.categoryBar, { width: wallet?.category_breakdown?.capital_support ? '25%' : '0%' }]} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewHistory}
            onPress={() => router.push('/wallet/claims')}
          >
            <Text style={styles.viewHistoryText}>View Claim History</Text>
            <ChevronRight size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Claims</Text>
          {recentClaims.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                You have no recent claims. Submit a claim to see it here.
              </Text>
            </View>
          ) : (
            recentClaims.map((claim) => (
              <View key={claim.id} style={styles.claimCard}>
                <View style={styles.claimHeader}>
                  <View style={styles.claimInfo}>
                    <Text style={styles.claimTitle}>
                      {claim.booking?.service?.title || 'Untitled Service'}
                    </Text>
                    <Text style={styles.claimProvider}>
                      {claim.booking?.service?.provider?.business_name || 'Unknown Provider'}
                    </Text>
                  </View>
                  <Text style={styles.claimAmount}>${claim.amount}</Text>
                </View>

                <View style={styles.claimFooter}>
                  <View style={styles.claimStatus}>
                    {claim.status === 'pending' && (
                      <Clock size={16} color="#666" />
                    )}
                    {claim.status === 'approved' && (
                      <TrendingUp size={16} color="#4CAF50" />
                    )}
                    {claim.status === 'rejected' && (
                      <AlertCircle size={16} color="#ff3b30" />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        claim.status === 'approved' && styles.statusApproved,
                        claim.status === 'rejected' && styles.statusRejected,
                      ]}
                    >
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.claimDate}>
                    {new Date(claim.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    margin: 24,
    marginTop: 0,
    marginBottom: 24,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  balanceCard: {
    margin: 24,
    padding: 20,
    marginTop: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  categories: {
    gap: 16,
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
  viewHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  viewHistoryText: {
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
  emptyState: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimInfo: {
    flex: 1,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  claimProvider: {
    fontSize: 14,
    color: '#666',
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statusApproved: {
    color: '#4CAF50',
  },
  statusRejected: {
    color: '#ff3b30',
  },
  claimDate: {
    fontSize: 14,
    color: '#666',
  },
});