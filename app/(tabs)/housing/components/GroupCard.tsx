import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform,
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
  onGroupHover?: () => void;
  cardWidth?: number;
}

export default function GroupCard({ group, onJoinGroup, index = 0, onGroupHover, cardWidth }: GroupCardProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  // Hover animation (web)
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

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

  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: hovered ? -20 : 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();
  }, [hovered, hoverAnim]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper to get initials from first and last name
  function getInitials(first: string | undefined, last: string | undefined): string {
    const f = first ? first[0].toUpperCase() : '';
    const l = last ? last[0].toUpperCase() : '';
    return f + l;
  }

  // Helper to get a color from a string (for avatar placeholder diversity)
  function getColorForString(str: string): string {
    // Simple hash function for color
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate color
    const color = `hsl(${hash % 360},70%,60%)`;
    return color;
  }

  return (
  
  // @ts-ignore
    <Animated.View
      style={[
        styles.container,
        cardWidth ? { width: cardWidth, minWidth: cardWidth, maxWidth: cardWidth } : {},
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
            { translateX: hoverAnim },
          ]
        }
      ]}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => {
          setHovered(true);
          if (onGroupHover) onGroupHover();
        },
        onMouseLeave: () => setHovered(false)
      } : {})}
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
            .filter(member => member.status === 'approved' && member.user_profile)
            .slice(0, 5)
            .map((member, i) => {
              const avatarUrl = member.user_profile!.avatar_url;
              const firstName = (member.user_profile as any).first_name || '';
              const lastName = (member.user_profile as any).last_name || '';
              const initials = getInitials(firstName, lastName);
              const [avatarError, setAvatarError] = useState(false);
              const bgColor = getColorForString(firstName + lastName);
              return avatarUrl && !avatarError ? (
                <Image
                  key={member.id}
                  source={{ uri: avatarUrl }}
                  style={[styles.smallAvatar, { marginLeft: i === 0 ? 0 : -12 }]}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View
                  key={member.id}
                  style={[styles.smallAvatar, { marginLeft: i === 0 ? 0 : -12, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{initials}</Text>
                </View>
              );
            })}
          {/* Adjust the count for the '+N' indicator based on the same filter */}
          {group.members.filter(m => m.status === 'approved' && m.user_profile?.avatar_url).length > 5 && (
            <View style={[styles.smallAvatar, styles.moreMembersIndicator, { marginLeft: -12 }]}>
              <Text style={styles.moreMembersText}>
                +{group.members.filter(m => m.status === 'approved' && m.user_profile?.avatar_url).length - 5}
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
