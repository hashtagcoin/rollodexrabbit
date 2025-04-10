import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAccessibility } from '../../../lib/accessibilityContext';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../components/AppHeader';

export default function AccessibilityScreen() {
  const { settings, updateSetting, resetSettings, fontSizeMultiplier } = useAccessibility();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (showResetConfirm) {
      resetSettings();
      setShowResetConfirm(false);
      Alert.alert('Settings Reset', 'Your accessibility settings have been reset to default values.');
    } else {
      setShowResetConfirm(true);
      // Auto-hide the confirmation after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  // Apply font size multiplier to text styles
  const getTextStyle = (baseStyle: any) => {
    return {
      ...baseStyle,
      fontSize: baseStyle.fontSize * fontSizeMultiplier,
    };
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Accessibility" />
      
      <ScrollView style={styles.content}>
        <Text style={getTextStyle(styles.sectionTitle)}>Display Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>High Contrast Mode</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Increases contrast for better visibility
            </Text>
          </View>
          <Switch
            value={settings.highContrast}
            onValueChange={(value) => updateSetting('highContrast', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.highContrast ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle high contrast mode"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>Larger Text</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Increases text size throughout the app
            </Text>
          </View>
          <Switch
            value={settings.largeText}
            onValueChange={(value) => updateSetting('largeText', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.largeText ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle larger text"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>Simplified Interface</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Reduces visual complexity for easier navigation
            </Text>
          </View>
          <Switch
            value={settings.simplifiedUI}
            onValueChange={(value) => updateSetting('simplifiedUI', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.simplifiedUI ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle simplified interface"
          />
        </View>
        
        <Text style={getTextStyle(styles.sectionTitle)}>Motion & Animation</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>Reduce Motion</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Minimizes animations and transitions
            </Text>
          </View>
          <Switch
            value={settings.reduceMotion}
            onValueChange={(value) => updateSetting('reduceMotion', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.reduceMotion ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle reduce motion"
          />
        </View>
        
        <Text style={getTextStyle(styles.sectionTitle)}>Screen Reader Support</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>Screen Reader Optimized</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Enhances compatibility with screen readers
            </Text>
          </View>
          <Switch
            value={settings.screenReaderOptimized}
            onValueChange={(value) => updateSetting('screenReaderOptimized', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.screenReaderOptimized ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle screen reader optimization"
          />
        </View>
        
        <Text style={getTextStyle(styles.sectionTitle)}>Navigation</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={getTextStyle(styles.settingTitle)}>Voice Navigation</Text>
            <Text style={getTextStyle(styles.settingDescription)}>
              Enables voice commands for app navigation
            </Text>
          </View>
          <Switch
            value={settings.voiceNavigation}
            onValueChange={(value) => updateSetting('voiceNavigation', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.voiceNavigation ? '#0055FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            accessibilityLabel="Toggle voice navigation"
          />
        </View>
        
        <View style={styles.resetContainer}>
          <TouchableOpacity 
            style={[
              styles.resetButton,
              showResetConfirm && styles.resetButtonConfirm
            ]}
            onPress={handleReset}
            accessibilityLabel={showResetConfirm ? "Confirm reset settings" : "Reset all settings"}
            accessibilityHint="Double tap to reset all accessibility settings to default values"
          >
            <Ionicons 
              name={showResetConfirm ? "checkmark-circle" : "refresh-circle"} 
              size={24} 
              color={showResetConfirm ? "#FFFFFF" : "#0055FF"} 
            />
            <Text style={[
              getTextStyle(styles.resetText),
              showResetConfirm && styles.resetTextConfirm
            ]}>
              {showResetConfirm ? "Confirm Reset" : "Reset All Settings"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={24} color="#666" />
          <Text style={getTextStyle(styles.infoText)}>
            These settings help make Rollodex more accessible for everyone. Changes are applied immediately and saved for future sessions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#0055FF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  resetContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0055FF',
  },
  resetButtonConfirm: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  resetText: {
    fontSize: 16,
    color: '#0055FF',
    marginLeft: 8,
  },
  resetTextConfirm: {
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 12,
  },
});
