import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Mail, NotebookText, DollarSign, ClipboardCheck, ClipboardX, CircleAlert as AlertCircle, Circle as XCircle, CircleCheck as CheckCircle2 } from 'lucide-react-native';

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  async function loadBookingDetails() {
    try {
      setLoading(true);
      
      // First try to use the bookings_with_details view
      try {
        const { data, error } = await supabase
          .from('bookings_with_details')
          .select('*')
          .eq('id', id)
          .single();

        if (!error) {
          setBooking(data);
          setLoading(false);
          return;
        }
      } catch (viewError) {
        console.log("View doesn't exist yet, using fallback query", viewError);
      }
      
      // Fallback method - get booking and related data separately
      const { data: bookingData, error: bookingError } = await supabase
        .from('service_bookings')
        .select(`
          id,
          scheduled_at,
          total_price,
          ndis_covered_amount,
          gap_payment,
          notes,
          status,
          created_at,
          user_id,
          service_id
        `)
        .eq('id', id)
        .single();

      if (bookingError) throw bookingError;
      
      // Get service details
      const { data: serviceData } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          format,
          provider_id
        `)
        .eq('id', bookingData.service_id)
        .single();
      
      // Get user details
      const { data: userData } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          username,
          ndis_number,
          ndis_verified
        `)
        .eq('id', bookingData.user_id)
        .single();
      
      setBooking({
        ...bookingData,
        service: serviceData || null,
        user: userData || null
      });
    } catch (error) {
      console.error('Error loading booking details:', error);
      setError('Could not load booking details');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      await loadBookingDetails();
      
      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id || booking.user?.id,
          type: 'booking',
          content: `Your booking for ${booking.service?.title || booking.service_title} has been ${newStatus}.`,
          seen: false,
        });
        
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Could not update booking status');
    } finally {
      setUpdating(false);
    }
  };

  const confirmStatusUpdate = (status: string) => {
    const action = status === 'confirmed' ? 'confirm' : 'cancel';
    const message = status === 'confirmed' 
      ? 'Are you sure you want to confirm this booking?'
      : 'Are you sure you want to cancel this booking?';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Booking`,
      message,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => handleStatusUpdate(status),
        },
      ]
    );
  };

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <XCircle size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorText}>
            The booking you're looking for doesn't exist or you don't have permission to view it.
          </Text>
          <TouchableOpacity
            style={styles.backToBookingsButton}
            onPress={() => router.replace('/provider/bookings')}
          >
            <Text style={styles.backToBookingsText}>Back to Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Extract user and service information based on whether we're using the view or direct query
  const userName = booking.user_full_name || booking.user?.full_name || 'Unknown User';
  const userNdisNumber = booking.ndis_number || booking.user?.ndis_number;
  const userNdisVerified = booking.ndis_verified || booking.user?.ndis_verified;
  const serviceTitle = booking.service_title || booking.service?.title || 'Unknown Service';
  const serviceFormat = booking.service_format || booking.service?.format || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#FF3B30" />
            <Text style={styles.errorCardText}>{error}</Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
            {booking.status === 'confirmed' && <CheckCircle2 size={20} color={getStatusColor(booking.status)} />}
            {booking.status === 'pending' && <Clock size={20} color={getStatusColor(booking.status)} />}
            {booking.status === 'completed' && <CheckCircle2 size={20} color={getStatusColor(booking.status)} />}
            {booking.status === 'cancelled' && <XCircle size={20} color={getStatusColor(booking.status)} />}
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {/* Service Details */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceName}>{serviceTitle}</Text>
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetail}>
              <Calendar size={16} color="#666" />
              <Text style={styles.serviceDetailText}>{new Date(booking.scheduled_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.serviceDetail}>
              <Clock size={16} color="#666" />
              <Text style={styles.serviceDetailText}>{new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.serviceDetail}>
              <MapPin size={16} color="#666" />
              <Text style={styles.serviceDetailText}>
                {serviceFormat.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientDetail}>
              <User size={16} color="#666" />
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{userName}</Text>
            </View>
            <View style={styles.clientDetail}>
              <Mail size={16} color="#666" />
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>client@example.com</Text>
            </View>
            <View style={styles.clientDetail}>
              <Phone size={16} color="#666" />
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>(555) 123-4567</Text>
            </View>
            {userNdisNumber && (
              <View style={styles.clientDetail}>
                <ClipboardCheck size={16} color="#666" />
                <Text style={styles.detailLabel}>NDIS:</Text>
                <Text style={styles.detailValue}>
                  {userNdisNumber}
                  {userNdisVerified && (
                    <Text style={styles.verifiedBadge}> ✓ Verified</Text>
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Service Fee</Text>
              <Text style={styles.paymentAmount}>${booking.total_price}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>NDIS Covered</Text>
              <Text style={styles.paymentAmount}>-${booking.ndis_covered_amount}</Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotal}>Gap Payment</Text>
              <Text style={styles.paymentTotal}>${booking.gap_payment}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <NotebookText size={16} color="#666" />
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {booking.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => confirmStatusUpdate('confirmed')}
            disabled={updating}
          >
            <CheckCircle2 size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>
              {updating ? 'Processing...' : 'Confirm Booking'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => confirmStatusUpdate('cancelled')}
            disabled={updating}
          >
            <XCircle size={20} color="#FF3B30" />
            <Text style={styles.cancelButtonText}>
              {updating ? 'Processing...' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {booking.status === 'confirmed' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => confirmStatusUpdate('completed')}
            disabled={updating}
          >
            <ClipboardCheck size={20} color="#fff" />
            <Text style={styles.completeButtonText}>
              {updating ? 'Processing...' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => confirmStatusUpdate('cancelled')}
            disabled={updating}
          >
            <XCircle size={20} color="#FF3B30" />
            <Text style={styles.cancelButtonText}>
              {updating ? 'Processing...' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 24,
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
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToBookingsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  backToBookingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorCardText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceSection: {
    marginBottom: 24,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceDetailText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  clientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    marginRight: 4,
    width: 60,
  },
  detailValue: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  verifiedBadge: {
    color: '#4CD964',
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    marginVertical: 8,
  },
  paymentTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4CD964',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});