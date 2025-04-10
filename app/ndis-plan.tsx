import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileCheck, Calendar, Clock, DollarSign, ChevronRight, CircleAlert as AlertCircle, FileText, Upload, Download, Wallet, ChartBar as BarChart3, Lightbulb, Target, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import AppHeader from '../components/AppHeader';

export default function NdisPlanScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNdisData();
  }, []);

  async function loadNdisData() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Error loading wallet:', walletError);
      } else {
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading NDIS data:', error);
      setError('Failed to load NDIS plan data');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNdisData();
    setRefreshing(false);
  };

  // Calculate plan dates
  const getPlanDates = () => {
    const now = new Date();
    const planStartDate = new Date(now);
    planStartDate.setMonth(planStartDate.getMonth() - 6);
    
    const planEndDate = new Date(now);
    planEndDate.setMonth(planEndDate.getMonth() + 6);
    
    return {
      startDate: planStartDate.toLocaleDateString(),
      endDate: planEndDate.toLocaleDateString(),
      daysRemaining: Math.round((planEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const planDates = getPlanDates();

  // Mock goals data
  const goals = [
    {
      id: 1,
      category: 'Daily Living',
      description: 'Improve independent living skills',
      progress: 65,
      status: 'in_progress'
    },
    {
      id: 2,
      category: 'Social & Community',
      description: 'Participate in community activities',
      progress: 80,
      status: 'in_progress'
    },
    {
      id: 3,
      category: 'Health & Wellbeing',
      description: 'Attend regular therapy sessions',
      progress: 90,
      status: 'in_progress'
    }
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="NDIS Plan" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : loading ? (
          <Text style={styles.loadingText}>Loading NDIS plan data...</Text>
        ) : (
          <>
            {/* Plan Overview Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planIconContainer}>
                  <FileCheck size={24} color="#007AFF" />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>Current NDIS Plan</Text>
                  <Text style={styles.planNumber}>
                    {profile?.ndis_number || 'Not connected'}
                    {profile?.ndis_verified && (
                      <Text style={styles.verifiedBadge}> ✓ Verified</Text>
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.planDates}>
                <View style={styles.dateItem}>
                  <Calendar size={16} color="#666" />
                  <Text style={styles.dateLabel}>Start Date:</Text>
                  <Text style={styles.dateValue}>{planDates.startDate}</Text>
                </View>
                <View style={styles.dateItem}>
                  <Calendar size={16} color="#666" />
                  <Text style={styles.dateLabel}>End Date:</Text>
                  <Text style={styles.dateValue}>{planDates.endDate}</Text>
                </View>
                <View style={styles.dateItem}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.dateLabel}>Remaining:</Text>
                  <Text style={styles.dateValue}>{planDates.daysRemaining} days</Text>
                </View>
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity style={styles.planActionButton}>
                  <FileText size={16} color="#007AFF" />
                  <Text style={styles.planActionText}>View Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.planActionButton}>
                  <Upload size={16} color="#007AFF" />
                  <Text style={styles.planActionText}>Update Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.planActionButton}>
                  <Download size={16} color="#007AFF" />
                  <Text style={styles.planActionText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Funding Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Funding Summary</Text>
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => router.push('/wallet')}
                >
                  <Text style={styles.viewDetailsText}>View Wallet</Text>
                  <ChevronRight size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.fundingCard}>
                <View style={styles.fundingHeader}>
                  <View style={styles.fundingIconContainer}>
                    <DollarSign size={24} color="#4CD964" />
                  </View>
                  <View style={styles.fundingInfo}>
                    <Text style={styles.fundingLabel}>Total Funding</Text>
                    <Text style={styles.fundingAmount}>
                      ${wallet?.total_balance?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fundingCategories}>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Core Support</Text>
                    <Text style={styles.categoryAmount}>
                      ${wallet?.category_breakdown?.core_support?.toLocaleString() || '0'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${wallet?.category_breakdown?.core_support 
                              ? (wallet.category_breakdown.core_support / wallet.total_balance) * 100 
                              : 0}%`,
                            backgroundColor: '#4CD964'
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Capacity Building</Text>
                    <Text style={styles.categoryAmount}>
                      ${wallet?.category_breakdown?.capacity_building?.toLocaleString() || '0'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${wallet?.category_breakdown?.capacity_building 
                              ? (wallet.category_breakdown.capacity_building / wallet.total_balance) * 100 
                              : 0}%`,
                            backgroundColor: '#007AFF'
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Capital Support</Text>
                    <Text style={styles.categoryAmount}>
                      ${wallet?.category_breakdown?.capital_support?.toLocaleString() || '0'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${wallet?.category_breakdown?.capital_support 
                              ? (wallet.category_breakdown.capital_support / wallet.total_balance) * 100 
                              : 0}%`,
                            backgroundColor: '#FF9500'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.submitClaimButton}
                  onPress={() => router.push('/wallet/submit-claim')}
                >
                  <Text style={styles.submitClaimText}>Submit New Claim</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Goals Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My NDIS Goals</Text>
                <TouchableOpacity style={styles.viewDetailsButton}>
                  <Text style={styles.viewDetailsText}>Manage Goals</Text>
                  <ChevronRight size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {goals.map(goal => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalCategory}>
                      <Target size={16} color="#007AFF" />
                      <Text style={styles.goalCategoryText}>{goal.category}</Text>
                    </View>
                    <Text style={styles.goalStatus}>
                      {goal.progress}% Complete
                    </Text>
                  </View>
                  
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                  
                  <View style={styles.goalProgressBar}>
                    <View 
                      style={[
                        styles.goalProgressFill, 
                        { width: `${goal.progress}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addGoalButton}>
                <Text style={styles.addGoalText}>+ Add New Goal</Text>
              </TouchableOpacity>
            </View>

            {/* Support Coordinator Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Support Team</Text>
              
              <View style={styles.supportCard}>
                <View style={styles.supportHeader}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1974&auto=format&fit=crop' }}
                    style={styles.supportAvatar}
                  />
                  <View style={styles.supportInfo}>
                    <Text style={styles.supportName}>Sarah Johnson</Text>
                    <Text style={styles.supportRole}>Support Coordinator</Text>
                  </View>
                </View>
                
                <View style={styles.supportActions}>
                  <TouchableOpacity style={styles.supportActionButton}>
                    <Text style={styles.supportActionText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportActionButton}>
                    <Text style={styles.supportActionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportActionButton}>
                    <Text style={styles.supportActionText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Upcoming Reviews */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Reviews</Text>
              
              <View style={styles.reviewCard}>
                <View style={styles.reviewIconContainer}>
                  <Calendar size={24} color="#007AFF" />
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewTitle}>Plan Review Meeting</Text>
                  <Text style={styles.reviewDate}>June 15, 2025</Text>
                  <Text style={styles.reviewDescription}>
                    Scheduled review with NDIS planner to discuss plan progress and future goals.
                  </Text>
                </View>
              </View>
            </View>

            {/* Resources Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NDIS Resources</Text>
              
              <View style={styles.resourcesGrid}>
                <TouchableOpacity style={styles.resourceCard}>
                  <View style={styles.resourceIcon}>
                    <FileText size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.resourceTitle}>NDIS Guide</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.resourceCard}>
                  <View style={styles.resourceIcon}>
                    <BarChart3 size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.resourceTitle}>Price Guide</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.resourceCard}>
                  <View style={styles.resourceIcon}>
                    <Lightbulb size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.resourceTitle}>Tips & FAQs</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.resourceCard}>
                  <View style={styles.resourceIcon}>
                    <CheckCircle2 size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.resourceTitle}>Eligibility</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    margin: 24,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#ff3b30',
    fontSize: 14,
  },
  planCard: {
    margin: 24,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  planNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  verifiedBadge: {
    color: '#4CD964',
    fontWeight: '500',
  },
  planDates: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 80,
  },
  dateValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  planActionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  section: {
    padding: 24,
    paddingTop: 0,
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
    marginBottom: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
  },
  fundingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  fundingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  fundingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f7e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fundingInfo: {
    flex: 1,
  },
  fundingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fundingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  fundingCategories: {
    marginBottom: 20,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  submitClaimButton: {
    backgroundColor: '#007AFF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitClaimText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  goalStatus: {
    fontSize: 14,
    color: '#666',
  },
  goalDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: '#e1e1e1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  addGoalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderStyle: 'dashed',
  },
  addGoalText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  supportCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  supportInfo: {
    flex: 1,
  },
  supportName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  supportRole: {
    fontSize: 14,
    color: '#666',
  },
  supportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#e1f0ff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  supportActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  reviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reviewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  resourceCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});