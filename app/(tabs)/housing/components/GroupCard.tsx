import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Animated, 
  Easing,
  ScrollView,
  Alert
} from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { HousingGroup } from '../types/housing';

// Props type for the component
interface GroupCardProps {
  group: HousingGroup;
  onJoinGroup?: (groupId: string) => void;
  index?: number; // Added index for staggered animations
}

export default function GroupCard({ group, onJoinGroup, index = 0 }: GroupCardProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Staggered animation for multiple cards
    const delay = index * 100;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim, index]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => onJoinGroup?.(group.id)}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{group.description}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Users size={16} color="#555" />
            <Text style={styles.statText}>
              {group.current_members}/{group.max_members} members
            </Text>
          </View>
          
          <View style={styles.spotLabel}>
            <Text style={styles.spotLabelText}>
              {group.max_members - group.current_members} spots left
            </Text>
          </View>
        </View>

        {/* Overlapping Avatars Row */}
        <View style={styles.membersRow}>
          {group.members
            // Filter for approved members WITH an avatar_url
            .filter(member => member.status === 'approved' && member.user_profile.avatar_url)
            .slice(0, 5) // Limit to first 5 members
            .map((member, i) => (
              <Image
                key={member.id}
                // Explicitly handle null case for TypeScript, even though filter prevents it
                source={member.user_profile.avatar_url ? { uri: member.user_profile.avatar_url } : undefined}
                // Add a simple fallback mechanism or placeholder source if needed
                // onError={(e) => console.log('Avatar load error:', e.nativeEvent.error)}
                style={[styles.smallAvatar, { marginLeft: i === 0 ? 0 : -12 }]} // Overlap effect
              />
            ))}
          {/* Adjust the count for the '+N' indicator based on the same filter */}
          {group.members.filter(m => m.status === 'approved' && m.user_profile.avatar_url).length > 5 && (
            <View style={[styles.smallAvatar, styles.moreMembersIndicator, { marginLeft: -12 }]}>
              <Text style={styles.moreMembersText}>
                +{group.members.filter(m => m.status === 'approved' && m.user_profile.avatar_url).length - 5}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => onJoinGroup?.(group.id)}
        >
          <Text style={styles.viewButtonText}>View Group</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  spotLabel: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spotLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  membersRow: {
    marginBottom: 16,
    flexDirection: 'row', // Arrange avatars horizontally
    alignItems: 'center', // Align avatars vertically
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16, // Make it circular
    borderWidth: 1.5,
    borderColor: '#fff', // White border to separate overlapping images
    backgroundColor: '#e0e0e0', // Placeholder background
  },
  moreMembersIndicator: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMembersText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
