import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { CreditCard, Plus, Ban as Bank, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function PaymentMethodsScreen() {
  // Mock payment methods for demonstration
  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      name: 'Visa ending in 1234',
      expires: '06/27',
      isDefault: true,
      iconUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 2,
      type: 'card',
      name: 'Mastercard ending in 5678',
      expires: '09/26',
      isDefault: false,
      iconUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070&auto=format&fit=crop'
    }
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Payment Methods" />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Payment methods are used for gap payments when NDIS doesn't cover the full cost of services.
          </Text>
        </View>

        <View style={styles.paymentMethodsSection}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentMethodCard}
            >
              <View style={styles.cardIconContainer}>
                <CreditCard size={24} color="#007AFF" />
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.cardName}>{method.name}</Text>
                <Text style={styles.cardExpiry}>Expires {method.expires}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addPaymentButton}>
          <Plus size={24} color="#007AFF" />
          <Text style={styles.addPaymentText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
          <Text style={styles.sectionDescription}>
            Add a bank account to receive refunds and payments
          </Text>
          
          <TouchableOpacity style={styles.bankAccountButton}>
            <Bank size={24} color="#007AFF" />
            <Text style={styles.bankAccountText}>Add Bank Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          
          <TouchableOpacity style={styles.historyButton}>
            <Text style={styles.historyButtonText}>View Transaction History</Text>
            <ChevronRight size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Lock />
          <Text style={styles.securityText}>
            Your payment information is stored securely and encrypted.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Simple lock icon component
function Lock() {
  return (
    <View style={lockStyles.container}>
      <View style={lockStyles.body}>
        <View style={lockStyles.hole} />
      </View>
      <View style={lockStyles.shackle} />
    </View>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    width: 16,
    height: 20,
    alignItems: 'center',
  },
  body: {
    width: 14,
    height: 10,
    backgroundColor: '#999',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    width: 4,
    height: 4,
    backgroundColor: '#e1e1e1',
    borderRadius: 2,
  },
  shackle: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 5,
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e1f0ff',
    borderRadius: 12,
    padding: 16,
    margin: 24,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  paymentMethodsSection: {
    padding: 24,
    paddingTop: 0,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e1f0ff',
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  addPaymentText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  separator: {
    height: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bankAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  bankAccountText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 24,
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 14,
    color: '#999',
  },
});