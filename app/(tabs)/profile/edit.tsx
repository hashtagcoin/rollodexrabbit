import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, User, Upload, Hash, CircleAlert as AlertCircle, Camera } from 'lucide-react-native';
import ModernImagePicker from '../../../components/ModernImagePicker';
import { decode as base64ToArrayBuffer } from '../../../lib/base64Utils';
import * as FileSystem from 'expo-file-system';

export default function EditProfile() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [comfortTraits, setComfortTraits] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [preferredFormats, setPreferredFormats] = useState<string[]>([]);

  // ModernImagePicker avatar handler
  const handleAvatarPicked = async (uri: string | null) => {
    if (!uri) {
      setAvatarUrl(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const extMatch = uri.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const baseFileName = `${user.id}_${Date.now()}.${ext}`;
      const pathInBucket = `avatar/${baseFileName}`;

      let uploadBody: FormData | ArrayBuffer;
      let uploadContentType: string;

      if (Platform.OS === 'web') {
        console.log('Fetching URI for blob (Web):', uri);
        const response = await fetch(uri);
        const webBlob = await response.blob();
        if (!webBlob || webBlob.size === 0) {
          Alert.alert('Error', 'Web: Could not read image data or image is empty.');
          setLoading(false);
          return;
        }
        uploadContentType = webBlob.type || `image/${ext}`; // Save for FileOptions

        const formData = new FormData();
        formData.append('file', webBlob, baseFileName);
        uploadBody = formData;
        uploadContentType = uploadContentType; // For Supabase options with FormData
        console.log('Using FormData for Web. Blob Size:', webBlob.size, 'Type:', uploadContentType);

      } else {
        // Native (iOS/Android): Read file as base64, then convert to ArrayBuffer
        console.log('Reading file as base64 (Native):', uri);
        const base64String = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64String) {
          Alert.alert('Error', 'Native: Failed to read file as base64 string.');
          setLoading(false);
          return;
        }

        try {
          uploadBody = base64ToArrayBuffer(base64String); // Use the utility to get ArrayBuffer
        } catch (e) {
          console.error('Error converting base64 to ArrayBuffer:', e);
          Alert.alert('Error', 'Native: Failed to convert image data.');
          setLoading(false);
          return;
        }
        
        uploadContentType = `image/${ext}`; // Derive from extension, crucial for ArrayBuffer upload
        
        console.log('Created ArrayBuffer (Native). Size:', uploadBody.byteLength, 'Type:', uploadContentType);

        if (!uploadBody || uploadBody.byteLength === 0) {
          Alert.alert('Error', 'Native: Could not process image data to ArrayBuffer or ArrayBuffer is empty.');
          setLoading(false);
          return;
        }
      }

      console.log('Attempting to upload to Supabase. Path:', pathInBucket, 'Content-Type:', uploadContentType);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(pathInBucket, uploadBody, { // uploadBody is FormData for web, ArrayBuffer for native
          contentType: uploadContentType, // Crucial for ArrayBuffer, also used for FormData path for consistency with previous fix
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('Supabase upload successful:', uploadData);

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(pathInBucket);
      if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL for avatar');
      setAvatarUrl(publicUrlData.publicUrl);
    } catch (e: any) {
      setError(e.message || 'Failed to upload avatar');
      Alert.alert('Upload failed', e.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };


  // Preset options
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

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setBio(data.bio || '');
      setNdisNumber(data.ndis_number || '');
      setAvatarUrl(data.avatar_url);
      setComfortTraits(data.comfort_traits || []);
      setPreferredCategories(data.preferred_categories || []);
      setPreferredFormats(data.preferred_service_formats || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      if (!fullName) {
        setError('Full name is required');
        return;
      }
      
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          username: username || null,
          bio: bio || null,
          ndis_number: ndisNumber || null,
          avatar_url: avatarUrl,
          comfort_traits: comfortTraits,
          preferred_categories: preferredCategories,
          preferred_service_formats: preferredFormats,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleTrait = (trait: string) => {
    setComfortTraits(current =>
      current.includes(trait)
        ? current.filter(t => t !== trait)
        : [...current, trait]
    );
  };

  const toggleCategory = (category: string) => {
    setPreferredCategories(current =>
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  const toggleFormat = (format: string) => {
    setPreferredFormats(current =>
      current.includes(format)
        ? current.filter(f => f !== format)
        : [...current, format]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.error}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.avatarSection}>
          <ModernImagePicker
            imageUri={avatarUrl}
            onImagePicked={handleAvatarPicked}
            size={120}
            shape="circle"
            label="Change Photo"
            crop={true}
            aspect={[1,1]}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NDIS Number</Text>
            <View style={styles.ndisInput}>
              <Hash size={20} color="#666" style={styles.ndisIcon} />
              <TextInput
                style={styles.input}
                value={ndisNumber}
                onChangeText={setNdisNumber}
                placeholder="Enter your NDIS number"
              />
            </View>
          </View>

          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Comfort Traits</Text>
            <Text style={styles.sectionSubtitle}>
              Select traits that are important for your comfort
            </Text>
            
            <View style={styles.traitsContainer}>
              {COMFORT_TRAITS.map((trait) => (
                <TouchableOpacity
                  key={trait}
                  style={[
                    styles.traitChip,
                    comfortTraits.includes(trait) && styles.selectedChip,
                  ]}
                  onPress={() => toggleTrait(trait)}
                >
                  <Text
                    style={[
                      styles.traitChipText,
                      comfortTraits.includes(trait) && styles.selectedChipText,
                    ]}
                  >
                    {trait}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Preferred Categories</Text>
            <Text style={styles.sectionSubtitle}>
              Select service categories that interest you
            </Text>
            
            <View style={styles.traitsContainer}>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.traitChip,
                    preferredCategories.includes(category) && styles.selectedChip,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.traitChipText,
                      preferredCategories.includes(category) && styles.selectedChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Preferred Formats</Text>
            <Text style={styles.sectionSubtitle}>
              Select how you prefer to receive services
            </Text>
            
            <View style={styles.traitsContainer}>
              {SERVICE_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.traitChip,
                    preferredFormats.includes(format) && styles.selectedChip,
                  ]}
                  onPress={() => toggleFormat(format)}
                >
                  <Text
                    style={[
                      styles.traitChipText,
                      preferredFormats.includes(format) && styles.selectedChipText,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    margin: 24,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ff3b30',
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 8,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  input: {
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
  ndisInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  ndisIcon: {
    marginRight: 12,
  },
  preferencesSection: {
    marginBottom: 8,
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
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#007AFF',
  },
  traitChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedChipText: {
    color: '#fff',
  },
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0066cc',
    fontSize: 14,
  },
});