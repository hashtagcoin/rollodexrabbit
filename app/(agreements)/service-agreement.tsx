import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Eye, SquareCheck as CheckSquare, CircleAlert as AlertCircle } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ServiceAgreementScreen() {
  const { serviceId, bookingId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // This would typically be fetched from the API based on serviceId
  const serviceDetails = {
    name: 'Physiotherapy Session',
    provider: 'HealthBridge Therapy',
    date: 'May 15, 2025',
    time: '10:00 AM',
    duration: '60 minutes',
    price: '$120.00',
  };

  const handleSign = async () => {
    try {
      if (!signatureData) {
        setError('Please provide your signature');
        return;
      }

      if (!agreed) {
        setError('Please read and agree to the terms of service');
        return;
      }

      setLoading(true);
      setError(null);

      // In a real app, you would:
      // 1. Save the signature to the database
      // 2. Update the booking status
      // 3. Create a PDF of the agreement
      // 4. Send confirmation emails

      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));

      // Navigate back to booking confirmation or dashboard
      router.back();
    } catch (e: unknown) {
      const errorMessage = typeof e === 'object' && e && 'message' in e ? String(e.message) : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Service Agreement" showBackButton onBackPress={() => router.back()} />

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{serviceDetails.name}</Text>
        <Text style={styles.serviceProvider}>with {serviceDetails.provider}</Text>
        <Text style={styles.serviceDate}>
          {serviceDetails.date} at {serviceDetails.time} ({serviceDetails.duration})
        </Text>
        <Text style={styles.servicePrice}>{serviceDetails.price}</Text>
      </View>

      <ScrollView style={styles.agreementContainer}>
        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionTitle}>1. NDIS Service Agreement</Text>
          <Text style={styles.agreementText}>
            This Service Agreement is made between you as a participant in the National Disability Insurance Scheme (NDIS) and the service provider identified above.
          </Text>
          <Text style={styles.agreementText}>
            This Agreement starts on {serviceDetails.date} and is ongoing until either party provides notice of termination.
          </Text>
        </View>

        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionTitle}>2. Responsibilities of Provider</Text>
          <Text style={styles.agreementText}>
            The Provider agrees to:
          </Text>
          <Text style={styles.agreementListItem}>• Provide the services as described in this agreement</Text>
          <Text style={styles.agreementListItem}>• Communicate openly and honestly</Text>
          <Text style={styles.agreementListItem}>• Treat you with courtesy and respect</Text>
          <Text style={styles.agreementListItem}>• Listen to your feedback and resolve problems quickly</Text>
          <Text style={styles.agreementListItem}>• Give you proper notice if the Provider needs to end the Agreement</Text>
          <Text style={styles.agreementListItem}>• Protect your privacy and confidential information</Text>
          <Text style={styles.agreementListItem}>• Provide supports in a manner consistent with all relevant laws</Text>
        </View>

        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionTitle}>3. Responsibilities of Participant</Text>
          <Text style={styles.agreementText}>
            The Participant agrees to:
          </Text>
          <Text style={styles.agreementListItem}>• Inform the Provider about how they wish the supports to be delivered</Text>
          <Text style={styles.agreementListItem}>• Work with the Provider to ensure the supports are provided appropriately</Text>
          <Text style={styles.agreementListItem}>• Talk to the Provider if they have any concerns</Text>
          <Text style={styles.agreementListItem}>• Give the Provider reasonable notice if they cannot make a scheduled appointment</Text>
          <Text style={styles.agreementListItem}>• Give the Provider proper notice if the Participant needs to end the Agreement</Text>
        </View>

        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionTitle}>4. Payments</Text>
          <Text style={styles.agreementText}>
            The Provider will seek payment for their provision of supports after the supports have been delivered.
          </Text>
          <Text style={styles.agreementText}>
            Payment will be processed as per your NDIS plan. Any gap payments will be charged to your selected payment method.
          </Text>
        </View>

        <View style={styles.agreementSection}>
          <Text style={styles.agreementSectionTitle}>5. Changes to this Agreement</Text>
          <Text style={styles.agreementText}>
            If changes to the supports or their delivery are required, the Parties agree to discuss and review this Service Agreement.
          </Text>
          <Text style={styles.agreementText}>
            The Parties agree that any changes to this Service Agreement will be in writing, signed, and dated by the Parties.
          </Text>
        </View>
      </ScrollView>

      {error && (
        <View style={styles.error}>
          <AlertCircle size={20} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.signatureSection}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreed(!agreed)}
          >
            {agreed ? (
              <CheckSquare size={24} color="#007AFF" />
            ) : (
              <View style={styles.emptyCheckbox} />
            )}
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            I have read and agree to the terms of service
          </Text>
        </View>

        <View style={styles.signatureCanvasContainer}>
          <Signature
            onOK={(sig) => setSignatureData(sig)}
            onEmpty={() => setError('Signature is required')}
            descriptionText="Sign"
            clearText="Clear"
            confirmText="Save"
            webStyle={`.m-signature-pad--footer {display: none; margin: 0;} .m-signature-pad {box-shadow: none; border: 1px solid #e1e1e1;}`}
          />
        </View>

        <TouchableOpacity
          style={[styles.signButton, (!signatureData || loading) && styles.signButtonDisabled]}
          onPress={handleSign}
          disabled={!signatureData || loading}
        >
          <Text style={styles.signButtonText}>
            {loading ? 'Processing...' : 'Sign & Accept'}
          </Text>
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
  serviceInfo: {
    padding: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  serviceDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  agreementContainer: {
    flex: 1,
    padding: 24,
  },
  agreementSection: {
    marginBottom: 16,
  },
  agreementSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  agreementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  agreementListItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
    lineHeight: 20,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    margin: 24,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ff3b30',
    flex: 1,
    fontSize: 14,
  },
  signatureSection: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderRadius: 4,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  signatureCanvasContainer: {
    height: 200,
    marginBottom: 16,
  },
  signButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signButtonDisabled: {
    opacity: 0.7,
  },
  signButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});