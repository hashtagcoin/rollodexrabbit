import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Signature, { SignatureViewRef } from 'react-native-signature-canvas';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Eye, SquareCheck as CheckSquare, CircleAlert as AlertCircle, X } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ServiceAgreementScreen() {
  const { serviceId, bookingId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);

  // This would typically be fetched from the API based on serviceId
  const serviceDetails = {
    name: 'Physiotherapy Session',
    provider: 'HealthBridge Therapy',
    date: 'May 15, 2025',
    time: '10:00 AM',
    duration: '60 minutes',
    price: '$120.00',
  };

  const handleSign = () => {
    if (!showCanvas) {
      setShowCanvas(true);
      return;
    }
    if (!hasDrawn) {
      setError('Please provide your signature');
      return;
    }
    if (!agreed) {
      setError('Please read and agree to the terms of service');
      return;
    }
    router.back();
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

      <ScrollView style={styles.agreementScroll}>
        <Text style={styles.agreementTitle}>Agreement Terms</Text>
        <Text style={styles.agreementText}>
          Please review and sign this agreement to confirm your understanding and acceptance of the terms of service for your upcoming appointment.
        </Text>
        {/* ...additional agreement text... */}
      </ScrollView>

      <TouchableOpacity
        style={[styles.checkboxContainer, agreed ? styles.checkboxChecked : null]}
        onPress={() => setAgreed(!agreed)}
      >
        <CheckSquare color={agreed ? '#4CAF50' : '#ccc'} size={24} />
        <Text style={styles.checkboxLabel}>I have read and agree to the terms of service</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signButton} onPress={handleSign}>
        <Text style={styles.signButtonText}>Sign Agreement</Text>
      </TouchableOpacity>

      {showCanvas && (
        <Signature
          ref={signatureRef}
          onOK={sig => {
            setSignatureData(sig);
            setHasDrawn(true);
            setError(null);
          }}

          onClear={() => {
            setHasDrawn(false);
            setSignatureData(null);
          }}
          descriptionText="Sign above"
          clearText="Clear"
          confirmText="Save"
          webStyle={''}
          autoClear={false}
          style={styles.signatureCanvas}
        />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#f44336" size={20} />
          <Text style={styles.errorText}>{error}</Text>
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
  serviceInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  serviceProvider: {
    color: '#666',
    marginTop: 4,
  },
  serviceDate: {
    marginTop: 4,
    color: '#333',
  },
  servicePrice: {
    marginTop: 4,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  agreementScroll: {
    flex: 1,
    margin: 16,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  agreementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  agreementText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  checkboxChecked: {
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  signButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signatureCanvas: {
    height: 200,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 8,
    backgroundColor: '#fdecea',
    borderRadius: 8,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
  },
});
