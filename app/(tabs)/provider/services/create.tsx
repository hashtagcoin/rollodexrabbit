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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import {
  ArrowLeft,
  Camera,
  Upload,
  CircleAlert as AlertCircle,
  Plus,
} from 'lucide-react-native';

export default function CreateServiceScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Predefined options
  const CATEGORIES = [
    'Therapy', 'Transport', 'Support Work', 'Personal Care',
    'Home Maintenance', 'Skills Development'
  ];

  const FORMATS = [
    'in_person', 'online', 'hybrid', 'group'
  ];

  const handleCreateService = async () => {
    try {
      if (!title || !category || !format || !price) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setError('Please enter a valid price');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('services')
        .insert({
          provider_id: user.id,
          title,
          description,
          category,
          format,
          price: parseFloat(price),
          available,
          media_urls: uploadedImages.length > 0 ? uploadedImages : null,
        });

      if (insertError) throw insertError;

      router.push('/provider/services');
    } catch (e: unknown) {
      console.error('Error creating service:', e);
      setError(e instanceof Error ? e.message : 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes, using a placeholder image
  const handleAddImage = () => {
    setUploadedImages([
      ...uploadedImages,
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop'
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
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
        <Text style={styles.title}>Create Service</Text>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Physiotherapy Session"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your service..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.optionsContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionChip,
                    category === cat && styles.optionChipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      category === cat && styles.optionChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Format *</Text>
            <View style={styles.optionsContainer}>
              {FORMATS.map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.optionChip,
                    format === fmt && styles.optionChipSelected,
                  ]}
                  onPress={() => setFormat(fmt)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      format === fmt && styles.optionChipTextSelected,
                    ]}
                  >
                    {fmt.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price (AUD) *</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.availableContainer}>
              <Text style={styles.label}>Available for Booking</Text>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Images</Text>
            <View style={styles.imageSection}>
              {uploadedImages.map((image, index) => (
                <View key={index} style={styles.uploadedImageContainer}>
                  <Image
                    source={{ uri: image }}
                    style={styles.uploadedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
              >
                <Plus size={24} color="#666" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateService}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Service'}
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingLeft: 16,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#1a1a1a',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  optionChipSelected: {
    backgroundColor: '#007AFF',
  },
  optionChipText: {
    fontSize: 14,
    color: '#666',
  },
  optionChipTextSelected: {
    color: '#fff',
  },
  availableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadedImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  createButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});