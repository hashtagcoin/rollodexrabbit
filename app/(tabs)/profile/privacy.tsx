import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Lock, Shield, Eye, Database, Download, Trash2, Info as InfoIcon } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Privacy Settings" />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <InfoIcon size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            We care about your privacy. Control how your information is used and shared.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Account Privacy</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Private Profile</Text>
              <Text style={styles.settingDescription}>
                Only approved connections can see your full profile
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Show NDIS Status</Text>
              <Text style={styles.settingDescription}>
                Display your NDIS verification status to others
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Data & Permissions</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Services</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your location
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Camera Access</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your camera
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Photo Library</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your photos
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Visibility Control</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Service History</Text>
              <Text style={styles.settingDescription}>
                Allow providers to see your service history
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Community Posts</Text>
              <Text style={styles.settingDescription}>
                Make your posts visible to everyone
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Your Data</Text>
          </View>
          
          <TouchableOpacity style={styles.dataButton}>
            <Download size={20} color="#007AFF" />
            <Text style={styles.dataButtonText}>Download Your Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton}>
            <Trash2 size={20} color="#ff3b30" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalSection}>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
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
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
  dataButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: '#fff2f2',
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '500',
  },
  legalSection: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});