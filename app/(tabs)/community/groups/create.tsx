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
import ModernImagePicker from '../../../../components/ModernImagePicker';
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
  const [debugInfo, setDebugInfo] = useState<{coverUrl?: string, avatarUrl?: string}>({});
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventLocation, setEventLocation] = useState('');

  const handleCoverPicked = (uri: string | null) => {
    setCoverImage(uri);
  };

  const handleAvatarPicked = (uri: string | null) => {
    setAvatarImage(uri);
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

      // --- Add random existing users as members ---
      // Fetch up to 10 random user IDs from user_profiles, excluding the creator
      const { data: randomUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id')
        .neq('id', user.id)
        .order('random()')
        .limit(10);

      if (usersError) throw usersError;

      if (randomUsers && randomUsers.length > 0) {
        const memberRows = randomUsers.map((u: { id: string }) => ({
          group_id: data.id,
          user_id: u.id,
          role: 'member',
        }));
        const { error: randomMemberError } = await supabase
          .from('group_members')
          .insert(memberRows);
        if (randomMemberError) throw randomMemberError;
      }

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
          <View style={styles.coverImageContainer}>
            <ModernImagePicker
              imageUri={coverImage}
              onImagePicked={handleCoverPicked}
              aspect={[16,9]}
              crop={true}
              size={undefined} // Let style control size
              shape="rounded"
              label={undefined}
              style={styles.coverImage}
              icon={<ImageIcon size={32} color="#fff" />} // Icon overlay
            />
            <View style={styles.avatarOverlayContainer}>
              <ModernImagePicker
                imageUri={avatarImage}
                onImagePicked={handleAvatarPicked}
                aspect={[1,1]}
                crop={true}
                size={80}
                shape="circle"
                label={undefined}
                style={styles.avatarImage}
                icon={<ImageIcon size={24} color="#007AFF" />} // Icon overlay
              />
            </View>
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
    marginBottom: 32,
    width: '100%',
    alignSelf: 'center',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 16,
    backgroundColor: '#e5e5e5',
    overflow: 'hidden',
  },
  avatarOverlayContainer: {
    position: 'absolute',
    left: '50%',
    bottom: -40,
    transform: [{ translateX: -40 }], // half avatar size
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    display: 'none', // Hide old avatar container
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