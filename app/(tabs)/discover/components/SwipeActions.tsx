import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, X } from 'lucide-react-native';

interface SwipeActionsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeActions: React.FC<SwipeActionsProps> = ({
  onSwipeLeft,
  onSwipeRight,
}) => {
  return (
    <View style={styles.swipeActions}>
      <TouchableOpacity 
        style={styles.swipeActionLeft}
        onPress={onSwipeLeft}
      >
        <X size={40} color="#ff3b30" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.swipeActionRight}
        onPress={onSwipeRight}
      >
        <Heart size={40} color="#4cd964" fill="#4cd964" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  swipeActionLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  swipeActionRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

// Export the component as both a named export and a default export
export { SwipeActions };
export default SwipeActions;