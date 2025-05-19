import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Calendar, Clock, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';

interface ServiceDetails {
  id: string;
  name: string;
  price: number;
  ndisPrice: number;
  gapPayment: number;
  availableDates: string[];
  availableTimes: string[];
  provider_id: string; // Assuming services table has provider_id
  provider_name: string;
  // Add other relevant service fields, e.g., category
  service_category: string; 
}

interface ActiveAgreement {
  id: string;
  agreement_content: string;
  agreement_title: string;
}

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [loading, setLoading] = useState(true); // Start with loading true
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [activeAgreement, setActiveAgreement] = useState<ActiveAgreement | null>(null);
  const [isAgreementSigned, setIsAgreementSigned] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [userAgreedToTerms, setUserAgreedToTerms] = useState(false); // Renamed for clarity
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!serviceId || typeof serviceId !== 'string') {
        throw new Error('Invalid service ID provided.');
      }

      try {
        setLoading(true);
        setError(null);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated.');
        }

        // 1. Fetch Service Details (including provider_id)
        //    This query assumes 'services' has 'provider_id' and 'category' (formerly 'service_category_temp')
        //    And 'service_providers' table is linked, aliasing 'business_name' as 'title'.
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('id, title, price, provider_id, category, service_providers(title:business_name)') 
          .eq('id', serviceId)
          .single();

        if (serviceError) throw new Error(`Failed to fetch service details: ${serviceError.message}`);
        if (!serviceData) throw new Error('Service not found.');

        const providerTitle = serviceData.service_providers
          ? (Array.isArray(serviceData.service_providers) ? serviceData.service_providers[0]?.title : (serviceData.service_providers as any)?.title)
          : 'Provider Name Missing';

        const fetchedServiceDetails: ServiceDetails = {
          id: serviceData.id,
          name: serviceData.title || 'Service Name Missing',
          price: serviceData.price || 0,
          // Placeholder: NDIS price might be the same as general price or require specific NDIS item code lookup.
          ndisPrice: serviceData.price || 0, 
          // Placeholder: Actual gap payment calculation needs business logic (e.g., based on 'gap_payment_applicable' field).
          gapPayment: 0, 
          // Placeholder: Actual availability is in 'availability_details' (JSONB) and needs parsing.
          availableDates: [], 
          availableTimes: [], 
          provider_id: serviceData.provider_id,
          provider_name: providerTitle, // Sourced from service_providers.title (which is business_name aliased)
          service_category: serviceData.category || 'core_support', // Sourced from services.category
        };
        setServiceDetails(fetchedServiceDetails);

        // 2. Fetch Active Service Agreement for this service and provider
        const { data: agreementData, error: agreementError } = await supabase
          .from('service_agreements')
          .select('id, agreement_content, agreement_title')
          .eq('service_id', fetchedServiceDetails.id)
          .eq('service_provider_id', fetchedServiceDetails.provider_id)
          .eq('status', 'active')
          .order('agreement_version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (agreementError) {
          console.warn('Failed to fetch service agreement:', agreementError.message); 
          // Not throwing error, booking might proceed without agreement if none exists or fetch fails
        }

        if (agreementData) {
          setActiveAgreement(agreementData);
          // 3. Check if this agreement is already signed by the user
          const { data: signedData, error: signedError } = await supabase
            .from('participant_signed_agreements')
            .select('id')
            .eq('agreement_version_id', agreementData.id)
            .eq('participant_user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (signedError) {
            console.warn('Failed to check signed agreement status:', signedError.message);
          }
          setIsAgreementSigned(!!signedData);
        } else {
          setActiveAgreement(null);
          setIsAgreementSigned(false); // No active agreement means nothing to be signed
        }

      } catch (err: any) {
        console.error('Error fetching booking data:', err);
        setError(err.message || 'Failed to load booking information.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceId]);

  const handleBooking = async () => {
    if (!serviceDetails) {
      setError('Service details not loaded.');
      return;
    }
    try {
      if (!selectedDate || !selectedTime) {
        setError('Please select both date and time');
        return;
      }

      // Check for agreement consent if an agreement exists and is not yet signed
      if (activeAgreement && !isAgreementSigned && !userAgreedToTerms) {
        setError('Please agree to the Service Agreement to proceed.');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Sign agreement if needed
      if (activeAgreement && !isAgreementSigned && userAgreedToTerms) {
        const { error: signError } = await supabase
          .from('participant_signed_agreements')
          .insert({
            agreement_version_id: activeAgreement.id,
            participant_user_id: user.id,
            signed_at: new Date().toISOString(),
            // ip_address and user_agent could be added if collected
          });
        if (signError) {
          throw new Error(`Failed to record agreement signature: ${signError.message}`);
        }
        setIsAgreementSigned(true); // Update state to reflect signing
      }

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

      const serviceCategory = serviceDetails.service_category; // Use fetched category
      
      const categoryBalance = walletData.category_breakdown[serviceCategory] || 0;
      if (categoryBalance < serviceDetails.ndisPrice) {
        throw new Error(`Insufficient funds in your ${serviceCategory.replace('_', ' ')} budget. Available: $${categoryBalance}`);
      }

      console.log('Creating booking with parameters:', {
        p_user_id: user.id,
        p_service_id: serviceId as string,
        p_scheduled_at: `${selectedDate}T${selectedTime}`,
        p_total_price: serviceDetails.price,
        p_ndis_covered_amount: serviceDetails.ndisPrice,
        p_gap_payment: serviceDetails.gapPayment,
        p_notes: notes,
        p_category: serviceCategory // ensure this is the correct category field for the DB
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
            p_total_price: serviceDetails.price,
            p_ndis_covered_amount: serviceDetails.ndisPrice,
            p_gap_payment: serviceDetails.gapPayment,
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
            total_price: serviceDetails.price,
            ndis_covered_amount: serviceDetails.ndisPrice,
            gap_payment: serviceDetails.gapPayment,
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
        const newCategoryBalance = categoryBalance - serviceDetails.ndisPrice;
        const updatedCategoryBreakdown = {
          ...walletData.category_breakdown,
          [serviceCategory]: newCategoryBalance
        };

        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            total_balance: walletData.total_balance - serviceDetails.ndisPrice,
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
            amount: serviceDetails.ndisPrice,
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
        {loading && !serviceDetails && (
          <View style={styles.centeredMessage}><Text>Loading service details...</Text></View>
        )}
        {!loading && !serviceDetails && error && (
          <View style={styles.centeredMessage}><Text style={styles.errorText}>{error}</Text></View>
        )}
        {serviceDetails && (
          <>
            <Text style={styles.title}>Book Appointment</Text>
            <Text style={styles.subtitle}>{serviceDetails.name}</Text>

            {error && (
              <View style={styles.error}>
                <AlertCircle size={20} color="#ff3b30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Service Agreement Section */}
            {activeAgreement && !isAgreementSigned && (
              <View style={styles.agreementSection}>
                <Text style={styles.sectionTitle}>{activeAgreement.agreement_title || 'Service Agreement'}</Text>
                <ScrollView style={styles.agreementContentScroll}>
                  <Text style={styles.agreementText}>{activeAgreement.agreement_content}</Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.agreementCheckboxContainer}
                  onPress={() => setUserAgreedToTerms(!userAgreedToTerms)}
                >
                  <View style={[styles.checkbox, userAgreedToTerms && styles.checkboxChecked]} />
                  <Text style={styles.agreementCheckboxLabel}>I have read and agree to the Service Agreement.</Text>
                </TouchableOpacity>
              </View>
            )}
            {activeAgreement && isAgreementSigned && (
              <View style={styles.signedMessageContainer}>
                <Text style={styles.signedMessageText}>Service Agreement already signed.</Text>
              </View>
            )}
            {!activeAgreement && !loading && (
                 <View style={styles.signedMessageContainer}>
                    <Text style={styles.signedMessageText}>No service agreement required for this service.</Text>
                 </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
              >
                {serviceDetails.availableDates.map((date) => (
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
                {serviceDetails.availableTimes.map((time) => (
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
                  <Text style={styles.paymentAmount}>${serviceDetails.price}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>NDIS Covered</Text>
                  <Text style={styles.paymentAmount}>-${serviceDetails.ndisPrice}</Text>
                </View>
                <View style={styles.paymentDivider} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentTotal}>Gap Payment</Text>
                  <Text style={styles.paymentTotal}>${serviceDetails.gapPayment}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.bookButton, (!userAgreedToTerms || loading) && styles.bookButtonDisabled]}
              onPress={handleBooking}
              disabled={!userAgreedToTerms || loading}
            >
              <Text style={styles.bookButtonText}>
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </>
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
  content: {
    flex: 1,
    padding: 24,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  agreementSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  agreementContentScroll: {
    maxHeight: 150, // Limit height and make scrollable
    marginBottom: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  agreementText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  agreementCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  agreementCheckboxLabel: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1, // Allow text to wrap
  },
  signedMessageContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#e6f7ff', // Light blue background
    borderRadius: 8,
    marginVertical: 15,
    alignItems: 'center',
  },
  signedMessageText: {
    fontSize: 14,
    color: '#005f80', // Darker blue text
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30, // Space for bottom safe area
  },
  bookButtonDisabled: {
    backgroundColor: '#a0cfff', // Lighter blue for disabled state
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});