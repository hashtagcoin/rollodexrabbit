import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform, // Added for DateTimePicker conditional rendering
} from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjusted path
import { useAuth } from '../../providers/AuthProvider'; // Adjusted path
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Type definitions (copied and adapted from GroupDetails)
interface ProfileBase {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface GroupEventParticipant {
  user: ProfileBase | null;
  status: 'going' | 'maybe' | 'not_going';
}

export interface GroupEvent { // Exporting for potential use elsewhere, e.g. in event detail screen
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: { city?: string; full_address: string; [key: string]: any } | null;
  max_participants: number | null;
  created_by: string;
  created_at: string;
  event_status: string; 
  organizer: ProfileBase | null;
  participants: GroupEventParticipant[];
  creator_name: string | null;
  participants_going_count: number;
}

interface NewEventState {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: { city?: string; full_address: string; [key: string]: any } | null;
  maxParticipants: string;
}

// Helper function (can be moved to utils later)
const getEventStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'upcoming':
      return { text: 'Upcoming', style: styles.badgeUpcoming };
    case 'ongoing':
      return { text: 'Ongoing', style: styles.badgeOngoing };
    case 'past':
      return { text: 'Past', style: styles.badgePast };
    default:
      return { text: status || 'N/A', style: styles.badgeDefault };
  }
};

interface GroupEventsSectionProps {
  groupId: string;
  isGroupAdminForThisGroup: boolean;
}

const ITEMS_PER_PAGE = 10;

const GroupEventsSection: React.FC<GroupEventsSectionProps> = ({ groupId, isGroupAdminForThisGroup }) => {
  const { user: currentUser } = useAuth();

  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsPage, setEventsPage] = useState(1);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour later
    location: null,
    maxParticipants: '',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const loadGroupEvents = useCallback(async (refresh = false) => {
    if (!groupId) return;
    if (!refresh && loadingMoreEvents) return; // Prevent multiple loads if already loading more

    const pageToLoad = refresh ? 1 : eventsPage;
    if (refresh) {
      setLoadingEvents(true);
      setHasMoreEvents(true); // Reset on refresh
    } else {
      if (!hasMoreEvents) return; // Don't load more if no more events
      setLoadingMoreEvents(true);
    }

    try {
      const { data, error } = await supabase
        .from('group_events_with_details')
        .select('*')
        .eq('group_id', groupId)
        .order('start_time', { ascending: false })
        .range((pageToLoad - 1) * ITEMS_PER_PAGE, pageToLoad * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (data) {
        setEvents(prevEvents => refresh ? data : [...prevEvents, ...data]);
        setHasMoreEvents(data.length === ITEMS_PER_PAGE);
        if (refresh) setEventsPage(2); // Reset page to 2 for next load
        else setEventsPage(prevPage => prevPage + 1);
      }
    } catch (err: any) {
      console.error('Failed to load group events:', err);
      Alert.alert('Error', 'Failed to load events. ' + err.message);
    } finally {
      if (refresh) setLoadingEvents(false);
      else setLoadingMoreEvents(false);
    }
  }, [groupId, eventsPage, loadingMoreEvents, hasMoreEvents]);

  useEffect(() => {
    loadGroupEvents(true); // Initial load
  }, [groupId]); // Reload if groupId changes

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!currentUser) return Alert.alert('Error', 'You must be logged in to RSVP.');

    try {
      // Check if user already has an RSVP for this event
      const { data: existingRSVP, error: checkError } = await supabase
        .from('group_event_participants')
        .select('event_id')
        .eq('event_id', eventId)
        .eq('user_id', currentUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new RSVP
        throw checkError;
      }

      if (existingRSVP) {
        // Update existing RSVP
        const { error: updateError } = await supabase
          .from('group_event_participants')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('event_id', eventId)
          .eq('user_id', currentUser.id);
        if (updateError) throw updateError;
      } else {
        // Create new RSVP
        const { error: insertError } = await supabase
          .from('group_event_participants')
          .insert({ event_id: eventId, user_id: currentUser.id, status });
        if (insertError) throw insertError;
      }
      Alert.alert('Success', 'RSVP updated!');
      loadGroupEvents(true); // Refresh events to show updated participant counts/status
    } catch (error: any) {
      console.error('Error handling RSVP:', error);
      Alert.alert('Error', `Failed to update RSVP: ${error.message}`);
    }
  };

  const resetNewEventDetails = () => {
    setNewEvent({
      title: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
      location: null,
      maxParticipants: '',
    });
  };

  const validateEventDetails = () => {
    if (!newEvent.title.trim()) return 'Title is required.';
    if (newEvent.endTime <= newEvent.startTime) return 'End time must be after start time.';
    if (newEvent.maxParticipants && parseInt(newEvent.maxParticipants, 10) <= 0) return 'Max participants must be a positive number.';
    return null;
  };

  const handleCreateEvent = async () => {
    if (!currentUser || !groupId) return;
    const validationError = validateEventDetails();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    setSubmittingEvent(true);
    try {
      const { error } = await supabase.from('group_events').insert({
        group_id: groupId,
        created_by: currentUser.id,
        title: newEvent.title,
        description: newEvent.description,
        start_time: newEvent.startTime.toISOString(),
        end_time: newEvent.endTime.toISOString(),
        location: newEvent.location,
        max_participants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants, 10) : null,
      });
      if (error) throw error;
      Alert.alert('Success', 'Event created successfully!');
      setShowCreateEvent(false);
      resetNewEventDetails();
      loadGroupEvents(true); // Refresh events list
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', `Failed to create event: ${error.message}`);
    } finally {
      setSubmittingEvent(false);
    }
  };

  const onChangeStartDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || newEvent.startTime;
    setShowStartDatePicker(Platform.OS === 'ios');
    setNewEvent(prev => ({ ...prev, startTime: currentDate }));
    if (currentDate > newEvent.endTime) {
      setNewEvent(prev => ({ ...prev, endTime: new Date(currentDate.getTime() + 60 * 60 * 1000) }));
    }
  };

  const onChangeEndDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || newEvent.endTime;
    setShowEndDatePicker(Platform.OS === 'ios');
    setNewEvent(prev => ({ ...prev, endTime: currentDate }));
  };

  const renderEvent = ({ item }: { item: GroupEvent }) => {
    const userRSVP = item.participants?.find(p => p.user?.id === currentUser?.id)?.status;
    const statusBadge = getEventStatusBadge(item.event_status);

    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={[styles.badgeBase, statusBadge.style]}><Text style={styles.badgeText}>{statusBadge.text}</Text></View>
        <Text style={styles.eventTime}> 
          {new Date(item.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} - 
          {new Date(item.end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </Text>
        {item.location?.full_address && <Text style={styles.eventLocation}><Ionicons name="location-outline" size={14} /> {item.location.full_address}</Text>}
        {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
        <Text style={styles.eventParticipants}>{item.participants_going_count || 0} going</Text>
        
        <View style={styles.rsvpContainer}>
          <TouchableOpacity 
            style={[styles.rsvpButton, userRSVP === 'going' && styles.rsvpButtonActive]} 
            onPress={() => handleRSVP(item.id, 'going')}>
            <Text style={[styles.rsvpButtonText, userRSVP === 'going' && styles.rsvpButtonTextActive]}>Going</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rsvpButton, userRSVP === 'maybe' && styles.rsvpButtonActive]} 
            onPress={() => handleRSVP(item.id, 'maybe')}>
            <Text style={[styles.rsvpButtonText, userRSVP === 'maybe' && styles.rsvpButtonTextActive]}>Maybe</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rsvpButton, userRSVP === 'not_going' && styles.rsvpButtonActive]} 
            onPress={() => handleRSVP(item.id, 'not_going')}>
            <Text style={[styles.rsvpButtonText, userRSVP === 'not_going' && styles.rsvpButtonTextActive]}>Not Going</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loadingEvents && eventsPage === 1) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />;
  }

  return (
    <View style={styles.container}>
      {isGroupAdminForThisGroup && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateEvent(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      )}

      {events.length === 0 && !loadingEvents ? (
        <Text style={styles.emptyText}>No events found for this group.</Text>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          onEndReached={() => loadGroupEvents()} // Load more when end is reached
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMoreEvents ? <ActivityIndicator size="small" color="#007AFF" /> : null}
          // scrollEnabled prop will be managed by parent if needed for specific layouts, defaults to true here
        />
      )}
       {!loadingMoreEvents && !hasMoreEvents && events.length > 0 && (
          <Text style={styles.noMoreItems}>No more events to load.</Text>
        )}

      {/* Create Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateEvent}
        onRequestClose={() => {
          setShowCreateEvent(false);
          resetNewEventDetails();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Title"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Event Description"
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              multiline
            />
            {/* Start Time Picker */}
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>Start: {newEvent.startTime.toLocaleString()}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={newEvent.startTime}
                mode="datetime"
                display="default"
                onChange={onChangeStartDate}
              />
            )}
            {/* End Time Picker */}
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>End: {newEvent.endTime.toLocaleString()}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={newEvent.endTime}
                mode="datetime"
                display="default"
                onChange={onChangeEndDate}
                minimumDate={newEvent.startTime} // End time cannot be before start time
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Location (e.g., City or Full Address)"
              value={newEvent.location?.full_address || ''}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: { full_address: text } })}
            />
            <TextInput
              style={styles.input}
              placeholder="Max Participants (optional)"
              value={newEvent.maxParticipants}
              onChangeText={(text) => setNewEvent({ ...newEvent, maxParticipants: text })}
              keyboardType="numeric"
            />
            <TouchableOpacity 
                style={[styles.modalButton, submittingEvent && styles.disabledButton]} 
                onPress={handleCreateEvent} 
                disabled={submittingEvent}
            >
              {submittingEvent ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Create Event</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowCreateEvent(false);
                resetNewEventDetails();
              }}
              disabled={submittingEvent}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Add extensive styling (copied and adapted from GroupDetails where applicable)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10, // Padding can be handled by parent if needed
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#eef5ff',
    borderRadius: 8,
    marginVertical: 10,
    marginHorizontal: 10, // Added horizontal margin
    justifyContent: 'center',
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10, // Added horizontal margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  eventParticipants: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 10,
  },
  rsvpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  rsvpButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  rsvpButtonActive: {
    backgroundColor: '#007AFF',
  },
  rsvpButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  rsvpButtonTextActive: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  noMoreItems: {
    textAlign: 'center',
    paddingVertical: 10,
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'stretch', // Changed from 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Badge Styles
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start', // Make badge only as wide as its content
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeUpcoming: {
    backgroundColor: '#ffc107', // Amber
  },
  badgeOngoing: {
    backgroundColor: '#28a745', // Green
  },
  badgePast: {
    backgroundColor: '#6c757d', // Grey
  },
  badgeDefault: {
    backgroundColor: '#17a2b8', // Info Blue
  },
});

export default GroupEventsSection;
