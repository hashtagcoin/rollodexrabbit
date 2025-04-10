import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  Eye,
  Calendar,
  Share2,
  Database,
  MessageSquare,
  CircleAlert as AlertCircle,
  Lock,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function ConsentManagementScreen() {
  const { returnTo } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Consent state - in a real app, this would be loaded from the user's profile
  const [dataSharing, setDataSharing] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(true);
  const [serviceHistory, setServiceHistory] = useState(true);
  const [thirdPartySharing, setThirdPartySharing] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, this would save to your database
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));

      // Navigate back or to specified route
      if (returnTo) {
        router.push(returnTo as string);
      } else {
        router.back();
      }
    } catch (e) {
      setError('Failed to save consent preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Consent Management" />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Shield size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Privacy Matters</Text>
            <Text style={styles.infoDescription}>
              Control how your personal information is used across the platform. 
              You can update these settings at any time.
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing & Privacy</Text>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <Database size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Data Collection</Text>
                <Text style={styles.consentDescription}>
                  Allow collection of app usage data to improve services
                </Text>
              </View>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <Eye size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Service History Visibility</Text>
                <Text style={styles.consentDescription}>
                  Allow providers to see your past service history
                </Text>
              </View>
            </View>
            <Switch
              value={serviceHistory}
              onValueChange={setServiceHistory}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <Share2 size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Third-party Sharing</Text>
                <Text style={styles.consentDescription}>
                  Allow sharing data with trusted third parties
                </Text>
              </View>
            </View>
            <Switch
              value={thirdPartySharing}
              onValueChange={setThirdPartySharing}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Communications</Text>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <Lock size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Location Tracking</Text>
                <Text style={styles.consentDescription}>
                  Allow the app to track your location while using it
                </Text>
              </View>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <MessageSquare size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Marketing Communications</Text>
                <Text style={styles.consentDescription}>
                  Receive notifications about offers and updates
                </Text>
              </View>
            </View>
            <Switch
              value={marketingConsent}
              onValueChange={setMarketingConsent}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color="#007AFF" />
              </View>
              <View style={styles.consentInfo}>
                <Text style={styles.consentTitle}>Research Participation</Text>
                <Text style={styles.consentDescription}>
                  Participate in research to improve NDIS services
                </Text>
              </View>
            </View>
            <Switch
              value={researchConsent}
              onValueChange={setResearchConsent}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.privacyLinks}>
          <TouchableOpacity>
            <Text style={styles.privacyLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.privacyLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Preferences'}
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
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e1f0ff',
    padding: 16,
    margin: 24,
    borderRadius: 12,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3b30',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  consentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  consentInfo: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
  },
  privacyLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  privacyLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});