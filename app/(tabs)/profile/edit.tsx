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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, User, Upload, Hash, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaError, MediaErrorType } from '../../../lib/mediaService';
import { decode } from '../../../lib/base64Utils';

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
      console.error('Error loading profile:', e);
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
      console.error('Error saving profile:', e);
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

  // Handle avatar upload using base64 encoding for improved reliability
  const handleUploadAvatar = async () => {
    try {
      // Show loading state
      setSaving(true);
      
      // Clear any previous errors
      setError(null);
      
      // Request permission to access the media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setError('Permission to access camera roll is required');
        return;
      }
      
      // Launch the image picker with base64 option
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Request base64 encoding
        exif: false,  // No need for EXIF data
      });
      
      if (pickerResult.canceled) {
        console.log('Image picker canceled');
        setSaving(false);
        return; // User canceled the picker
      }
      
      // Get the selected asset
      const image = pickerResult.assets[0];
      if (!image || !image.uri || !image.base64) {
        throw new Error('No image or base64 data selected');
      }
      
      console.log('Selected profile image:', image.uri.substring(0, 30) + '...');
      console.log(`Base64 data length: ${image.base64.length}`);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Determine file extension and content type
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      
      // Create a unique file path
      const filePath = `avatar/${user.id}_${Date.now()}.${fileExt}`;
      
      console.log(`Uploading profile image with content type: ${contentType}`);
      
      // Upload directly using base64 data
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), {
          contentType,
          upsert: true
        });
        
      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      
      console.log('File uploaded successfully. Getting URL...');
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const imageUrl = urlData.publicUrl;
      console.log(`Got URL: ${imageUrl}`);
      
      // Update the avatar URL state
      setAvatarUrl(imageUrl);
      
      // Show success message
      Alert.alert('Success', 'Profile photo updated successfully');
      
    } catch (e: unknown) {
      // Error handling following TypeScript best practices
      console.error('Error uploading avatar:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
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
          {saving ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.loadingText}>Uploading photo...</Text>
            </View>
          ) : avatarUrl ? (
            <View>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarPreview}
                onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
              />
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugLabel}>Image URL:</Text>
                  <Text style={styles.debugText} selectable={true}>
                    {avatarUrl}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={40} color="#666" />
            </View>
          )}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadAvatar}
            disabled={saving}
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>
              {saving ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
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
  debugText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
    padding: 4,
  },
  debugContainer: {
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 4,
    maxWidth: 250,
    alignSelf: 'center',
  },
  debugLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
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