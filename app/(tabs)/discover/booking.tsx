import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Calendar, Clock, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This would be fetched from API
  const service = {
    name: 'HealthBridge Therapy',
    price: 120,
    ndisPrice: 120,
    gapPayment: 0,
    availableDates: ['2025-04-10', '2025-04-11', '2025-04-12'],
    availableTimes: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'],
  };

  const handleBooking = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        setError('Please select both date and time');
        return;
      }

      if (!agreed) {
        setError('Please agree to the NDIS service agreement');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check wallet balance before booking
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('total_balance, category_breakdown')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Wallet error:', walletError);
        throw new Error(`Failed to get wallet: ${walletError.message}`);
      }

      // Determine which category this service falls under (this would come from the service data)
      const serviceCategory = 'core_support'; // Example - would be dynamically determined
      
      // Check if user has sufficient funds
      const categoryBalance = walletData.category_breakdown[serviceCategory] || 0;
      if (categoryBalance < service.ndisPrice) {
        throw new Error(`Insufficient funds in your ${serviceCategory.replace('_', ' ')} budget. Available: $${categoryBalance}`);
      }

      console.log('Creating booking with parameters:', {
        p_user_id: user.id,
        p_service_id: serviceId as string,
        p_scheduled_at: `${selectedDate}T${selectedTime}`,
        p_total_price: service.price,
        p_ndis_covered_amount: service.ndisPrice,
        p_gap_payment: service.gapPayment,
        p_notes: notes,
        p_category: serviceCategory
      });

      // Fallback to direct database operations if RPC fails
      try {
        // First try the stored procedure with the fixed function name
        const { data: bookingData, error: bookingError } = await supabase.rpc(
          'book_service_fixed',
          {
            p_user_id: user.id,
            p_service_id: serviceId as string,
            p_scheduled_at: `${selectedDate}T${selectedTime}`,
            p_total_price: service.price,
            p_ndis_covered_amount: service.ndisPrice,
            p_gap_payment: service.gapPayment,
            p_notes: notes,
            p_category: serviceCategory
          }
        );

        if (bookingError) {
          console.error('RPC error:', bookingError);
          throw bookingError;
        }

        router.push({
          pathname: '/discover/booking/confirmation',
          params: { bookingId: bookingData }
        } as any);
      } catch (e: unknown) {
        console.error('RPC approach failed, trying direct DB operations:', 
          e instanceof Error ? e.message : 'An unknown error occurred');
        
        // Create booking directly
        const { data: bookingData, error: bookingError } = await supabase
          .from('service_bookings')
          .insert({
            user_id: user.id,
            service_id: serviceId,
            scheduled_at: `${selectedDate}T${selectedTime}`,
            total_price: service.price,
            ndis_covered_amount: service.ndisPrice,
            gap_payment: service.gapPayment,
            notes,
            status: 'pending'
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Booking creation error:', bookingError);
          throw new Error(`Failed to create booking: ${bookingError.message}`);
        }

        // Update wallet balance
        const newCategoryBalance = categoryBalance - service.ndisPrice;
        const updatedCategoryBreakdown = {
          ...walletData.category_breakdown,
          [serviceCategory]: newCategoryBalance
        };

        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            total_balance: walletData.total_balance - service.ndisPrice,
            category_breakdown: updatedCategoryBreakdown
          })
          .eq('user_id', user.id);

        if (updateWalletError) {
          console.error('Wallet update error:', updateWalletError);
          throw new Error(`Failed to update wallet: ${updateWalletError.message}`);
        }

        // Create a claim record
        const { error: claimError } = await supabase
          .from('claims')
          .insert({
            user_id: user.id,
            booking_id: bookingData.id,
            amount: service.ndisPrice,
            status: 'pending',
            expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
          });

        if (claimError) {
          console.error('Claim creation error:', claimError);
          throw new Error(`Failed to create claim: ${claimError.message}`);
        }

        router.push({
          pathname: '/discover/booking/confirmation',
          params: { bookingId: bookingData.id }
        } as any);
      }
    } catch (err: unknown) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Book Appointment" showBackButton={true} onBackPress={() => router.back()} />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.subtitle}>{service.name}</Text>

        {error && (
          <View style={styles.error}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroll}
          >
            {service.availableDates.map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateOption,
                  selectedDate === date && styles.dateSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Calendar 
                  size={20} 
                  color={selectedDate === date ? '#fff' : '#666'} 
                />
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === date && styles.dateTextSelected,
                  ]}
                >
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.timeScroll}
          >
            {service.availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  selectedTime === time && styles.timeSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Clock 
                  size={20} 
                  color={selectedTime === time ? '#fff' : '#666'} 
                />
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requirements or notes for the provider..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Service Fee</Text>
              <Text style={styles.paymentAmount}>${service.price}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>NDIS Covered</Text>
              <Text style={styles.paymentAmount}>-${service.ndisPrice}</Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotal}>Gap Payment</Text>
              <Text style={styles.paymentTotal}>${service.gapPayment}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.agreementToggle}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
          <Text style={styles.agreementText}>
            I agree to the NDIS service agreement and confirm this service aligns with my NDIS goals
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: '#ff3b30',
    flex: 1,
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
  dateScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 8,
  },
  dateSelected: {
    backgroundColor: '#007AFF',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  dateTextSelected: {
    color: '#fff',
  },
  timeScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginRight: 8,
  },
  timeSelected: {
    backgroundColor: '#007AFF',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  timeTextSelected: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    height: 120,
    textAlignVertical: 'top',
  },
  paymentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  agreementToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e1e1e1',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});