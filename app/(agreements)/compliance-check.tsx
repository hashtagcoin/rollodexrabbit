import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CircleCheck as CheckCircle2, Circle as XCircle, Info, ShieldCheck, CircleAlert as AlertCircle, Info as InfoIcon, ChevronRight, FileCheck } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ComplianceCheckScreen() {
  const { serviceId, bookingId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Mock compliance items
  const complianceItems = [
    {
      id: 1,
      title: 'NDIS Plan Funding',
      description: 'Service falls within your current NDIS plan funding categories',
      status: 'passed',
      details: 'Capacity Building - Daily Activities',
    },
    {
      id: 2,
      title: 'Budget Availability',
      description: 'Sufficient funds in your NDIS budget for this service',
      status: 'passed',
      details: 'Current balance: $5,680.00',
    },
    {
      id: 3,
      title: 'Provider Registration',
      description: 'Provider is registered with the NDIS Commission',
      status: 'passed',
      details: 'Verified registration #ABC12345',
    },
    {
      id: 4,
      title: 'Service Alignment',
      description: 'Service aligns with your NDIS goals',
      status: 'warning',
      details: 'Partial alignment with your stated goals',
    },
    {
      id: 5,
      title: 'Price Limits',
      description: 'Service pricing falls within NDIS price limits',
      status: 'passed',
      details: 'Within 2023-2024 price guide',
    },
    {
      id: 6,
      title: 'Service Agreement',
      description: 'Valid service agreement in place',
      status: 'action',
      details: 'Service agreement required',
      action: 'Sign agreement',
      actionPath: '/service-agreement',
    }
  ];

  const handleProceed = () => {
    // Check if any required actions need to be completed
    const requiredActions = complianceItems.filter(item => item.status === 'action');
    
    if (requiredActions.length > 0) {
      // Navigate to the first required action
      const firstAction = requiredActions[0];
      router.push(firstAction.actionPath as string);
    } else {
      // Proceed to booking confirmation
      router.push('/discover/booking/confirmation');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="NDIS Compliance" />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <InfoIcon size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Pre-Booking Compliance Check</Text>
            <Text style={styles.infoDescription}>
              We check all bookings against NDIS rules to ensure they are compliant
              and eligible for funding under your plan.
            </Text>
          </View>
        </View>

        <View style={styles.complianceItems}>
          {complianceItems.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.complianceItem,
                item.status === 'action' && styles.complianceItemAction,
                item.status === 'warning' && styles.complianceItemWarning,
              ]}
            >
              <View style={styles.complianceHeader}>
                <View style={styles.complianceStatus}>
                  {item.status === 'passed' && <CheckCircle2 size={24} color="#4CD964" />}
                  {item.status === 'failed' && <XCircle size={24} color="#FF3B30" />}
                  {item.status === 'warning' && <AlertCircle size={24} color="#FF9500" />}
                  {item.status === 'action' && <Info size={24} color="#007AFF" />}
                </View>
                <View style={styles.complianceInfo}>
                  <Text style={styles.complianceTitle}>{item.title}</Text>
                  <Text style={styles.complianceDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.complianceDetails}>{item.details}</Text>
              
              {item.status === 'action' && item.action && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push(item.actionPath as string)}
                >
                  <Text style={styles.actionButtonText}>{item.action}</Text>
                  <ChevronRight size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ShieldCheck size={24} color="#4CD964" />
            <Text style={styles.summaryTitle}>Compliance Summary</Text>
          </View>
          <Text style={styles.summaryText}>
            Your booking is generally compliant with NDIS requirements.
            Please complete the required actions before proceeding.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton, loading && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={loading}
        >
          <FileCheck size={20} color="#fff" />
          <Text style={styles.proceedButtonText}>
            {loading ? 'Processing...' : 'Complete & Proceed'}
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
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e1f0ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  complianceItems: {
    gap: 12,
    marginBottom: 24,
  },
  complianceItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  complianceItemAction: {
    backgroundColor: '#e1f0ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  complianceItemWarning: {
    backgroundColor: '#fff9e6',
  },
  complianceHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  complianceStatus: {
    marginRight: 12,
  },
  complianceInfo: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  complianceDescription: {
    fontSize: 14,
    color: '#666',
  },
  complianceDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  proceedButtonDisabled: {
    opacity: 0.7,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});