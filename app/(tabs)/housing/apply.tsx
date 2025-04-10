import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Calendar,
  Users,
  Dog,
  CircleAlert as AlertCircle,
  ChevronRight,
} from 'lucide-react-native';

export default function ApplyHousing() {
  const { listingId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [moveInDate, setMoveInDate] = useState('');
  const [householdSize, setHouseholdSize] = useState('1');
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState('');
  const [supportRequirements, setSupportRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = async () => {
    try {
      if (!moveInDate || !householdSize) {
        setError('Please fill in all required fields');
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: applicationError } = await supabase
        .from('housing_applications')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          move_in_date: moveInDate,
          household_size: parseInt(householdSize),
          has_pets: hasPets,
          pet_details: petDetails,
          support_requirements: supportRequirements,
          additional_notes: additionalNotes,
        });

      if (applicationError) throw applicationError;

      router.push('/housing');
    } catch (e: unknown) {
      console.error('Error submitting application:', e);
      setError(e instanceof Error ? e.message : 'Failed to submit housing application');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Apply for Housing</Text>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.error}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Move-in Date *</Text>
            <View style={styles.dateInput}>
              <Calendar size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={moveInDate}
                onChangeText={setMoveInDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Household Size *</Text>
            <View style={styles.householdInput}>
              <Users size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={householdSize}
                onChangeText={setHouseholdSize}
                keyboardType="number-pad"
                placeholder="Number of occupants"
              />
            </View>
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchHeader}>
              <Dog size={20} color="#666" />
              <Text style={styles.switchLabel}>Do you have pets?</Text>
            </View>
            <Switch
              value={hasPets}
              onValueChange={setHasPets}
              trackColor={{ false: '#e1e1e1', true: '#007AFF' }}
            />
          </View>

          {hasPets && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pet Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={petDetails}
                onChangeText={setPetDetails}
                placeholder="Type, breed, size, etc."
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Support Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={supportRequirements}
              onChangeText={setSupportRequirements}
              placeholder="Describe any specific support needs or requirements"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Any other information you'd like to share"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.infoBox}>
            <AlertCircle size={20} color="#666" />
            <Text style={styles.infoText}>
              Your application will be reviewed by the housing provider. They may contact you for additional information or to schedule a viewing.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Text>
          <ChevronRight size={20} color="#fff" />
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
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: '#ff3b30',
    flex: 1,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  householdInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  switchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});