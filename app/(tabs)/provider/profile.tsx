import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Camera,
  Upload,
  FileText,
  CircleAlert as AlertCircle,
  Building,
  Hash,
  MapPin,
  Phone,
  Mail,
  Tag,
} from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function ProviderProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [credentials, setCredentials] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [serviceFormats, setServiceFormats] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [displayInSearch, setDisplayInSearch] = useState(true);
  const [acceptNdis, setAcceptNdis] = useState(true);
  
  useEffect(() => {
    loadProviderProfile();
  }, []);

  async function loadProviderProfile() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        // If profile doesn't exist, we'll create a default one
        if (error.code === 'PGRST116') {
          // Get user profile info
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
            
          setBusinessName(userProfile?.full_name + "'s Services" || 'New Provider');
          setLogoUrl(userProfile?.avatar_url || null);
        } else {
          throw error;
        }
      } else {
        setBusinessName(data.business_name || '');
        setAbn(data.abn || '');
        setBusinessAddress(data.business_address || '');
        setBusinessPhone(data.business_phone || '');
        setBusinessEmail(data.business_email || '');
        setCredentials(data.credentials || []);
        setServiceCategories(data.service_categories || []);
        setServiceFormats(data.service_formats || []);
        setServiceArea(data.service_area || '10');
        setBusinessDescription(data.business_description || '');
        setLogoUrl(data.logo_url || null);
      }
    } catch (error) {
      console.error('Error loading provider profile:', error);
      setError('Could not load profile information');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      if (!businessName) {
        setError('Business name is required');
        return;
      }

      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const providerData = {
        id: user.id,
        business_name: businessName,
        abn: abn || null,
        business_address: businessAddress || null,
        business_phone: businessPhone || null,
        business_email: businessEmail || null,
        credentials: credentials.length > 0 ? credentials : null,
        service_categories: serviceCategories.length > 0 ? serviceCategories : null,
        service_formats: serviceFormats.length > 0 ? serviceFormats : null,
        service_area: serviceArea || '10',
        business_description: businessDescription || null,
        logo_url: logoUrl,
      };

      // Check if provider profile exists
      const { data, error: checkError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Create new profile
        const { error: createError } = await supabase
          .from('service_providers')
          .insert(providerData);
          
        if (createError) throw createError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('service_providers')
          .update(providerData)
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      }

      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  // For demo purposes, using a placeholder for image upload
  const handleUploadLogo = () => {
    setLogoUrl('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop');
  };

  const CATEGORIES = [
    'Therapy',
    'Personal Care',
    'Transport',
    'Social Activities',
    'Home Maintenance',
    'Daily Tasks',
    'Exercise Physiology',
    'Skills Development',
    'Accommodation',
    'Support Coordination',
  ];

  const FORMATS = [
    'In Person',
    'Online',
    'Home Visits',
    'Center Based',
    'Group Sessions',
  ];

  const toggleCategory = (category: string) => {
    setServiceCategories(current =>
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  const toggleFormat = (format: string) => {
    setServiceFormats(current =>
      current.includes(format)
        ? current.filter(f => f !== format)
        : [...current, format]
    );
  };

  const handleAddCredential = () => {
    const newCredential = `Credential ${credentials.length + 1}`;
    setCredentials([...credentials, newCredential]);
  };

  const handleRemoveCredential = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Provider Profile" showBackButton={true} />

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.logoSection}>
          {logoUrl ? (
            <RNImage source={{ uri: logoUrl }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Building size={40} color="#666" />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadLogo}
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Change Logo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter your business name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ABN (Australian Business Number)</Text>
            <View style={styles.abnContainer}>
              <Hash size={20} color="#666" style={styles.abnIcon} />
              <TextInput
                style={styles.input}
                value={abn}
                onChangeText={setAbn}
                placeholder="Enter your ABN"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Address</Text>
            <View style={styles.addressContainer}>
              <MapPin size={20} color="#666" style={styles.addressIcon} />
              <TextInput
                style={styles.input}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Enter your business address"
                multiline
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Phone</Text>
            <View style={styles.phoneContainer}>
              <Phone size={20} color="#666" style={styles.phoneIcon} />
              <TextInput
                style={styles.input}
                value={businessPhone}
                onChangeText={setBusinessPhone}
                placeholder="Enter your business phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Email</Text>
            <View style={styles.emailContainer}>
              <Mail size={20} color="#666" style={styles.emailIcon} />
              <TextInput
                style={styles.input}
                value={businessEmail}
                onChangeText={setBusinessEmail}
                placeholder="Enter your business email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Area (km)</Text>
            <View style={styles.serviceAreaContainer}>
              <View style={styles.radiusOptions}>
                {[5, 10, 15, 25, 50].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.radiusOption,
                      serviceArea === String(value) && styles.radiusSelected,
                    ]}
                    onPress={() => setServiceArea(String(value))}
                  >
                    <Text
                      style={[
                        styles.radiusText,
                        serviceArea === String(value) && styles.radiusTextSelected,
                      ]}
                    >
                      {value} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Service Categories</Text>
            <Text style={styles.sectionSubtitle}>
              Select service categories that you offer
            </Text>
            
            <View style={styles.categories}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.category,
                    serviceCategories.includes(category) && styles.categorySelected,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      serviceCategories.includes(category) && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Service Formats</Text>
            <Text style={styles.sectionSubtitle}>
              Select how you deliver your services
            </Text>
            
            <View style={styles.categories}>
              {FORMATS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.category,
                    serviceFormats.includes(format) && styles.categorySelected,
                  ]}
                  onPress={() => toggleFormat(format)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      serviceFormats.includes(format) && styles.categoryTextSelected,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Professional Credentials</Text>
            
            <View style={styles.credentialsList}>
              {credentials.map((credential, index) => (
                <View key={index} style={styles.credentialItem}>
                  <FileText size={16} color="#666" />
                  <Text style={styles.credentialText}>{credential}</Text>
                  <TouchableOpacity
                    style={styles.removeCredentialButton}
                    onPress={() => handleRemoveCredential(index)}
                  >
                    <Text style={styles.removeCredentialText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addCredentialButton}
                onPress={handleAddCredential}
              >
                <Text style={styles.addCredentialText}>+ Add Credential</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessDescription}
              onChangeText={setBusinessDescription}
              placeholder="Tell clients about your business and services"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchItem}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Display in Search Results</Text>
                <Text style={styles.switchDescription}>
                  Allow potential clients to find your services
                </Text>
              </View>
              <Switch
                value={displayInSearch}
                onValueChange={setDisplayInSearch}
                trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchItem}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Accept NDIS Payments</Text>
                <Text style={styles.switchDescription}>
                  Allow clients to pay using their NDIS funds
                </Text>
              </View>
              <Switch
                value={acceptNdis}
                onValueChange={setAcceptNdis}
                trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <AlertCircle size={20} color="#666" />
            <Text style={styles.infoCardText}>
              Provider verification status is reviewed by our team. Submit your ABN and credentials to get verified.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Profile'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3b30',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  form: {
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  abnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  abnIcon: {
    marginRight: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  addressIcon: {
    marginRight: 12,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  phoneIcon: {
    marginRight: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  emailIcon: {
    marginRight: 12,
  },
  serviceAreaContainer: {
    marginTop: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  radiusText: {
    fontSize: 14,
    color: '#666',
  },
  radiusTextSelected: {
    color: '#fff',
  },
  credentialsList: {
    gap: 12,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  credentialText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  removeCredentialButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeCredentialText: {
    fontSize: 14,
    color: '#ff3b30',
  },
  addCredentialButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  addCredentialText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoCardText: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  category: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginBottom: 8,
  },
  categorySelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
});