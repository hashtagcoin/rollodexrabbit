import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, RefreshControl, Modal } from 'react-native';
import { FileText, ChevronRight, Search, Filter, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AppHeader from '../../components/AppHeader';

interface SignedAgreement {
  id: string; 
  signed_at: string;
  agreement_details: { 
    id: string; 
    agreement_title: string;
    agreement_content: string;
    agreement_version: number;
    effective_date: string;
    status: string; 
    service: { 
      id: string;
      title: string;
    } | null;
    provider: { 
      id: string;
      business_name: string;
      logo_url: string | null; 
    } | null;
  };
}

export default function ServiceAgreementsScreen() {
  const [signedAgreements, setSignedAgreements] = useState<SignedAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgreementContent, setSelectedAgreementContent] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const loadAgreements = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('participant_signed_agreements')
        .select(`
          id, 
          signed_at,
          agreement_version_id!inner(
            id, agreement_title, agreement_content, agreement_version, effective_date, status,
            service_id!inner(id, title),
            service_provider_id!inner(id, business_name, logo_url)
          )
        `)
        .eq('participant_user_id', user.id)
        .order('signed_at', { ascending: false });

      if (error) {
        console.error('Error loading signed agreements:', error);
        throw error;
      }

      const transformedData: SignedAgreement[] = data.map((item: any) => ({
        id: item.id,
        signed_at: item.signed_at,
        agreement_details: {
          id: item.agreement_version_id.id,
          agreement_title: item.agreement_version_id.agreement_title,
          agreement_content: item.agreement_version_id.agreement_content,
          agreement_version: item.agreement_version_id.agreement_version,
          effective_date: item.agreement_version_id.effective_date,
          status: item.agreement_version_id.status, 
          service: item.agreement_version_id.service_id ? {
            id: item.agreement_version_id.service_id.id,
            title: item.agreement_version_id.service_id.title,
          } : null,
          provider: item.agreement_version_id.service_provider_id ? {
            id: item.agreement_version_id.service_provider_id.id,
            business_name: item.agreement_version_id.service_provider_id.business_name,
            logo_url: item.agreement_version_id.service_provider_id.logo_url,
          } : null,
        }
      }));

      setSignedAgreements(transformedData);
    } catch (err: any) {
      console.error('Error in loadAgreements:', err);
      Alert.alert('Error', `Failed to load service agreements: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAgreements();
  }, [loadAgreements]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CD964'; 
      case 'pending':
        return '#FFCC00'; 
      case 'superseded':
      case 'expired':
      case 'cancelled':
      case 'inactive': 
        return '#FF3B30'; 
      default:
        return '#8e8e93'; 
    }
  };

  const handleViewAgreementText = (content: string) => {
    setSelectedAgreementContent(content);
    setIsModalVisible(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title="Service Agreements" 
          showBackButton={true} 
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading service agreements...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Service Agreements" 
        showBackButton={true} 
        onBackPress={() => router.back()}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => console.log('Search agreements')}
            >
              <Search size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => console.log('Filter agreements')}
            >
              <Filter size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {signedAgreements.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#c7c7cc" />
            <Text style={styles.emptyStateTitle}>No Service Agreements Signed</Text>
            <Text style={styles.emptyStateText}>
              You haven't signed any service agreements yet.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/discover')}
            >
              <Text style={styles.emptyStateButtonText}>Find Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.agreementsList}>
            {signedAgreements.map((signedItem) => (
              <TouchableOpacity
                key={signedItem.id} 
                style={styles.agreementCard}
                onPress={() => handleViewAgreementText(signedItem.agreement_details.agreement_content)}
              >
                <View style={styles.agreementHeader}>
                  <View style={styles.providerInfoContainer}>
                    {signedItem.agreement_details.provider?.logo_url ? (
                      <Image 
                        source={{ uri: signedItem.agreement_details.provider.logo_url }}
                        style={styles.providerAvatar} 
                        onError={(e) => console.log('Failed to load provider logo:', e.nativeEvent.error)}
                      />
                    ) : (
                      <View style={[styles.providerAvatar, styles.avatarPlaceholder]}>
                        <FileText size={20} color="#fff" />
                      </View>
                    )}
                    <View style={styles.providerTextContainer}>
                      <Text style={styles.providerName} numberOfLines={1}>
                        {signedItem.agreement_details.provider?.business_name || 'Unknown Provider'}
                      </Text>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {signedItem.agreement_details.service?.title || 'General Agreement'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(signedItem.agreement_details.status) }]}>
                    <Text style={styles.statusText}>{signedItem.agreement_details.status || 'Unknown'}</Text>
                  </View>
                </View>
                <View style={styles.agreementMeta}>
                  <Text style={styles.metaText}>Version: {signedItem.agreement_details.agreement_version}</Text>
                  <Text style={styles.metaText}>Signed On: {formatDate(signedItem.signed_at)}</Text>
                </View>
                <View style={styles.agreementFooter}>
                  <Text style={styles.agreementTitle} numberOfLines={2}>
                    {signedItem.agreement_details.agreement_title}
                  </Text>
                  <ChevronRight size={20} color="#007AFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Agreement Content</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                    <X size={24} color="#333" />
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalTextContent}>{selectedAgreementContent}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8, 
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flexGrow: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50, 
  },
  emptyStateTitle: {
    fontSize: 20, 
    fontWeight: '600', 
    color: '#333',
    marginTop: 20, 
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 15, 
    color: '#6c6c6c', 
    textAlign: 'center',
    marginBottom: 25, 
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  agreementsList: {
    padding: 15, 
  },
  agreementCard: {
    backgroundColor: '#fff',
    borderRadius: 12, 
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  agreementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 12,
  },
  providerInfoContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
    marginRight: 8, 
  },
  providerAvatar: {
    width: 40, 
    height: 40,
    borderRadius: 20, 
    marginRight: 10,
    backgroundColor: '#e1e1e1',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF', 
  },
  providerTextContainer: { 
    flex: 1, 
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2e',
  },
  serviceName: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12, 
    minWidth: 60, 
    alignItems: 'center', 
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  agreementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6c6c6c',
  },
  agreementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  agreementTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1, 
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5, 
  },
  modalScrollView: {
    maxHeight: '80%', 
  },
  modalTextContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
});
