import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, X } from 'lucide-react-native';
import { ShadowCard } from './ShadowCard';

interface SwipeActionsProps {
  onSwipe: (direction: string) => void;
}

const SwipeActions: React.FC<SwipeActionsProps> = ({
  onSwipe,
}) => {
  return (
    <View style={styles.swipeActions}>
      <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
        <TouchableOpacity 
          style={styles.swipeActionLeft}
          onPress={() => onSwipe('left')}
        >
          <X size={40} color="#ff3b30" />
        </TouchableOpacity>
      </ShadowCard>
      
      <ShadowCard width={60} height={60} radius={30} style={styles.actionShadow}>
        <TouchableOpacity 
          style={styles.swipeActionRight}
          onPress={() => onSwipe('right')}
        >
          <Heart size={40} color="#4cd964" fill="#4cd964" />
        </TouchableOpacity>
      </ShadowCard>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    width: '100%',
  },
  actionShadow: {
    backgroundColor: 'transparent',
  },
  swipeActionLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export the component as both a named export and a default export
export { SwipeActions };
export default SwipeActions;