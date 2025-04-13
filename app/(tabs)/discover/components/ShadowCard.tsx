import React, { ReactNode } from 'react';
import { View, Platform, StyleSheet, ViewStyle } from 'react-native';
import { BoxShadow } from 'react-native-shadow';

interface ShadowCardProps {
  children: ReactNode;
  style?: ViewStyle;
  width: number;
  height: number;
  radius?: number;
}

/**
 * ShadowCard component that provides consistent shadows across iOS and Android
 * Uses react-native-shadow for iOS and elevation for Android
 */
const ShadowCard: React.FC<ShadowCardProps> = ({
  children,
  style,
  width,
  height,
  radius = 8,
}) => {
  // Shadow settings
  const shadowOpt = {
    width,
    height,
    color: "#000",
    border: 5,
    radius,
    opacity: 0.1,
    x: 0,
    y: 2,
  };

  // Use different shadow implementations based on platform
  if (Platform.OS === 'ios') {
    return (
      <BoxShadow setting={shadowOpt}>
        <View style={[styles.card, style, { width, height, borderRadius: radius }]}>
          {children}
        </View>
      </BoxShadow>
    );
  } else {
    // Use elevation for Android
    return (
      <View 
        style={[
          styles.card, 
          style, 
          { 
            width, 
            height, 
            borderRadius: radius,
            elevation: 3 
          }
        ]}
      >
        {children}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    overflow: 'hidden',
  }
});

export { ShadowCard };
export default ShadowCard;
