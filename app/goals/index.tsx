import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Goal } from '../../types/goals';
import GoalCard from '../../components/goals/GoalCard';

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ndis_goals')
        .select(`
          *,
          checklist_items(*),
          goal_updates(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate progress for each goal
      const goalsWithProgress = data.map(goal => {
        const totalItems = goal.checklist_items?.length || 0;
        const completedItems = goal.checklist_items?.filter(item => item.is_completed).length || 0;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
          ...goal,
          progress,
          checklist_items: goal.checklist_items || [],
          goal_updates: goal.goal_updates || []
        };
      });

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Handle error - maybe show a toast or alert
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No goals yet!</Text>
            <Text style={styles.emptyStateSubtext}>Start by adding your first goal</Text>
          </View>
        ) : (
          goals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onUpdate={fetchGoals}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/goals/new')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  emptyStateSubtext: {
    color: '#666',
    marginBottom: 24,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
