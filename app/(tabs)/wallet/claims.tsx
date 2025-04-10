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
import { ArrowLeft, TrendingUp, Clock, CircleAlert as AlertCircle, Filter } from 'lucide-react-native';

export default function ClaimsHistory() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  async function loadClaims() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('claims')
        .select(`
          id,
          amount,
          status,
          created_at,
          expiry_date,
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
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setClaims(data || []);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Claims History</Text>
      </View>

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
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'pending' && styles.filterSelected]}
          onPress={() => setFilter('pending')}
        >
          <Clock size={16} color={filter === 'pending' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'pending' && styles.filterTextSelected,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'approved' && styles.filterSelected]}
          onPress={() => setFilter('approved')}
        >
          <TrendingUp size={16} color={filter === 'approved' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'approved' && styles.filterTextSelected,
            ]}
          >
            Approved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'rejected' && styles.filterSelected]}
          onPress={() => setFilter('rejected')}
        >
          <AlertCircle size={16} color={filter === 'rejected' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.filterText,
              filter === 'rejected' && styles.filterTextSelected,
            ]}
          >
            Rejected
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
          <Text style={styles.loadingText}>Loading claims...</Text>
        ) : claims.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Claims Found</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? `You haven't submitted any claims yet`
                : `You don't have any ${filter} claims`}
            </Text>
          </View>
        ) : (
          claims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <View style={styles.claimHeader}>
                <View style={styles.claimInfo}>
                  <Text style={styles.claimTitle}>
                    {claim.booking?.service?.title || 'Unknown Service'}
                  </Text>
                  <Text style={styles.claimProvider}>
                    {claim.booking?.service?.provider?.business_name || 'Unknown Provider'}
                  </Text>
                </View>
                <Text style={styles.claimAmount}>${claim.amount}</Text>
              </View>

              <View style={styles.claimDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>
                    {new Date(claim.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expires</Text>
                  <Text style={styles.detailValue}>
                    {new Date(claim.expiry_date).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusContainer}>
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
                </View>
              </View>
            </View>
          ))
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
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  claimDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  statusContainer: {
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
});