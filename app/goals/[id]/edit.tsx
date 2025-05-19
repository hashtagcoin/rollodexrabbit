import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, X, Check, ChevronDown, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import { Goal, ChecklistItem } from '../../../types/goals';

const CATEGORIES = [
  'Personal',
  'Health',
  'Education',
  'Employment',
  'Social',
  'Daily Living',
  'Other',
];

export default function EditGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGoal();
    }
  }, [id]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      
      const { data: goal, error: goalError } = await supabase
        .from('ndis_goals')
        .select('*')
        .eq('id', id)
        .single();

      if (goalError) throw goalError;

      // Fetch checklist items
      const { data: items, error: itemsError } = await supabase
        .from('goal_checklist_items')
        .select('*')
        .eq('goal_id', id)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      setTitle(goal.title);
      setDescription(goal.description || '');
      setCategory(goal.category || 'Personal');
      setTargetDate(goal.target_date ? new Date(goal.target_date) : null);
      setChecklistItems(items || []);
    } catch (error) {
      console.error('Error fetching goal:', error);
      Alert.alert('Error', 'Failed to load goal details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems, 
      { 
        id: `temp-${Date.now()}`,
        goal_id: id || '',
        description: '',
        is_completed: false,
        position: checklistItems.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  };

  const removeChecklistItem = (itemId: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter(item => item.id !== itemId));
    }
  };

  const updateChecklistItem = (itemId: string, field: keyof ChecklistItem, value: any) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your goal');
      return;
    }

    const validChecklistItems = checklistItems
      .filter(item => item.description.trim() !== '')
      .map((item, index) => ({
        ...item,
        position: index,
      }));

    if (validChecklistItems.length === 0) {
      Alert.alert('Error', 'Please add at least one checklist item');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update the goal
      const { error: goalError } = await supabase
        .from('ndis_goals')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category,
          target_date: targetDate ? targetDate.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (goalError) throw goalError;

      // Get existing checklist items to determine which ones to delete
      const { data: existingItems } = await supabase
        .from('goal_checklist_items')
        .select('id')
        .eq('goal_id', id);

      const existingItemIds = existingItems?.map(item => item.id) || [];
      const newItems = validChecklistItems.filter(item => item.id.toString().startsWith('temp-'));
      const updatedItems = validChecklistItems.filter(item => !item.id.toString().startsWith('temp-'));
      const deletedItemIds = existingItemIds.filter(id => 
        !validChecklistItems.some(item => item.id === id)
      );

      // Delete removed items
      if (deletedItemIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('goal_checklist_items')
          .delete()
          .in('id', deletedItemIds);
          
        if (deleteError) throw deleteError;
      }

      // Update existing items
      const updatePromises = updatedItems.map(item => 
        supabase
          .from('goal_checklist_items')
          .update({
            description: item.description.trim(),
            position: item.position,
            is_completed: item.is_completed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      );

      const updateResults = await Promise.all(updatePromises);
      const updateErrors = updateResults.filter(res => res.error);
      
      if (updateErrors.length > 0) {
        throw new Error('Failed to update some checklist items');
      }

      // Add new items
      if (newItems.length > 0) {
        const { error: insertError } = await supabase
          .from('goal_checklist_items')
          .insert(
            newItems.map(item => ({
              goal_id: id,
              description: item.description.trim(),
              position: item.position,
              is_completed: item.is_completed,
            }))
          );

        if (insertError) throw insertError;
      }

      // Navigate back to goals list
      router.replace('/goals');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGoal = async () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              // Delete checklist items first
              await supabase
                .from('goal_checklist_items')
                .delete()
                .eq('goal_id', id);
              
              // Delete goal updates
              await supabase
                .from('goal_updates')
                .delete()
                .eq('goal_id', id);
              
              // Finally, delete the goal
              const { error } = await supabase
                .from('ndis_goals')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              // Navigate back to goals list
              router.replace('/goals');
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Goal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={deleteGoal}
                disabled={isSubmitting}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={styles.saveButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#007AFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ),
        }} 
      />

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Goal Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you want to achieve?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add more details about your goal..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={styles.pickerButtonText}>{category}</Text>
            <ChevronDown size={18} color="#666" />
          </TouchableOpacity>
          
          {showCategoryPicker && (
            <View style={styles.pickerOptions}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.pickerOption}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{cat}</Text>
                  {category === cat && <Check size={18} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Date (Optional)</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={targetDate ? styles.pickerButtonText : styles.placeholderText}>
              {targetDate ? targetDate.toLocaleDateString('en-AU') : 'Select a date'}
            </Text>
            <ChevronDown size={18} color="#666" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={targetDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setTargetDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checklistHeader}>
            <Text style={styles.label}>Checklist Items *</Text>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={addChecklistItem}
              disabled={isSubmitting}
            >
              <Plus size={16} color="#007AFF" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {checklistItems.map((item, index) => (
            <View key={item.id} style={styles.checklistItem}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  item.is_completed && styles.checkboxChecked
                ]}
                onPress={() => updateChecklistItem(item.id, 'is_completed', !item.is_completed)}
                disabled={isSubmitting}
              >
                {item.is_completed && <Check size={12} color="#fff" />}
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input, 
                  styles.checklistInput,
                  item.is_completed && styles.completedText
                ]}
                placeholder={`Checklist item ${index + 1}`}
                value={item.description}
                onChangeText={text => updateChecklistItem(item.id, 'description', text)}
                placeholderTextColor="#999"
                editable={!isSubmitting}
              />
              {checklistItems.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeItemButton}
                  onPress={() => removeChecklistItem(item.id)}
                  disabled={isSubmitting}
                >
                  <X size={18} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {checklistItems.some(item => !item.description.trim()) && (
            <Text style={styles.hintText}>
              Empty checklist items will be removed when saving
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    marginLeft: 16,
    marginRight: 16,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  pickerOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 4,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  addItemText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
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
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checklistInput: {
    flex: 1,
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#868e96',
  },
  removeItemButton: {
    padding: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
