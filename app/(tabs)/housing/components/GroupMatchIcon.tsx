import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';

/**
 * GroupMatchIcon - visually indicates a group-matchable listing (no text, icon only)
 * Accessibility: has label for screen readers
 */
const GroupMatchIcon = ({ size = 22, color = '#007AFF', style = {} }) => (
  <View
    style={[styles.iconContainer, style]}
    accessible
    accessibilityLabel="Group match available"
    accessibilityRole="image"
  >
    <Users size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: '#E6F0FF',
    borderRadius: 16,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginRight: 4,
  },
});

export default GroupMatchIcon;
