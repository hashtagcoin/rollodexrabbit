import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, CreditCard as Edit, Trash2, Calendar, CircleAlert as AlertCircle, Plus, DollarSign } from 'lucide-react-native';

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [service, setService] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);

  // Predefined options
  const CATEGORIES = [
    'Therapy', 'Transport', 'Support Work', 'Personal Care',
    'Home Maintenance', 'Skills Development'
  ];

  const FORMATS = [
    'in_person', 'online', 'hybrid', 'group'
  ];

  useEffect(() => {
    loadService();
  }, [id]);

  async function loadService() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          format,
          price,
          available,
          created_at,
          media_urls
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setService(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category);
      setFormat(data.format);
      setPrice(data.price.toString());
      setAvailable(data.available);
    } catch (e: unknown) {
      console.error('Error loading service:', e);
      setError(e instanceof Error ? e.message : 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      if (!title || !category || !format || !price) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setError('Please enter a valid price');
        return;
      }

      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('services')
        .update({
          title,
          description,
          category,
          format,
          price: parseFloat(price),
          available,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setIsEditing(false);
      loadService();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // In a real app, you'd want to show a confirmation dialog
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.replace('/provider/services');
    } catch (error: unknown) {
      console.error('Error deleting service:', error);
      setError(error instanceof Error ? error.message : 'Could not delete service');
      setLoading(false);
    }
  };
  
  const confirmDelete = () => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: handleDelete,
          style: "destructive"
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Service Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Service Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#ff3b30" />
          <Text style={styles.errorTitle}>Service Not Found</Text>
          <Text style={styles.errorMessage}>
            The service you're looking for doesn't exist or you don't have permission to view it.
          </Text>
          <TouchableOpacity
            style={styles.backToServicesButton}
            onPress={() => router.replace('/provider/services')}
          >
            <Text style={styles.backToServicesText}>Back to Services</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Service' : 'Service Details'}
        </Text>
        {isEditing ? (
          <View style={{ width: 40 }} />
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isEditing ? (
          // Edit mode
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
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDelete}
              >
                <Trash2 size={20} color="#ff3b30" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View mode
          <>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceStatusContainer}>
                  {service.available ? (
                    <View style={styles.activeStatus}>
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveStatus}>
                      <Text style={styles.inactiveText}>Inactive</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                
                <View style={styles.serviceMetaContainer}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Category:</Text>
                    <Text style={styles.metaValue}>{service.category}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Format:</Text>
                    <Text style={styles.metaValue}>{service.format.replace('_', ' ')}</Text>
                  </View>
                </View>
                
                <View style={styles.servicePriceContainer}>
                  <DollarSign size={20} color="#007AFF" />
                  <Text style={styles.servicePrice}>${service.price}</Text>
                </View>
              </View>
              
              {service.media_urls && service.media_urls.length > 0 && (
                <Image
                  source={{ uri: service.media_urls[0] }}
                  style={styles.serviceImage}
                />
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionContent}>
                {service.description || 'No description provided'}
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date Added:</Text>
                <Text style={styles.detailValue}>
                  {new Date(service.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Service ID:</Text>
                <Text style={styles.detailValue}>{service.id}</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Bookings</Text>
                <TouchableOpacity onPress={() => router.push('/provider/bookings')}>
                  <Text style={styles.viewAllLink}>View all</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.emptyBookings}>
                <Calendar size={40} color="#e1e1e1" />
                <Text style={styles.emptyBookingsText}>No recent bookings</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      
      {!isEditing && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.editServiceButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit size={20} color="#fff" />
            <Text style={styles.editServiceText}>Edit Service</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToServicesButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  backToServicesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
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
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceStatusContainer: {
    marginBottom: 8,
  },
  activeStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e6f7e9',
    borderRadius: 20,
  },
  activeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CD964',
  },
  inactiveStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
  },
  inactiveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  serviceMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
  serviceImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginLeft: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  emptyBookings: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyBookingsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
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
  actionButtons: {
    gap: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    height: 56,
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  editServiceButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editServiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});