import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';
import { useRouter } from 'expo-router';

type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  group_id: string;
  group_name?: string;
};

export default function EventsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(events);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        events.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q)
        )
      );
    }
  }, [search, events]);

  async function loadEvents() {
    setLoading(true);
    try {
      const { data: evs, error } = await supabase
        .from('group_events')
        .select('id, title, description, event_date, group_id');
      if (error) throw error;
      const eventsData = evs || [];

      const groupIds = [...new Set(eventsData.map((e) => e.group_id))];
      const { data: groups, error: grpErr } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);
      if (grpErr) throw grpErr;
      const grpMap: Record<string, string> = {};
      (groups || []).forEach((g) => {
        grpMap[g.id] = g.name;
      });

      const enriched = eventsData.map((e) => ({
        ...e,
        group_name: grpMap[e.group_id] || ''
      }));

      setEvents(enriched);
      setFiltered(enriched);
    } catch (e) {
      console.error('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Events" showBackButton />
      <TextInput
        style={styles.search}
        placeholder="Search events..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadEvents}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              /* navigate to event details if needed */
            }}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.group}>{item.group_name}</Text>
            <Text style={styles.date}>
              {new Date(item.event_date).toLocaleDateString()}
            </Text>
            <Text style={styles.desc}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No events found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: {
    margin: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  group: { fontSize: 14, color: '#666', marginBottom: 4 },
  date: { fontSize: 12, color: '#999', marginBottom: 8 },
  desc: { fontSize: 14, color: '#333' },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
