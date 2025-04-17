import { useState, useEffect } from 'react';
import ModernImagePicker from '../../components/ModernImagePicker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChevronRight, CircleAlert as AlertCircle, MapPin, Hash, Building, Upload, CreditCard as Bank, Phone, Mail, FileText } from 'lucide-react-native';

const COMFORT_TRAITS = [
  'Quiet Environment',
  'Female Support Worker',
  'Male Support Worker',
  'Experience with Autism',
  'Experience with Physical Disabilities',
  'Pet Friendly',
  'Transport Provided',
  'Flexible Schedule',
];

const SERVICE_CATEGORIES = [
  'Therapy',
  'Personal Care',
  'Transport',
  'Social Activities',
  'Home Maintenance',
  'Daily Tasks',
  'Exercise Physiology',
  'Skills Development',
];

const SERVICE_FORMATS = [
  'In Person',
  'Online',
  'Home Visits',
  'Center Based',
  'Group Sessions',
];

const PROVIDER_CATEGORIES = [
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

const PROVIDER_FORMATS = [
  'In Person',
  'Online',
  'Home Visits',
  'Center Based',
  'Group Sessions',
];

const PROVIDER_CREDENTIALS = [
  'NDIS Registration',
  'Occupational Therapy License',
  'Physiotherapy License',
  'Speech Therapy License',
  'Psychology License',
  'Support Work Certification',
  'Working with Disabled People Certification',
  'First Aid Certificate',
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Common form state
  const [fullName, setFullName] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [role, setRole] = useState('participant');
  
  // Participant-specific form state
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState('10');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // Provider-specific form state
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceArea, setServiceArea] = useState('10');  // radius in km
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [providerCategories, setProviderCategories] = useState<string[]>([]);
  const [providerFormats, setProviderFormats] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [acceptNdis, setAcceptNdis] = useState(true);
  const [bankAccount, setBankAccount] = useState({
    accountName: '',
    bsb: '',
    accountNumber: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const toggleTrait = (trait: string) => {
    setSelectedTraits(current =>
      current.includes(trait)
        ? current.filter(t => t !== trait)
        : [...current, trait]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(current =>
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(current =>
      current.includes(format)
        ? current.filter(f => f !== format)
        : [...current, format]
    );
  };

  const toggleProviderCategory = (category: string) => {
    setProviderCategories(current =>
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  const toggleProviderFormat = (format: string) => {
    setProviderFormats(current =>
      current.includes(format)
        ? current.filter(f => f !== format)
        : [...current, format]
    );
  };

  const toggleCredential = (credential: string) => {
    setCredentials(current =>
      current.includes(credential)
        ? current.filter(c => c !== credential)
        : [...current, credential]
    );
  };

  // For demo purposes, using a placeholder for image upload
  const handleUploadLogo = () => {
    setLogoUrl('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop');
  };

  const handleNext = () => {
    // Validation for first step (common to both flows)
    if (step === 1) {
      if (!fullName) {
        setError('Please enter your full name');
        return;
      }
      
      // For participants, NDIS number is required
      if (role === 'participant' && !ndisNumber) {
        setError('Please enter your NDIS number');
        return;
      }
      
      setError(null);
      setStep(step + 1);
      return;
    }
    
    // Participant-specific validation
    if (role === 'participant') {
      if (step === 2 && (!address || !radius)) {
        setError('Please enter your address and preferred radius');
        return;
      }

      if (step === 3 && selectedTraits.length === 0) {
        setError('Please select at least one comfort trait');
        return;
      }
      
      if (step === 4 && (selectedCategories.length === 0 || selectedFormats.length === 0)) {
        setError('Please select your preferences');
        return;
      }
    }
    
    // Provider-specific validation
    if (role === 'provider') {
      if (step === 2 && (!businessName || !businessAddress)) {
        setError('Please enter your business name and address');
        return;
      }

      if (step === 3 && (providerCategories.length === 0 || providerFormats.length === 0)) {
        setError('Please select at least one service category and format');
        return;
      }
      
      if (step === 4 && (!bankAccount.accountName || !bankAccount.bsb || !bankAccount.accountNumber)) {
        setError('Please enter your bank account details');
        return;
      }
    }

    // Last step - complete onboarding
    if ((role === 'participant' && step === 4) || (role === 'provider' && step === 4)) {
      handleComplete();
      return;
    }

    // Move to next step
    setError(null);
    setStep(step + 1);
  };

  // Generate a simple username based on full name
  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Common profile data
      const profileData: any = {
        full_name: fullName,
        username: generateUsername(fullName),
        role: role,
      };
      
      // Add participant-specific fields
      if (role === 'participant') {
        profileData.ndis_number = ndisNumber;
        profileData.comfort_traits = selectedTraits;
        profileData.preferred_categories = selectedCategories;
        profileData.preferred_service_formats = selectedFormats;
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Create provider profile if user selected provider role
      if (role === 'provider') {
        try {
          const providerData = {
            id: user.id,
            business_name: businessName || `${fullName}'s Services`,
            abn: abn || null,
            credentials: credentials.length > 0 ? credentials : null, 
            verified: false,
            logo_url: logoUrl,
            business_description: description,
          };

          const { error: providerError } = await supabase
            .from('service_providers')
            .insert(providerData);

          if (providerError && providerError.code !== '23505') { // Ignore if already exists (unique constraint error)
            console.error('Error creating provider profile:', providerError);
          }

          // Create default wallet
          const { error: walletError } = await supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              total_balance: 0, // Providers start with 0 balance
              category_breakdown: {
                core_support: 0,
                capacity_building: 0,
                capital_support: 0
              }
            });

          if (walletError) {
            console.error('Error creating wallet:', walletError);
          }
        } catch (e: unknown) {
          // Log error but don't stop onboarding flow
          console.error('Failed to create provider profile:', e);
        }
      } else {
        // Create participant wallet with default funds
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            total_balance: 15000,
            category_breakdown: {
              core_support: 8000,
              capacity_building: 5000,
              capital_support: 2000
            }
          });

        if (walletError) {
          console.error('Error creating wallet:', walletError);
        }
      }

      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred during onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Render steps based on role
  const renderStep = () => {
    // Common first step for both roles
    if (step === 1) {
      return (
        <View style={styles.step1}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>Let's start with your details</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'participant' && styles.roleSelected
                  ]}
                  onPress={() => setRole('participant')}
                >
                  <Text style={[
                    styles.roleText,
                    role === 'participant' && styles.roleTextSelected
                  ]}>Participant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'provider' && styles.roleSelected
                  ]}
                  onPress={() => setRole('provider')}
                >
                  <Text style={[
                    styles.roleText,
                    role === 'provider' && styles.roleTextSelected
                  ]}>Provider</Text>
                </TouchableOpacity>
              </View>
            </View>

            {role === 'participant' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>NDIS Number</Text>
                <TextInput
                  style={styles.input}
                  value={ndisNumber}
                  onChangeText={setNdisNumber}
                  placeholder="Enter your NDIS number"
                  keyboardType="number-pad"
                />
              </View>
            )}
          </View>
        </View>
      );
    }

    // Participant-specific steps
    if (role === 'participant') {
      if (step === 2) {
        return (
          <View style={styles.step2}>
            <Text style={styles.title}>Your Location</Text>
            <Text style={styles.subtitle}>Help us find services near you</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Home Address</Text>
                <View style={styles.addressInput}>
                  <MapPin size={20} color="#666" style={styles.addressIcon} />
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your address"
                    multiline
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Search Radius (km)</Text>
                <View style={styles.radiusContainer}>
                  {[5, 10, 15, 20, 25].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.radiusOption,
                        radius === String(value) && styles.radiusSelected,
                      ]}
                      onPress={() => setRadius(String(value))}
                    >
                      <Text
                        style={[
                          styles.radiusText,
                          radius === String(value) && styles.radiusTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );
      }

      if (step === 3) {
        return (
          <View style={styles.step2}>
            <Text style={styles.title}>Comfort Traits</Text>
            <Text style={styles.subtitle}>Select traits that make you feel comfortable</Text>

            <View style={styles.traits}>
              {COMFORT_TRAITS.map((trait) => (
                <TouchableOpacity
                  key={trait}
                  style={[
                    styles.trait,
                    selectedTraits.includes(trait) && styles.traitSelected,
                  ]}
                  onPress={() => toggleTrait(trait)}
                >
                  <Text
                    style={[
                      styles.traitText,
                      selectedTraits.includes(trait) && styles.traitTextSelected,
                    ]}
                  >
                    {trait}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      if (step === 4) {
        return (
          <View style={styles.step3}>
            <Text style={styles.title}>Service Preferences</Text>
            <Text style={styles.subtitle}>Choose your preferred categories and formats</Text>

            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categories}>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.category,
                    selectedCategories.includes(category) && styles.categorySelected,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategories.includes(category) && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Service Formats</Text>
            <View style={styles.formats}>
              {SERVICE_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.format,
                    selectedFormats.includes(format) && styles.formatSelected,
                  ]}
                  onPress={() => toggleFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatText,
                      selectedFormats.includes(format) && styles.formatTextSelected,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }
    }

    // Provider-specific steps
    if (role === 'provider') {
      if (step === 2) {
        return (
          <View style={styles.step2}>
            <Text style={styles.title}>Business Information</Text>
            <Text style={styles.subtitle}>Tell us about your business</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Name *</Text>
                <View style={styles.businessNameInput}>
                  <Building size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter your business name"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>ABN (Australian Business Number)</Text>
                <View style={styles.abnInput}>
                  <Hash size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={abn}
                    onChangeText={setAbn}
                    placeholder="Enter your ABN"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Address *</Text>
                <View style={styles.addressInput}>
                  <MapPin size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                    placeholder="Enter business address"
                    multiline
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Phone</Text>
                <View style={styles.phoneInput}>
                  <Phone size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={businessPhone}
                    onChangeText={setBusinessPhone}
                    placeholder="Enter business phone"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Email</Text>
                <View style={styles.emailInput}>
                  <Mail size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={businessEmail}
                    onChangeText={setBusinessEmail}
                    placeholder="Enter business email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </View>
        );
      }

      if (step === 3) {
        return (
          <View style={styles.step3}>
            <Text style={styles.title}>Service Details</Text>
            <Text style={styles.subtitle}>Tell us what services you offer</Text>

            <Text style={styles.sectionTitle}>Service Categories</Text>
            <View style={styles.categories}>
              {PROVIDER_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.category,
                    providerCategories.includes(category) && styles.categorySelected,
                  ]}
                  onPress={() => toggleProviderCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      providerCategories.includes(category) && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Service Formats</Text>
            <View style={styles.formats}>
              {PROVIDER_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.format,
                    providerFormats.includes(format) && styles.formatSelected,
                  ]}
                  onPress={() => toggleProviderFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatText,
                      providerFormats.includes(format) && styles.formatTextSelected,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Professional Credentials</Text>
            <View style={styles.traits}>
              {PROVIDER_CREDENTIALS.map((credential) => (
                <TouchableOpacity
                  key={credential}
                  style={[
                    styles.trait,
                    credentials.includes(credential) && styles.traitSelected,
                  ]}
                  onPress={() => toggleCredential(credential)}
                >
                  <Text
                    style={[
                      styles.traitText,
                      credentials.includes(credential) && styles.traitTextSelected,
                    ]}
                  >
                    {credential}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ndisSwitch}>
              <View style={styles.ndisSwitchLabels}>
                <Text style={styles.ndisSwitchTitle}>Accept NDIS Payments</Text>
                <Text style={styles.ndisSwitchDescription}>Allow clients to pay with NDIS funds</Text>
              </View>
              <Switch
                value={acceptNdis}
                onValueChange={setAcceptNdis}
                trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
              />
            </View>
          </View>
        );
      }

      if (step === 4) {
        return (
          <View style={styles.step4}>
            <Text style={styles.title}>Payment & Business Details</Text>
            <Text style={styles.subtitle}>Add your banking details and business description</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Name</Text>
                <View style={styles.bankInput}>
                  <Bank size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={bankAccount.accountName}
                    onChangeText={(text) => setBankAccount({...bankAccount, accountName: text})}
                    placeholder="Enter account name"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>BSB</Text>
                <View style={styles.bankInput}>
                  <Bank size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={bankAccount.bsb}
                    onChangeText={(text) => setBankAccount({...bankAccount, bsb: text})}
                    placeholder="Enter BSB"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Number</Text>
                <View style={styles.bankInput}>
                  <Bank size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={bankAccount.accountNumber}
                    onChangeText={(text) => setBankAccount({...bankAccount, accountNumber: text})}
                    placeholder="Enter account number"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your business and services offered"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.logoSection}>
                <Text style={styles.label}>Business Logo</Text>
                {logoUrl ? (
                  <View style={styles.logoPreview}>
                    <Image source={{ uri: logoUrl }} style={styles.logoImage} />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleUploadLogo}
                  >
                    <Upload size={24} color="#007AFF" />
                    <Text style={styles.uploadText}>Upload Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      }
    }

    // Fallback for any other step
    return <View />;
  };

  // Determine the total number of steps based on role
  const totalSteps = 4;

  // Update button text based on step and role
  const getButtonText = () => {
    const isLastStep = (role === 'participant' && step === 4) || 
                       (role === 'provider' && step === 4);
                       
    if (loading) {
      return 'Processing...';
    }
    
    if (isLastStep) {
      return 'Complete';
    }
    
    return 'Continue';
  };

  // Update step description based on role
  const getStepDescription = () => {
    if (role === 'participant') {
      return `Step ${step} of ${totalSteps}`;
    } else {
      const stepDescriptions = [
        'Basic Information',
        'Business Details',
        'Services & Credentials',
        'Banking & Description'
      ];
      return `Step ${step}: ${stepDescriptions[step-1]}`;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.step}>{getStepDescription()}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
      </View>

      {error && (
        <View style={styles.error}>
          <AlertCircle size={20} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {renderStep()}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {getButtonText()}
        </Text>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  step: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e1e1',
    borderRadius: 2,
  },
  progress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  addressInput: {
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
  radiusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    height: 56,
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
    fontSize: 16,
    color: '#666',
  },
  radiusTextSelected: {
    color: '#fff',
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trait: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  traitSelected: {
    backgroundColor: '#007AFF',
  },
  traitText: {
    fontSize: 14,
    color: '#666',
  },
  traitTextSelected: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 16,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  category: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
  formats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  format: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  formatSelected: {
    backgroundColor: '#007AFF',
  },
  formatText: {
    fontSize: 14,
    color: '#666',
  },
  formatTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
  },
  roleTextSelected: {
    color: '#fff',
  },
  step1: {
    marginBottom: 20,
  },
  step2: {
    marginBottom: 20,
  },
  step3: {
    marginBottom: 20,
  },
  step4: {
    marginBottom: 20,
  },
  businessNameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  abnInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  emailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  ndisSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  ndisSwitchLabels: {
    flex: 1,
  },
  ndisSwitchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ndisSwitchDescription: {
    fontSize: 14,
    color: '#666',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  bankInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  logoSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});