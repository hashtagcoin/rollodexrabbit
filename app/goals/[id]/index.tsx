import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Edit2, Trash2, Plus, MessageSquare } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Goal, ChecklistItem, GoalUpdate } from '../../../types/goals';

export default function GoalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showUpdates, setShowUpdates] = useState(true);
  const [newUpdate, setNewUpdate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch goal data
  useEffect(() => {
    if (id) fetchGoal();
  }, [id]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ndis_goals')
        .select(`
          *,
          checklist_items(*),
          goal_updates(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setGoal(data);
    } catch (error) {
      console.error('Error fetching goal:', error);
      Alert.alert('Error', 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist item completion
  const toggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('goal_checklist_items')
        .update({ 
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
      fetchGoal(); // Refresh data
    } catch (error) {
      console.error('Error updating checklist item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  // Add a new update
  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('goal_updates')
        .insert({
          goal_id: id,
          content: newUpdate.trim(),
        });

      if (error) throw error;
      
      setNewUpdate('');
      fetchGoal(); // Refresh data
    } catch (error) {
      console.error('Error adding update:', error);
      Alert.alert('Error', 'Failed to add update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete goal confirmation
  const deleteGoal = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  // Confirm and delete goal
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete related data
      await supabase.from('goal_checklist_items').delete().eq('goal_id', id);
      await supabase.from('goal_updates').delete().eq('goal_id', id);
      
      // Delete goal
      const { error } = await supabase
        .from('ndis_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      router.replace('/goals');
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Error state
  if (!goal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Goal not found</Text>
      </View>
    );
  }

  // Calculate progress
  const completedItems = goal.checklist_items?.filter(item => item.is_completed).length || 0;
  const totalItems = goal.checklist_items?.length || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Goal Details',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => router.push(`/goals/${id}/edit`)}
                style={styles.headerButton}
                disabled={isDeleting}
              >
                <Edit2 size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={deleteGoal}
                style={styles.headerButton}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <Trash2 size={20} color="#FF3B30" />
                )}
              </TouchableOpacity>
            </View>
          ),
        }} 
      />

      <ScrollView style={styles.content}>
        {/* Goal Header Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{goal.title}</Text>
          
          {goal.description && (
            <Text style={styles.description}>{goal.description}</Text>
          )}
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{goal.category || 'Not specified'}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Target Date</Text>
              <Text style={styles.metaValue}>
                {goal.target_date ? formatDate(goal.target_date) : 'No date set'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[styles.statusBadge, goal.is_completed && styles.statusBadgeCompleted]}>
                <Text style={styles.statusText}>
                  {goal.is_completed ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>
                {progress}% ({completedItems}/{totalItems})
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Checklist Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowChecklist(!showChecklist)}
          >
            <Text style={styles.sectionTitle}>Checklist</Text>
            {showChecklist ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {showChecklist && (
            <View style={styles.sectionContent}>
              {goal.checklist_items && goal.checklist_items.length > 0 ? (
                goal.checklist_items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.checklistItem}
                    onPress={() => toggleChecklistItem(item.id, item.is_completed)}
                  >
                    <View style={[
                      styles.checkbox,
                      item.is_completed && styles.checkboxChecked
                    ]}>
                      {item.is_completed && <Check size={14} color="#fff" />}
                    </View>
                    <Text 
                      style={[
                        styles.checklistText,
                        item.is_completed && styles.completedText
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyStateText}>No checklist items yet</Text>
              )}
            </View>
          )}
        </View>

        {/* Updates Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowUpdates(!showUpdates)}
          >
            <Text style={styles.sectionTitle}>Updates</Text>
            {showUpdates ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {showUpdates && (
            <View style={styles.sectionContent}>
              {/* Add Update Form */}
              <View style={styles.addUpdateContainer}>
                <TextInput
                  style={styles.updateInput}
                  placeholder="Share an update about your progress..."
                  value={newUpdate}
                  onChangeText={setNewUpdate}
                  multiline
                  placeholderTextColor="#999"
                  editable={!isSubmitting}
                />
                <TouchableOpacity 
                  style={[
                    styles.addUpdateButton,
                    (!newUpdate.trim() || isSubmitting) && styles.addUpdateButtonDisabled
                  ]}
                  onPress={handleAddUpdate}
                  disabled={!newUpdate.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addUpdateButtonText}>Post Update</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Updates List */}
              <View style={styles.updatesList}>
                {goal.goal_updates && goal.goal_updates.length > 0 ? (
                  [...goal.goal_updates]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((update) => (
                      <View key={update.id} style={styles.updateItem}>
                        <Text style={styles.updateContent}>{update.content}</Text>
                        <Text style={styles.updateDate}>
                          {formatDate(update.created_at)}
                        </Text>
                      </View>
                    ))
                ) : (
                  <Text style={styles.emptyStateText}>No updates yet</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    width: '50%',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionContent: {
    padding: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  addUpdateContainer: {
    marginBottom: 16,
  },
  updateInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  addUpdateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  addUpdateButtonDisabled: {
    opacity: 0.5,
  },
  addUpdateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  updatesList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  updateItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  updateContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  updateDate: {
    fontSize: 12,
    color: '#999',
  },
});
