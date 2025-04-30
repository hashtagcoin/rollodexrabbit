import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Calendar, MapPin, ChevronRight, Wallet, FileCheck, Clock } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import AppHeader from '../../../../components/AppHeader';

export default function BookingConfirmation() {
  const { bookingId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);
  
  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // If we have a bookingId parameter, use it to fetch the specific booking
      // Otherwise, get the most recent booking for this user
      let query = supabase
        .from('service_bookings')
        .select(`
          *,
          service:services(
            *,
            provider:service_providers(*)
          )
        `)
        .eq('user_id', user.id);
        
      if (bookingId) {
        query = query.eq('id', bookingId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }
      
      const { data: bookingData, error: bookingError } = await query.single();
        
      if (bookingError) throw bookingError;
      
      setBooking(bookingData);
      setService(bookingData.service);
    } catch (err: unknown) {
      console.error('Error loading booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AppHeader title="Booking Confirmation" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <ActivityIndicator size="large" color="#0055FF" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <AppHeader title="Booking Confirmation" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/discover')}
        >
          <Text style={styles.buttonText}>Return to Discover</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Format the date and time for display
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };
  
  const scheduledDateTime = booking ? formatDateTime(booking.scheduled_at) : { date: '', time: '' };

  return (
    <View style={styles.container}>
      <AppHeader title="Booking Confirmation" showBackButton={true} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Image
              source={
                service?.provider?.avatar_url
                  ? { uri: service.provider.avatar_url }
                  : require('../../../../assets/rollodex-icon-lrg.png')
              }
              style={[
                styles.providerImage,
                !service?.provider?.avatar_url && styles.fallbackImage
              ]}
              resizeMode="cover"
            />
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>

          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your appointment has been successfully scheduled
          </Text>

          <View style={styles.bookingCard}>
            <Text style={styles.cardTitle}>{service?.title || 'Service Appointment'}</Text>
            <Text style={styles.provider}>with {service?.provider?.business_name || 'Provider'}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Calendar size={20} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailText}>{scheduledDateTime.date} at {scheduledDateTime.time}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <MapPin size={20} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailText}>{service?.location || '123 Health Street, Melbourne'}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Clock size={20} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailText}>{service?.duration || '60'} minutes</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <FileCheck size={20} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Booking Status</Text>
                  <Text style={[styles.detailText, styles.statusText]}>{booking?.status || 'pending'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Amount</Text>
                <Text style={styles.priceAmount}>${booking?.total_price.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>NDIS Covered</Text>
                <Text style={styles.ndisAmount}>${booking?.ndis_covered_amount.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Gap Payment</Text>
                <Text style={styles.gapAmount}>${booking?.gap_payment.toFixed(2) || '0.00'}</Text>
              </View>
              
              <View style={styles.walletInfo}>
                <Wallet size={16} color="#0055FF" />
                <Text style={styles.walletText}>
                  This amount has been reserved from your {booking?.category?.replace('_', ' ') || 'NDIS'} budget
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/wallet')}
          >
            <Text style={styles.buttonText}>View in Wallet</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/discover')}
          >
            <Text style={styles.secondaryButtonText}>Back to Discover</Text>
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    position: 'relative',
  },
  providerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  fallbackImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginTop: 20,
  },
  checkmark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  bookingCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  provider: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  statusText: {
    textTransform: 'capitalize',
    color: '#4CAF50',
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  ndisAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  gapAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF5500',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  walletText: {
    fontSize: 14,
    color: '#0055FF',
    marginLeft: 8,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#0055FF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
});