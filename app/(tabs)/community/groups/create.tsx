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
  const [type, setType] = useState<'interest' | 'housing'>('interest');
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

  const handleImagePick = async (type: 'cover' | 'avatar') => {
    try {
      // Set the appropriate loading state
      if (type === 'cover') {
        setCoverUploading(true);
      } else {
        setAvatarUploading(true);
      }
      
      // Clear previous error
      setError(null);
      
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setError('Permission to access camera roll is required');
        return;
      }
      
      // Launch image picker with base64 option
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
        base64: true, // Request base64 encoding
        exif: false, // No need for EXIF data
      });

      if (result.canceled) {
        console.log('Image picker cancelled');
        return;
      }
      
      // Get the selected asset
      const image = result.assets[0];
      if (!image || !image.uri || !image.base64) {
        throw new Error('No image or base64 data selected');
      }
      
      console.log(`Selected ${type} image:`, image.uri.substring(0, 30) + '...');
      console.log(`Base64 data length: ${image.base64.length}`);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Determine file extension and content type
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      
      // Create a unique file path
      const filePath = `${type}/${user.id}_${Date.now()}.${fileExt}`;
      
      console.log(`Uploading ${type} image to bucket with content type: ${contentType}`);
      
      // Upload directly using base64 data
      const { data, error } = await supabase.storage
        .from(type === 'cover' ? 'group-posts' : 'group-avatars')
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
        .from(type === 'cover' ? 'group-posts' : 'group-avatars')
        .getPublicUrl(filePath);
        
      const imageUrl = urlData.publicUrl;
      console.log(`Got URL: ${imageUrl}`);
      
      // Store debug info and update state
      if (type === 'cover') {
        setDebugInfo(prev => ({ ...prev, coverUrl: imageUrl }));
        setCoverImage(imageUrl);
      } else {
        setDebugInfo(prev => ({ ...prev, avatarUrl: imageUrl }));
        setAvatarImage(imageUrl);
      }
      
      // Show success message
      Alert.alert('Success', `${type === 'cover' ? 'Cover' : 'Avatar'} image uploaded successfully`);
      
    } catch (e: unknown) {
      // Enhanced error logging following TypeScript best practices
      console.error(`Error uploading ${type} image:`, e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      // Reset loading state
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
      console.error('Error creating group:', e);
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
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.uploadingText}>Uploading cover image...</Text>
            </View>
          ) : coverImage ? (
            <View>
              <Image 
                source={{ uri: coverImage }} 
                style={styles.coverPreview} 
                onError={(e) => console.error('Cover image loading error:', e.nativeEvent.error)}
              />
              <TouchableOpacity 
                style={styles.changeImageBtn}
                onPress={() => handleImagePick('cover')}
              >
                <Text style={styles.changeImageText}>Change Cover</Text>
              </TouchableOpacity>
              {__DEV__ && debugInfo.coverUrl && (
                <View style={styles.debugUrlContainer}>
                  <Text style={styles.debugUrlLabel}>Cover URL:</Text>
                  <Text style={styles.debugUrl} selectable={true}>
                    {debugInfo.coverUrl}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imageUpload}
              onPress={() => handleImagePick('cover')}
            >
              <ImageIcon size={24} color="#666" />
              <Text style={styles.imageUploadText}>Add Cover Image</Text>
            </TouchableOpacity>
          )}

          <View style={styles.avatarContainer}>
            {avatarUploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="small" color="#0066cc" />
              </View>
            ) : avatarImage ? (
              <View>
                <Image 
                  source={{ uri: avatarImage }} 
                  style={styles.avatarPreview} 
                  onError={(e) => console.error('Avatar image loading error:', e.nativeEvent.error)}
                />
                {__DEV__ && debugInfo.avatarUrl && (
                  <View style={styles.debugUrlContainer}>
                    <Text style={styles.debugUrlLabel}>Avatar URL:</Text>
                    <Text style={styles.debugUrl} selectable={true}>
                      {debugInfo.avatarUrl}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.avatarPlaceholder}
                onPress={() => handleImagePick('avatar')}
              >
                <ImageIcon size={24} color="#666" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.avatarUpload}
              onPress={() => handleImagePick('avatar')}
              disabled={avatarUploading}
            >
              <Text style={styles.avatarUploadText}>
                {avatarImage ? 'Change Icon' : 'Add Group Icon'}
              </Text>
            </TouchableOpacity>
          </View>
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
            <Heart size={20} color={type === 'interest' ? '#fff' : '#000'} />
            <Text style={[styles.typeButtonText, type === 'interest' && styles.typeButtonTextActive]}>
              Interest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'housing' && styles.typeButtonActive]}
            onPress={() => setType('housing')}
          >
            <Home size={20} color={type === 'housing' ? '#fff' : '#000'} />
            <Text style={[styles.typeButtonText, type === 'housing' && styles.typeButtonTextActive]}>
              Housing
            </Text>
          </TouchableOpacity>
        </View>

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
              <Lock size={20} color="#000" />
              <Text style={styles.settingLabel}>Public Group</Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Users size={20} color="#000" />
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
  coverPreview: {
    height: 200,
    borderRadius: 12,
  },
  avatarContainer: {
    alignItems: 'center',
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
  },
  avatarPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarUpload: {
    position: 'absolute',
    bottom: -30,
    left: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarUploadText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    backgroundColor: '#000',
  },
  categoryButtonText: {
    color: '#000',
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
    backgroundColor: '#000',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
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
    color: '#000',
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
  },
  tagAddButton: {
    backgroundColor: '#000',
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
  },
  memberLimitInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
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
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingText: {
    marginTop: 8,
    color: '#0066cc',
    fontSize: 14,
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugUrlContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginHorizontal: 8,
  },
  debugUrlLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  debugUrl: {
    fontSize: 10,
    color: '#666',
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 2,
  },
});