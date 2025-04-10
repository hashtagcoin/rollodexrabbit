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
import { supabase } from '../../../lib/supabase';
import { Calendar, TrendingUp, Package, Users, ChevronRight, CirclePlus as PlusCircle, CircleCheck as CheckCircle2, Timer, Circle as XCircle } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function ProviderDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    activeBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
  });
  const [providerExists, setProviderExists] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (providerError && providerError.code !== 'PGRST116') { 
        // Handle database-related errors, but not "no rows returned" error
        console.error('Database error:', providerError);
        throw providerError;
      }

      // Check if provider exists
      if (!providerData) {
        console.log("No provider profile exists for this user");
        setProviderExists(false);
        setProviderData(null);
        setLoading(false);
        return;
      }

      setProviderData(providerData);
      setProviderExists(true);

      // Load service count
      const { count: serviceCount, error: serviceCountError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id);

      if (serviceCountError) throw serviceCountError;

      // Load bookings using bookings_with_details view
      const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings_with_details')
        .select('*')
        .eq('provider_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (bookingsError) {
        // Fallback to direct query if view doesn't exist yet
        console.log("Fallback to direct bookings query");
        const { data: directBookings, error: directError } = await supabase
          .from('service_bookings')
          .select(`
            id,
            scheduled_at,
            total_price,
            status,
            service:services!inner(
              id,
              title,
              provider_id
            )
          `)
          .eq('service.provider_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (directError) throw directError;
        
        // Manually get user info for each booking
        const bookingsWithUserInfo = await Promise.all((directBookings || []).map(async (booking) => {
          try {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('id', booking.user_id)
              .single();
              
            return {
              ...booking,
              user_full_name: userData?.full_name || 'Unknown User'
            };
          } catch (e) {
            return {
              ...booking,
              user_full_name: 'Unknown User'
            };
          }
        }));
        
        setRecentBookings(bookingsWithUserInfo.slice(0, 5) || []);
      } else {
        // If view query succeeded
        setRecentBookings(allBookings?.slice(0, 5) || []);
      }

      // Filter bookings
      const now = new Date();
      const upcomingBookings = allBookings?.filter(
        booking => new Date(booking.scheduled_at) > now && booking.status !== 'cancelled'
      ) || [];
      const completedBookings = allBookings?.filter(
        booking => booking.status === 'completed'
      ) || [];
      const activeBookings = allBookings?.filter(
        booking => booking.status === 'confirmed' && new Date(booking.scheduled_at) > now
      ) || [];

      // Set metrics
      setMetrics({
        totalServices: serviceCount || 0,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        upcomingBookings: upcomingBookings.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCreateProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile to use full_name for business_name
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Create provider profile
      const { error: createError } = await supabase
        .from('service_providers')
        .insert({
          id: user.id,
          business_name: userProfile?.full_name ? `${userProfile.full_name}'s Services` : 'New Provider',
          verified: false,
        });

      if (createError) throw createError;
      
      // Reload data
      await loadDashboardData();
    } catch (error) {
      console.error('Error creating provider profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get status icon
  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 size={size} color={getStatusColor(status)} />;
      case 'pending':
        return <Timer size={size} color={getStatusColor(status)} />;
      case 'completed':
        return <CheckCircle2 size={size} color={getStatusColor(status)} />;
      case 'cancelled':
        return <XCircle size={size} color={getStatusColor(status)} />;
      default:
        return null;
    }
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

  // Provider not set up yet - show creation UI
  if (!providerExists && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Provider Dashboard</Text>
          <Text style={styles.subtitle}>
            Get started as a provider
          </Text>
        </View>

        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Set Up Your Provider Account</Text>
          <Text style={styles.setupDescription}>
            Create your provider profile to start offering services through the platform.
            You'll be able to list services, manage bookings, and track your revenue.
          </Text>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={handleCreateProfile}
            disabled={loading}
          >
            <Text style={styles.setupButtonText}>
              {loading ? 'Setting up...' : 'Create Provider Profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Provider Dashboard" showBackButton={false} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Package size={24} color="#007AFF" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Active Services</Text>
              <Text style={styles.metricValue}>{metrics.totalServices}</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Calendar size={24} color="#007AFF" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Upcoming Bookings</Text>
              <Text style={styles.metricValue}>{metrics.upcomingBookings}</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <CheckCircle2 size={24} color="#4CD964" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={styles.metricValue}>{metrics.completedBookings}</Text>
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <TrendingUp size={24} color="#FF9500" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricValue}>$1,240</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/provider/services/create')}
          >
            <PlusCircle size={20} color="#007AFF" />
            <Text style={styles.actionText}>Add Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/provider/bookings')}
          >
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.actionText}>View Bookings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/provider/profile')}
          >
            <Users size={20} color="#007AFF" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity
              onPress={() => router.push('/provider/bookings')}
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <Text style={styles.loadingText}>Loading bookings...</Text>
          ) : recentBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyStateText}>
                When clients book your services, they'll appear here
              </Text>
            </View>
          ) : (
            recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/provider/bookings/${booking.id}`)}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>
                    {booking.service_title || booking.service?.title || 'Unknown Service'}
                  </Text>
                  <View style={styles.bookingStatus}>
                    {getStatusIcon(booking.status)}
                    <Text 
                      style={[
                        styles.bookingStatusText, 
                        { color: getStatusColor(booking.status) }
                      ]}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.bookingDetails}>
                  <Text style={styles.clientName}>
                    Client: {booking.user_full_name || booking.user?.full_name || 'Unknown User'}
                  </Text>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.scheduled_at).toLocaleDateString()} at {
                      new Date(booking.scheduled_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                  </Text>
                  <Text style={styles.bookingPrice}>
                    ${booking.total_price}
                  </Text>
                </View>
                
                <View style={styles.bookingActions}>
                  <TouchableOpacity 
                    style={styles.bookingActionButton}
                    onPress={() => router.push(`/provider/bookings/${booking.id}`)}
                  >
                    <Text style={styles.bookingActionText}>View Details</Text>
                    <ChevronRight size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Services</Text>
            <TouchableOpacity
              onPress={() => router.push('/provider/services')}
            >
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.addServiceButton}
            onPress={() => router.push('/provider/services/create')}
          >
            <PlusCircle size={20} color="#007AFF" />
            <Text style={styles.addServiceText}>Add New Service</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Summary */}
        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => router.push('/provider/analytics')}
        >
          <View style={styles.analyticsContent}>
            <View style={styles.analyticsIcon}>
              <TrendingUp size={24} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.analyticsTitle}>View Analytics</Text>
              <Text style={styles.analyticsDescription}>
                See detailed insights about your services and revenue
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#666" />
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
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '47%', // Adjust to fit 2 cards per row with gap
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    width: '30%',
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    padding: 24,
    paddingTop: 0,
    marginBottom: 16,
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
  seeAllLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
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
  bookingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bookingActions: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 12,
    alignItems: 'center',
  },
  bookingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bookingActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    gap: 8,
  },
  addServiceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 24,
    marginTop: 0,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  analyticsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  analyticsDescription: {
    fontSize: 14,
    color: '#666',
  },
  setupContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  setupDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});