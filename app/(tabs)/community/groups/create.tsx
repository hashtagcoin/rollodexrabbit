import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import {
  Heart,
  Chrome as Home,
  CircleAlert as AlertCircle,
  Image as ImageIcon,
  Lock,
  Users,
  CalendarDays,
} from 'lucide-react-native';
import { MediaError, MediaErrorType } from '../../../../lib/mediaService';
import { decode } from '../../../../lib/base64Utils';
import AppHeader from '../../../../components/AppHeader';

const GROUP_CATEGORIES = [
  'Social',
  'Support',
  'Activities',
  'Travel',
  'Education',
  'Other'
];

export default function CreateGroup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'interest' | 'housing' | 'event'>('interest');
  const [rules, setRules] = useState('');
  const [category, setCategory] = useState('Social');
  const [maxMembers, setMaxMembers] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{coverUrl?: string, avatarUrl?: string}>({});
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventLocation, setEventLocation] = useState('');

  const handleImagePick = async (type: 'cover' | 'avatar', source: 'library' | 'camera' = 'library') => {
    try {
      // Set the appropriate loading state
      if (type === 'cover') {
        setCoverUploading(true);
      } else {
        setAvatarUploading(true);
      }
      
      // Clear previous error
      setError(null);
      
      // Request appropriate permissions based on source
      let permissionResult;
      
      if (source === 'library') {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          setError('Permission to access media library is required');
          return;
        }
      } else {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          setError('Permission to access camera is required');
          return;
        }
      }
      
      // Launch image picker or camera based on source
      const pickerMethod = source === 'library' 
        ? ImagePicker.launchImageLibraryAsync 
        : ImagePicker.launchCameraAsync;
      
      // Configure options based on image type
      const aspect: [number, number] = type === 'cover' ? [16, 9] : [1, 1];
      
      const result = await pickerMethod({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect,
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (result.canceled) {
        return;
      }
      
      // Get the selected asset
      const image = result.assets[0];
      if (!image || !image.uri || !image.base64) {
        throw new Error('No image or base64 data selected');
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Determine file extension and content type
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = fileExt === 'jpg' ? 'image/jpeg' : `image/${fileExt}`;
      
      // Create a unique file path
      const filePath = `${type}/${user.id}_${Date.now()}.${fileExt}`;
      
      // Process base64 data - ensure we don't have any prefixes
      let base64Data = image.base64;
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }
      
      // Upload directly using base64 data
      const { data, error } = await supabase.storage
        .from(type === 'cover' ? 'group-posts' : 'group-avatars')
        .upload(filePath, decode(base64Data), {
          contentType,
          upsert: true
        });
        
      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(type === 'cover' ? 'group-posts' : 'group-avatars')
        .getPublicUrl(filePath);
        
      const imageUrl = urlData.publicUrl;
      
      // Store debug info and update state
      if (type === 'cover') {
        setDebugInfo(prev => ({ ...prev, coverUrl: imageUrl }));
        setCoverImage(imageUrl);
      } else {
        setDebugInfo(prev => ({ ...prev, avatarUrl: imageUrl }));
        setAvatarImage(imageUrl);
      }
      
      Alert.alert('Success', `${type === 'cover' ? 'Cover' : 'Avatar'} image uploaded successfully`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to pick or upload image');
      Alert.alert('Error', err.message || 'Failed to pick or upload image');
    } finally {
      // Clear loading state
      if (type === 'cover') {
        setCoverUploading(false);
      } else {
        setAvatarUploading(false);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreate = async () => {
    try {
      if (!name || !description) {
        setError('Please fill in all required fields');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          type,
          owner_id: user.id,
          rules,
          category,
          max_members: maxMembers ? parseInt(maxMembers) : null,
          is_public: isPublic,
          cover_image_url: coverImage,
          avatar_url: avatarImage,
          tags,
          event_date: type === 'event' ? eventDate : null,
          event_location: type === 'event' ? eventLocation : null,
          settings: {
            allowMemberPosts: true,
            requireApproval: !isPublic,
          },
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred while creating the group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Create Group" />

      <ScrollView style={styles.form}>
        {error && (
          <View style={styles.error}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.imageSection}>
          {coverUploading ? (
            <View style={styles.imageUpload}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading cover image...</Text>
            </View>
          ) : coverImage ? (
            <View style={styles.coverImageContainer}>
              <Image 
                source={{ uri: coverImage }} 
                style={styles.coverPreview} 
                onError={(e) => setError('Cover image loading error')}
              />
              <TouchableOpacity 
                style={styles.changeImageBtn}
                onPress={() => handleImagePick('cover', 'library')}
              >
                <Text style={styles.changeImageText}>Change Cover</Text>
              </TouchableOpacity>
              
              {/* Avatar overlay on cover image */}
              <View style={styles.avatarOverlayContainer}>
                {avatarUploading ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : avatarImage ? (
                  <Image 
                    source={{ uri: avatarImage }} 
                    style={styles.avatarPreview} 
                    onError={(e) => setError('Avatar image loading error')}
                  />
                ) : (
                  <TouchableOpacity 
                    style={styles.avatarPlaceholder}
                    onPress={() => handleImagePick('avatar', 'library')}
                  >
                    <ImageIcon size={24} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imageUpload}
              onPress={() => handleImagePick('cover', 'library')}
            >
              <ImageIcon size={24} color="#666" />
              <Text style={styles.imageUploadText}>Add Cover Image</Text>
            </TouchableOpacity>
          )}

          {/* Only show the add/change avatar button if no cover image */}
          {!coverImage && (
            <View style={styles.avatarContainer}>
              {avatarUploading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : avatarImage ? (
                <Image 
                  source={{ uri: avatarImage }} 
                  style={styles.avatarPreview} 
                  onError={(e) => setError('Avatar image loading error')}
                />
              ) : (
                <TouchableOpacity 
                  style={styles.avatarPlaceholder}
                  onPress={() => handleImagePick('avatar', 'library')}
                >
                  <ImageIcon size={24} color="#666" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.avatarUpload}
                onPress={() => handleImagePick('avatar', 'library')}
                disabled={avatarUploading}
              >
                <Text style={styles.avatarUploadText}>
                  {avatarImage ? 'Change Icon' : 'Add Group Icon'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          maxLength={50}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group about?"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Group Rules</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={rules}
          onChangeText={setRules}
          placeholder="Optional: Set guidelines for your group"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {GROUP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryButtonText,
                category === cat && styles.categoryButtonTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'interest' && styles.typeButtonActive]}
            onPress={() => setType('interest')}
          >
            <Heart size={20} color={type === 'interest' ? '#fff' : '#666'} />
            <Text style={[styles.typeButtonText, type === 'interest' && styles.typeButtonTextActive]}>
              Interest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'housing' && styles.typeButtonActive]}
            onPress={() => setType('housing')}
          >
            <Home size={20} color={type === 'housing' ? '#fff' : '#666'} />
            <Text style={[styles.typeButtonText, type === 'housing' && styles.typeButtonTextActive]}>
              Housing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'event' && styles.typeButtonActive]}
            onPress={() => setType('event')}
          >
            <CalendarDays size={20} color={type === 'event' ? '#fff' : '#666'} />
            <Text style={[styles.typeButtonText, type === 'event' && styles.typeButtonTextActive]}>
              Event
            </Text>
          </TouchableOpacity>
        </View>
        
        {type === 'event' && (
          <>
            <Text style={styles.label}>Event Location</Text>
            <TextInput
              style={styles.input}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder="Where will this event take place?"
            />
          </>
        )}

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => handleRemoveTag(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add tags..."
            onSubmitEditing={handleAddTag}
          />
          <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTag}>
            <Text style={styles.tagAddButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Lock size={20} color="#666" />
              <Text style={styles.settingLabel}>Public Group</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#e5e5e5', true: '#007AFF' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Users size={20} color="#666" />
              <Text style={styles.settingLabel}>Member Limit</Text>
            </View>
            <TextInput
              style={styles.memberLimitInput}
              value={maxMembers}
              onChangeText={setMaxMembers}
              placeholder="No limit"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Group'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
    position: 'relative',
  },
  imageUpload: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadText: {
    marginTop: 8,
    color: '#666',
  },
  uploadingText: {
    marginTop: 8,
    color: '#007AFF',
  },
  coverImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  coverPreview: {
    height: 200,
    borderRadius: 12,
  },
  avatarOverlayContainer: {
    position: 'absolute',
    bottom: -30,
    left: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarUpload: {
    marginTop: 8,
  },
  avatarUploadText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    color: '#666',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: '#fafafa',
  },
  tagAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tagAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsContainer: {
    marginTop: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  memberLimitInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    marginLeft: 8,
    color: '#dc2626',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});