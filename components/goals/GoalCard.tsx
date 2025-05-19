import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Check, ChevronDown, ChevronUp, Edit2, Trash2, MessageSquare } from 'lucide-react-native';
import { Goal } from '../../types/goals';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

type GoalCardProps = {
  goal: Goal;
  onUpdate: () => void;
};

export default function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('goal_checklist_items')
        .update({ 
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating checklist item:', error);
      Alert.alert('Error', 'Failed to update checklist item');
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ndis_goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete goal');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteGoal },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const completedItems = goal.checklist_items?.filter(item => item.is_completed).length || 0;
  const totalItems = goal.checklist_items?.length || 0;
  const progress = goal.progress || 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        disabled={loading}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {goal.title}
            </Text>
            {expanded ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` },
                  goal.is_completed && styles.progressComplete
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress}% ({completedItems}/{totalItems})
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.category}>{goal.category}</Text>
            <Text style={styles.dueDate}>
              {formatDate(goal.target_date)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {goal.description && (
            <Text style={styles.description}>{goal.description}</Text>
          )}
          
          {totalItems > 0 && (
            <View style={styles.checklist}>
              <Text style={styles.sectionTitle}>Checklist</Text>
              {goal.checklist_items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => !loading && toggleChecklistItem(item.id, item.is_completed)}
                  disabled={loading}
                >
                  <View style={[
                    styles.checkbox,
                    item.is_completed && styles.checkboxCompleted
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
              ))}
            </View>
          )}

          <View style={styles.updatesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Updates</Text>
              <TouchableOpacity 
                style={styles.addUpdateButton}
                onPress={() => router.push(`/goals/${goal.id}/updates`)}
              >
                <MessageSquare size={16} color="#007AFF" />
                <Text style={styles.addUpdateText}>Add Update</Text>
              </TouchableOpacity>
            </View>
            
            {goal.goal_updates && goal.goal_updates.length > 0 ? (
              <View style={styles.updateItem}>
                <Text style={styles.updateContent}>
                  {goal.goal_updates[0].content}
                </Text>
                <Text style={styles.updateDate}>
                  {new Date(goal.goal_updates[0].created_at).toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.noUpdatesText}>No updates yet</Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => router.push(`/goals/${goal.id}/edit`)}
              disabled={loading}
            >
              <Edit2 size={16} color="#007AFF" />
              <Text style={[styles.actionText, styles.editText]}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={confirmDelete}
              disabled={loading}
            >
              <Trash2 size={16} color="#FF3B30" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    padding: 16,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 3,
  },
  progressComplete: {
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  checklist: {
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#868e96',
  },
  updatesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  addUpdateText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  updateItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  updateContent: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  updateDate: {
    fontSize: 11,
    color: '#868e96',
  },
  noUpdatesText: {
    fontSize: 13,
    color: '#868e96',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#e7f1ff',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
});
