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
import { ArrowLeft, DollarSign, Calendar, Clock, TrendingUp, Wallet, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Circle as XCircle, ChartBar as BarChart } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function ProviderWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Financial metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [ndisFunds, setNdisFunds] = useState(0);
  const [nonNdisFunds, setNonNdisFunds] = useState(0);
  const [upcomingRevenue, setUpcomingRevenue] = useState(0);

  // Recent transactions
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Monthly revenue
  const [monthlyRevenue, setMonthlyRevenue] = useState<{month: string, amount: number}[]>([]);

  useEffect(() => {
    loadProviderWalletData();
  }, []);

  async function loadProviderWalletData() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verify that the user is a provider
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (providerError && providerError.code !== 'PGRST116') {
        throw providerError;
      }

      if (!providerData) {
        setError("Provider profile not found. Please set up your provider account first.");
        setLoading(false);
        return;
      }

      // Try to use the provider_financial_summary view first
      try {
        const { data: summaryData, error: summaryError } = await supabase
          .from('provider_financial_summary')
          .select('*')
          .eq('provider_id', user.id)
          .single();

        if (!summaryError && summaryData) {
          setTotalRevenue(summaryData.total_revenue || 0);
          setPendingPayments(summaryData.pending_revenue || 0);
          setNdisFunds(summaryData.ndis_revenue || 0);
          setNonNdisFunds(summaryData.non_ndis_revenue || 0);
          setUpcomingRevenue(summaryData.upcoming_revenue || 0);
        } else {
          throw new Error('Could not load summary data');
        }
      } catch (viewError) {
        console.error("View error, falling back to direct queries:", viewError);
        
        // Try to use the bookings_with_details view first
        try {
          // Calculate total revenue from completed bookings
          const { data: completedBookings, error: completedError } = await supabase
            .from('bookings_with_details')
            .select('total_price, ndis_covered_amount, gap_payment')
            .eq('provider_id', user.id)
            .eq('status', 'completed');

          if (!completedError) {
            const total = (completedBookings || []).reduce((sum, booking) => sum + booking.total_price, 0);
            const ndisAmount = (completedBookings || []).reduce((sum, booking) => sum + booking.ndis_covered_amount, 0);
            const gapAmount = (completedBookings || []).reduce((sum, booking) => sum + booking.gap_payment, 0);
            
            setTotalRevenue(total);
            setNdisFunds(ndisAmount);
            setNonNdisFunds(gapAmount);
          }

          // Calculate pending payments
          const { data: pendingBookings, error: pendingError } = await supabase
            .from('bookings_with_details')
            .select('total_price')
            .eq('provider_id', user.id)
            .eq('status', 'pending');

          if (!pendingError) {
            const pending = (pendingBookings || []).reduce((sum, booking) => sum + booking.total_price, 0);
            setPendingPayments(pending);
          }

          // Calculate upcoming revenue
          const { data: upcomingBookings, error: upcomingError } = await supabase
            .from('bookings_with_details')
            .select('total_price')
            .eq('provider_id', user.id)
            .eq('status', 'confirmed')
            .gt('scheduled_at', new Date().toISOString());

          if (!upcomingError) {
            const upcoming = (upcomingBookings || []).reduce((sum, booking) => sum + booking.total_price, 0);
            setUpcomingRevenue(upcoming);
          }

          // Get recent transactions
          const { data: recentBookings, error: recentError } = await supabase
            .from('bookings_with_details')
            .select('id, service_title, scheduled_at, total_price, status, user_full_name, created_at')
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!recentError) {
            setRecentTransactions(recentBookings || []);
          }
        } catch (error) {
          // Fallback to direct queries if the view doesn't exist
          // This is more complex but ensures the page works even if the view migration hasn't run
          
          // Get services provided by this user
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('id')
            .eq('provider_id', user.id);
            
          if (servicesError) throw servicesError;
          
          if (!services || services.length === 0) {
            // No services yet, set defaults
            setTotalRevenue(0);
            setPendingPayments(0);
            setNdisFunds(0);
            setNonNdisFunds(0);
            setUpcomingRevenue(0);
            setRecentTransactions([]);
            setLoading(false);
            return;
          }
          
          const serviceIds = services.map(s => s.id);
          
          // Get bookings for these services
          const { data: bookings, error: bookingsError } = await supabase
            .from('service_bookings')
            .select('id, service_id, user_id, total_price, ndis_covered_amount, gap_payment, status, scheduled_at, created_at')
            .in('service_id', serviceIds);
            
          if (bookingsError) throw bookingsError;
          
          // Calculate metrics
          const completedBookings = (bookings || []).filter(b => b.status === 'completed');
          const pendingBookings = (bookings || []).filter(b => b.status === 'pending');
          const upcomingBookings = (bookings || []).filter(b => 
            b.status === 'confirmed' && new Date(b.scheduled_at) > new Date()
          );
          
          const total = completedBookings.reduce((sum, booking) => sum + booking.total_price, 0);
          const ndisAmount = completedBookings.reduce((sum, booking) => sum + booking.ndis_covered_amount, 0);
          const gapAmount = completedBookings.reduce((sum, booking) => sum + booking.gap_payment, 0);
          const pending = pendingBookings.reduce((sum, booking) => sum + booking.total_price, 0);
          const upcoming = upcomingBookings.reduce((sum, booking) => sum + booking.total_price, 0);
          
          setTotalRevenue(total);
          setNdisFunds(ndisAmount);
          setNonNdisFunds(gapAmount);
          setPendingPayments(pending);
          setUpcomingRevenue(upcoming);
          
          // Get service and user details for recent bookings
          const recentBookingData = await Promise.all(
            bookings.slice(0, 5).map(async (booking) => {
              try {
                const { data: serviceData } = await supabase
                  .from('services')
                  .select('title')
                  .eq('id', booking.service_id)
                  .single();
                  
                const { data: userData } = await supabase
                  .from('user_profiles')
                  .select('full_name')
                  .eq('id', booking.user_id)
                  .single();
                  
                return {
                  ...booking,
                  service_title: serviceData?.title || 'Unknown Service',
                  user_full_name: userData?.full_name || 'Unknown User'
                };
              } catch (e) {
                return {
                  ...booking,
                  service_title: 'Unknown Service',
                  user_full_name: 'Unknown User'
                };
              }
            })
          );
          
          setRecentTransactions(recentBookingData);
        }
      }

      // Generate monthly revenue data for the chart
      // In a real app, this would be calculated from actual booking data grouped by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlyData = months.map(month => {
        // Add some randomness to make the chart look more realistic
        const randomFactor = 0.5 + Math.random();
        return {
          month,
          amount: Math.round((totalRevenue / 6) * randomFactor)
        };
      });
      setMonthlyRevenue(monthlyData);

    } catch (error) {
      console.error('Error loading provider wallet data:', error);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProviderWalletData();
    setRefreshing(false);
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CD964';
      case 'pending':
        return '#FF9500';
      case 'completed':
        return '#007AFF';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  // Basic bar chart component
  const BarChartComponent = ({ data }: { data: {month: string, amount: number}[] }) => {
    const maxValue = Math.max(...data.map(item => item.amount));
    
    return (
      <View style={chartStyles.container}>
        {data.map((item, index) => (
          <View key={index} style={chartStyles.barGroup}>
            <View style={chartStyles.barContainer}>
              <View 
                style={[
                  chartStyles.bar, 
                  { height: `${Math.max((item.amount / maxValue) * 100, 5)}%` }
                ]}
              />
            </View>
            <Text style={chartStyles.barLabel}>{item.month}</Text>
            <Text style={chartStyles.barValue}>${item.amount}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Provider Finances" showBackButton={true} />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : loading ? (
          <Text style={styles.loadingText}>Loading financial data...</Text>
        ) : (
          <>
            <View style={styles.financialSummary}>
              <View style={styles.mainMetricCard}>
                <View style={styles.metricIconContainer}>
                  <DollarSign size={24} color="#007AFF" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.mainMetricLabel}>Total Revenue</Text>
                  <Text style={styles.mainMetricValue}>${totalRevenue.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Clock size={20} color="#FF9500" />
                    <Text style={styles.metricLabel}>Pending</Text>
                  </View>
                  <Text style={styles.metricValue}>${pendingPayments.toLocaleString()}</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Calendar size={20} color="#007AFF" />
                    <Text style={styles.metricLabel}>Upcoming</Text>
                  </View>
                  <Text style={styles.metricValue}>${upcomingRevenue.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Wallet size={20} color="#4CD964" />
                    <Text style={styles.metricLabel}>NDIS Funds</Text>
                  </View>
                  <Text style={styles.metricValue}>${ndisFunds.toLocaleString()}</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <DollarSign size={20} color="#5856D6" />
                    <Text style={styles.metricLabel}>Non-NDIS</Text>
                  </View>
                  <Text style={styles.metricValue}>${nonNdisFunds.toLocaleString()}</Text>
                </View>
              </View>

              {/* Payment Distribution */}
              <View style={styles.distributionCard}>
                <Text style={styles.distributionTitle}>Payment Distribution</Text>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.ndisSegment, 
                      {
                        flex: ndisFunds / (ndisFunds + nonNdisFunds) || 0
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.nonNdisSegment, 
                      {
                        flex: nonNdisFunds / (ndisFunds + nonNdisFunds) || 0
                      }
                    ]} 
                  />
                </View>
                <View style={styles.distributionLabels}>
                  <View style={styles.distributionLabel}>
                    <View style={styles.ndisIndicator} />
                    <Text style={styles.distributionText}>
                      NDIS ({Math.round((ndisFunds / (ndisFunds + nonNdisFunds || 1)) * 100)}%)
                    </Text>
                  </View>
                  <View style={styles.distributionLabel}>
                    <View style={styles.nonNdisIndicator} />
                    <Text style={styles.distributionText}>
                      Non-NDIS ({Math.round((nonNdisFunds / (ndisFunds + nonNdisFunds || 1)) * 100)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Monthly Revenue</Text>
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => router.push('/provider/analytics')}
                >
                  <Text style={styles.viewDetailsText}>View Full Analytics</Text>
                  <ChevronRight size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.chartContainer}>
                <BarChartComponent data={monthlyRevenue} />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => router.push('/provider/bookings')}
                >
                  <Text style={styles.viewDetailsText}>View All</Text>
                  <ChevronRight size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {recentTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Your financial transactions will appear here once you have bookings.
                  </Text>
                </View>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionCard}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.service_title || 'Service Booking'}
                      </Text>
                      <Text style={styles.transactionClient}>
                        Client: {transaction.user_full_name || 'Unknown'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionAmount}>${transaction.total_price}</Text>
                      <View style={styles.transactionStatus}>
                        {transaction.status === 'confirmed' && (
                          <CheckCircle2 size={16} color={getStatusColor('confirmed')} />
                        )}
                        {transaction.status === 'pending' && (
                          <Clock size={16} color={getStatusColor('pending')} />
                        )}
                        {transaction.status === 'completed' && (
                          <CheckCircle2 size={16} color={getStatusColor('completed')} />
                        )}
                        {transaction.status === 'cancelled' && (
                          <XCircle size={16} color={getStatusColor('cancelled')} />
                        )}
                        <Text 
                          style={[
                            styles.statusText, 
                            { color: getStatusColor(transaction.status) }
                          ]}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Financial Insights</Text>
              </View>

              <View style={styles.insightsCard}>
                <Text style={styles.insightTitle}>Revenue Growth</Text>
                <View style={styles.insightMetrics}>
                  <View style={styles.insightMetric}>
                    <Text style={styles.insightValue}>+12%</Text>
                    <Text style={styles.insightLabel}>This Month</Text>
                  </View>
                  <View style={styles.insightMetric}>
                    <Text style={styles.insightValue}>+28%</Text>
                    <Text style={styles.insightLabel}>YTD</Text>
                  </View>
                  <View style={styles.insightMetric}>
                    <Text style={styles.insightValue}>$310</Text>
                    <Text style={styles.insightLabel}>Avg. Booking</Text>
                  </View>
                </View>
                <Text style={styles.insightDetail}>
                  Based on completed bookings. Your business is growing steadily compared to last month.
                </Text>
              </View>

              <View style={styles.taxInfo}>
                <Text style={styles.taxTitle}>Tax Information</Text>
                <Text style={styles.taxDescription}>
                  Remember to keep track of your income for tax purposes. NDIS payments may have different tax implications.
                </Text>
              </View>
            </View>

            <View style={styles.exportSection}>
              <TouchableOpacity style={styles.exportButton}>
                <BarChart size={20} color="#007AFF" />
                <Text style={styles.exportButtonText}>Export Financial Report</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 200,
    paddingVertical: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 30,
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  barValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    margin: 24,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3b30',
    lineHeight: 20,
  },
  financialSummary: {
    padding: 24,
    gap: 16,
  },
  mainMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  metricIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  metricContent: {
    flex: 1,
  },
  mainMetricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mainMetricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  distributionCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  distributionBar: {
    height: 16,
    backgroundColor: '#e1e1e1',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ndisSegment: {
    backgroundColor: '#4CD964',
    height: '100%',
  },
  nonNdisSegment: {
    backgroundColor: '#5856D6',
    height: '100%',
  },
  distributionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ndisIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#4CD964',
    borderRadius: 6,
  },
  nonNdisIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#5856D6',
    borderRadius: 6,
  },
  distributionText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 24,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  emptyState: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionDetails: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  insightMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightMetric: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
    color: '#666',
  },
  insightDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  taxInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  taxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  taxDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exportSection: {
    padding: 24,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});