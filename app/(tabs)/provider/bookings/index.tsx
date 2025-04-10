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
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Calendar, ClipboardList, Filter, ChevronRight, CircleCheck as CheckCircle2, Circle as XCircle, Clock } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';

type Booking = {
  id: string;
  scheduled_at: string;
  total_price: number;
  status: string;
  service_title?: string;
  user_full_name?: string;
  service?: {
    id: string;
    title: string;
  };
  user?: {
    full_name: string;
  };
};

export default function BookingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First try to use the bookings_with_details view
      try {
        let query = supabase
          .from('bookings_with_details')
          .select('*')
          .eq('provider_id', user.id);

        if (filter) {
          query = query.eq('status', filter);
        }

        const { data, error } = await query.order('scheduled_at', { ascending: false });
        
        if (!error) {
          setBookings(data || []);
          setLoading(false);
          return;
        }
      } catch (viewError) {
        console.log("View doesn't exist yet, using fallback query", viewError);
      }

      // Fallback if view doesn't exist: do join manually
      let query = supabase
        .from('service_bookings')
        .select(`
          id,
          scheduled_at,
          total_price,
          status,
          user_id,
          service:services!inner(
            id,
            title,
            provider_id
          )
        `)
        .eq('service.provider_id', user.id);

      if (filter) {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('scheduled_at', { ascending: false });
      if (error) throw error;

      // Get user details separately for each booking
      const bookingsWithUserNames = await Promise.all((data || []).map(async (booking) => {
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
          console.error('Error fetching user details:', e);
          return {
            ...booking,
            user_full_name: 'Unknown User'
          };
        }
      }));

      setBookings(bookingsWithUserNames || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // Helper to get status icon
  const getStatusIcon = (status: string, size = 16) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 size={size} color="#4CD964" />;
      case 'pending':
        return <Clock size={size} color="#FF9500" />;
      case 'completed':
        return <CheckCircle2 size={size} color="#007AFF" />;
      case 'cancelled':
        return <XCircle size={size} color="#FF3B30" />;
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Service Bookings" showBackButton={true} />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === null && styles.filterChipSelected,
            ]}
            onPress={() => setFilter(null)}
          >
            <ClipboardList size={16} color={filter === null ? '#fff' : '#666'} />
            <Text
              style={[
                styles.filterChipText,
                filter === null && styles.filterChipTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'pending' && styles.filterChipSelected,
            ]}
            onPress={() => setFilter('pending')}
          >
            <Clock size={16} color={filter === 'pending' ? '#fff' : '#FF9500'} />
            <Text
              style={[
                styles.filterChipText,
                filter === 'pending' && styles.filterChipTextSelected,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'confirmed' && styles.filterChipSelected,
            ]}
            onPress={() => setFilter('confirmed')}
          >
            <CheckCircle2 size={16} color={filter === 'confirmed' ? '#fff' : '#4CD964'} />
            <Text
              style={[
                styles.filterChipText,
                filter === 'confirmed' && styles.filterChipTextSelected,
              ]}
            >
              Confirmed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'completed' && styles.filterChipSelected,
            ]}
            onPress={() => setFilter('completed')}
          >
            <CheckCircle2 size={16} color={filter === 'completed' ? '#fff' : '#007AFF'} />
            <Text
              style={[
                styles.filterChipText,
                filter === 'completed' && styles.filterChipTextSelected,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'cancelled' && styles.filterChipSelected,
            ]}
            onPress={() => setFilter('cancelled')}
          >
            <XCircle size={16} color={filter === 'cancelled' ? '#fff' : '#FF3B30'} />
            <Text
              style={[
                styles.filterChipText,
                filter === 'cancelled' && styles.filterChipTextSelected,
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading bookings...</Text>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#e1e1e1" />
            <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
            <Text style={styles.emptyStateText}>
              {filter
                ? `You don't have any ${filter} bookings`
                : `You don't have any bookings yet`}
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => {
              const { date, time } = formatDate(booking.scheduled_at);
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/provider/bookings/${booking.id}`)}
                >
                  <View style={styles.bookingHeader}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{booking.service_title || booking.service?.title}</Text>
                      <View style={styles.statusContainer}>
                        {getStatusIcon(booking.status)}
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(booking.status) },
                          ]}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bookingTime}>
                      <Calendar size={16} color="#666" />
                      <Text style={styles.dateText}>{date}</Text>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingDetails}>
                    <View style={styles.clientSection}>
                      <Text style={styles.detailLabel}>Client</Text>
                      <Text style={styles.clientName}>
                        {booking.user_full_name || booking.user?.full_name || 'Unknown User'}
                      </Text>
                    </View>
                    <View style={styles.amountSection}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.amount}>${booking.total_price}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingFooter}>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => router.push(`/provider/bookings/${booking.id}`)}
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <ChevronRight size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterScrollView: {
    paddingVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
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
    padding: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bookingsList: {
    padding: 24,
  },
  bookingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bookingTime: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  bookingDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 16,
    marginBottom: 16,
  },
  clientSection: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bookingFooter: {
    alignItems: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});