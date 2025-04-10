import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define the accessibility settings type
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  simplifiedUI: boolean;
  screenReaderOptimized: boolean;
  reduceMotion: boolean;
  voiceNavigation: boolean;
}

// Define the context type
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (setting: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
  fontSizeMultiplier: number;
  isLoading: boolean;
}

// Default settings
const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  simplifiedUI: false,
  screenReaderOptimized: false,
  reduceMotion: false,
  voiceNavigation: false,
};

// Create the context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'rollodex_accessibility_settings';

// Provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
      }
    };

    if (!isLoading) {
      saveSettings();
    }
  }, [settings, isLoading]);

  // Update a single setting
  const updateSetting = (setting: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  // Reset all settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // Calculate font size multiplier based on settings
  const getFontSizeMultiplier = () => {
    if (settings.largeText) {
      return 1.3; // 30% larger text
    }
    return 1.0; // Default size
  };

  // Context value
  const value = {
    settings,
    updateSetting,
    resetSettings,
    fontSizeMultiplier: getFontSizeMultiplier(),
    isLoading,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use the accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Helper function to get high contrast colors
export const getHighContrastColors = (isDarkMode: boolean, isHighContrast: boolean) => {
  // Default colors
  const defaultColors = {
    primary: '#0055FF',
    background: isDarkMode ? '#121212' : '#FFFFFF',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    border: isDarkMode ? '#2C2C2C' : '#E1E1E1',
    notification: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
    error: '#FF3B30',
    info: '#0A84FF',
  };

  // High contrast colors
  const highContrastColors = {
    primary: '#0070FF', // More vibrant blue
    background: isDarkMode ? '#000000' : '#FFFFFF',
    card: isDarkMode ? '#000000' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    border: isDarkMode ? '#FFFFFF' : '#000000',
    notification: '#FF0000', // Pure red
    success: '#00FF00', // Pure green
    warning: '#FFFF00', // Pure yellow
    error: '#FF0000', // Pure red
    info: '#00FFFF', // Cyan
  };

  return isHighContrast ? highContrastColors : defaultColors;
};

// Helper component for text with accessibility settings applied
export const AccessibleText: React.FC<{
  children: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}> = ({ children, style, accessibilityLabel, accessibilityHint, testID }) => {
  const { fontSizeMultiplier, settings } = useAccessibility();
  
  // Apply font size multiplier to the fontSize in style
  const getAccessibleStyle = () => {
    if (!style) return { fontSize: 16 * fontSizeMultiplier };
    
    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    const fontSize = baseStyle.fontSize || 16;
    
    return {
      ...baseStyle,
      fontSize: fontSize * fontSizeMultiplier,
    };
  };
  
  return (
    <Text
      style={getAccessibleStyle()}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="text"
      accessible={true}
      testID={testID}
    >
      {children}
    </Text>
  );
};

// Import Text at the end to avoid circular dependency
import { Text } from 'react-native';
