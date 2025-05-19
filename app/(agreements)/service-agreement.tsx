import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { createSimplePdf } from '@/lib/pdfUtils';
import AppHeader from '../../components/AppHeader';

interface ServiceDetails {
  name: string;
  provider: string;
  date: string;
  time: string;
  duration: string;
  price: string;
}

export default function ServiceAgreementScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated');
        
        // Fetch service details
        const { data: service, error: serviceError } = await supabase
          .from('service_listings')
          .select('*, provider:provider_id(*)')
          .eq('id', serviceId)
          .single();
          
        if (serviceError) throw serviceError;
        if (!service) throw new Error('Service not found');
        
        setServiceDetails({
          name: service.title || 'Service',
          provider: service.provider?.business_name || 'Provider',
          date: service.date || new Date().toISOString().split('T')[0],
          time: service.time || '12:00 PM',
          duration: service.duration || '1 hour',
          price: service.price ? `$${service.price}` : 'Price not specified'
        });
        
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [serviceId]);

  const handleSignAgreement = async () => {
    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');
      
      if (!serviceDetails) throw new Error('Service details not available');
      
      // Create PDF content
      const pdfContent = `SERVICE AGREEMENT\n\n` +
        `Service: ${serviceDetails.name}\n` +
        `Provider: ${serviceDetails.provider}\n` +
        `Date: ${serviceDetails.date} at ${serviceDetails.time}\n` +
        `Duration: ${serviceDetails.duration}\n` +
        `Price: ${serviceDetails.price}\n\n` +
        `By signing this agreement, you agree to the terms and conditions.`;
      
      // Generate PDF
      const pdfBytes = await createSimplePdf('Service Agreement', pdfContent);
      
      // Upload to storage
      const fileName = `agreements/${user.id}/${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('participant-agreements')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('participant-agreements')
        .getPublicUrl(fileName);
      
      // Save agreement record
      const { error: dbError } = await supabase
        .from('participant_signed_agreements')
        .insert({
          participant_user_id: user.id,
          service_listing_id: serviceId,
          agreement_pdf_url: publicUrl,
          signed_at: new Date().toISOString()
        });
        
      if (dbError) throw dbError;
      
      // Show success message
      Alert.alert(
        'Agreement Signed',
        'Your service agreement has been signed successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (err) {
      console.error('Error signing agreement:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Service Agreement" showBackButton onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading agreement details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Service Agreement" showBackButton onBackPress={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Service Agreement" showBackButton onBackPress={() => router.back()} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Service Agreement</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service:</Text>
              <Text style={styles.detailValue}>{serviceDetails?.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{serviceDetails?.provider}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time:</Text>
              <Text style={styles.detailValue}>{serviceDetails?.date} at {serviceDetails?.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{serviceDetails?.duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>{serviceDetails?.price}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <ScrollView style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing this agreement, you agree to the following terms and conditions:
                
                1. The service provider will deliver the services as described.
                
                2. You agree to pay the specified amount for the services rendered.
                
                3. Cancellations require at least 24 hours notice.
                
                4. The service provider will maintain confidentiality of your information.
                
                5. Any complaints should be directed to the service provider first.
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.checkboxLabel}>
                I have read and agree to the terms and conditions
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.button, (!agreed || loading) && styles.buttonDisabled]}
            onPress={handleSignAgreement}
            disabled={!agreed || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign Agreement</Text>
            )}
          </TouchableOpacity>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
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
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontWeight: '600',
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  termsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
