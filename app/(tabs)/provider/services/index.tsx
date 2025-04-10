import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Search, Filter, CirclePlus as PlusCircle, BrainCircuit, Bike, HandHelping as Helping, ThumbsUp, MoveVertical as MoreVertical, CircleAlert as AlertCircle } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';

type Service = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  price: number;
  available: boolean;
  created_at: string;
};

export default function ServicesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  // Filter services by search query
  useEffect(() => {
    if (services.length > 0) {
      loadServices();
    }
  }, [searchQuery]);

  // Helper to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'therapy':
        return <BrainCircuit size={24} color="#007AFF" />;
      case 'transport':
        return <Bike size={24} color="#FF9500" />;
      case 'support':
      case 'support work':
        return <Helping size={24} color="#4CD964" />;
      default:
        return <ThumbsUp size={24} color="#5856D6" />;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Your Services" showBackButton={true} />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/provider/services/create')}
      >
        <PlusCircle size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading services...</Text>
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Services Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first service to start receiving bookings
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/provider/services/create')}
            >
              <Text style={styles.emptyStateButtonText}>Add a Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.servicesList}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(`/provider/services/${service.id}`)}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.categoryIcon}>
                    {getCategoryIcon(service.category)}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceCategory}>
                      {service.category} • {service.format}
                    </Text>
                  </View>
                  <View style={styles.serviceStatus}>
                    {service.available ? (
                      <View style={styles.activeStatus}>
                        <Text style={styles.activeText}>Active</Text>
                      </View>
                    ) : (
                      <View style={styles.inactiveStatus}>
                        <Text style={styles.inactiveText}>Inactive</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.menuButton}>
                      <MoreVertical size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description || 'No description provided'}
                </Text>
                
                <View style={styles.serviceFooter}>
                  <Text style={styles.servicePrice}>${service.price}</Text>
                  <Text style={styles.serviceDate}>
                    Added: {new Date(service.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addServiceButton}
          onPress={() => router.push('/provider/services/create')}
        >
          <PlusCircle size={20} color="#fff" />
          <Text style={styles.addServiceText}>Add New Service</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    margin: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  servicesList: {
    padding: 24,
  },
  serviceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#666',
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e6f7e9',
    borderRadius: 8,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CD964',
  },
  inactiveStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceDate: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  addServiceButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});