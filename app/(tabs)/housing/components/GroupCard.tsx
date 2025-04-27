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

        <View style={styles.membersRow}>
          <View style={styles.membersScrollView}>
            {group.members
              .filter(member => member.status === 'approved')
              .map((member, i) => (
                <View key={member.id} style={styles.avatarContainer}>
                  <Image
                    source={{ uri: member.user_profile.avatar_url || `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${10 + i}.jpg` }}
                    style={styles.avatar}
                  />
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.is_admin ? (
                      <Text style={styles.adminName}>
                        {member.user_profile.first_name}
                      </Text>
                    ) : (
                      member.user_profile.first_name
                    )}
                  </Text>
                </View>
              ))}
          </View>
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
  },
  membersScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    width: 60,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  memberName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    width: 60,
  },
  adminName: {
    fontWeight: '600',
    color: '#007AFF',
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
