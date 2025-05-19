import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, X, Check, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  'Personal',
  'Health',
  'Education',
  'Employment',
  'Social',
  'Daily Living',
  'Other',
];

export default function CreateGoalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{id: string; text: string}[]>([
    { id: '1', text: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: Date.now().toString(), text: '' }]);
  };

  const removeChecklistItem = (id: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter(item => item.id !== id));
    }
  };

  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(
      checklistItems.map(item => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your goal');
      return;
    }

    const validChecklistItems = checklistItems
      .filter(item => item.text.trim() !== '')
      .map((item, index) => ({
        description: item.text.trim(),
        position: index,
        is_completed: false,
      }));

    if (validChecklistItems.length === 0) {
      Alert.alert('Error', 'Please add at least one checklist item');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/login');
        return;
      }

      // Create the goal
      const { data: goal, error: goalError } = await supabase
        .from('ndis_goals')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          target_date: targetDate ? targetDate.toISOString() : null,
          is_completed: false,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Add checklist items
      const { error: itemsError } = await supabase
        .from('goal_checklist_items')
        .insert(
          validChecklistItems.map(item => ({
            goal_id: goal.id,
            description: item.description,
            position: item.position,
            is_completed: item.is_completed,
          }))
        );

      if (itemsError) throw itemsError;

      // Navigate back to goals list
      router.replace('/goals');
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'New Goal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text 
                style={[
                  styles.saveButton,
                  isSubmitting && styles.saveButtonDisabled
                ]}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
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
            <Text style={styles.pickerButtonText}>
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
            >
              <Plus size={16} color="#007AFF" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {checklistItems.map((item, index) => (
            <View key={item.id} style={styles.checklistItem}>
              <View style={styles.checklistNumber}>
                <Text style={styles.checklistNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.checklistInput]}
                placeholder={`Checklist item ${index + 1}`}
                value={item.text}
                onChangeText={text => updateChecklistItem(item.id, text)}
                placeholderTextColor="#999"
              />
              {checklistItems.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeItemButton}
                  onPress={() => removeChecklistItem(item.id)}
                >
                  <X size={18} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {checklistItems.some(item => item.text.trim() === '') && (
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
  content: {
    flex: 1,
    padding: 16,
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
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
  pickerOptions: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 200,
    overflow: 'hidden',
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
  checklistNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checklistNumberText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  checklistInput: {
    flex: 1,
    marginRight: 8,
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
