import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { router, useNavigation, usePathname } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Bell, type LucideIcon } from 'lucide-react-native'; 
import * as LucideIcons from 'lucide-react-native'; 
import NotificationBell from './NotificationBell';

export interface HeaderAction {
  iconName: keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'Icon' | 'LucideIcon'>; 
  onPress: () => void;
  isVisible?: boolean;
  iconSize?: number;
  iconColor?: string;
}

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: HeaderAction[];
}

export default function AppHeader({
  title,
  showBackButton = true,
  onBackPress,
  rightActions,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      if (pathname.includes('/community')) router.replace('/(tabs)/community');
      else if (pathname.includes('/discover')) router.replace('/(tabs)/discover');
      else if (pathname.includes('/wallet')) router.replace('/(tabs)/wallet');
      else if (pathname.includes('/profile')) router.replace('/(tabs)/profile');
      else if (pathname.includes('/housing')) router.replace('/(tabs)/housing');
      else router.replace('/');
    }
    setTimeout(() => {
      window.scrollTo?.(0, 0);
    }, 50);
  }, [navigation, pathname, onBackPress]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              accessibilityLabel="Back"
              accessibilityHint="Navigate to the previous screen"
            >
              <ArrowLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.titleSection}>
          {title ? <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text> : null}
        </View>

        <View style={styles.rightSection}>
          {rightActions && rightActions.map((action, index) => {
            if (action.isVisible === false) return null; 
            
            const IconComponent = LucideIcons[action.iconName] as LucideIcon | undefined;
            if (!IconComponent) {
              console.warn(`Icon not found: ${action.iconName}`);
              return <Text key={`action-${index}-fallback`}>?</Text>; 
            }

            return (
              <TouchableOpacity
                key={`action-${index}`}
                style={styles.actionButton}
                onPress={action.onPress}
                accessibilityLabel={action.iconName}
              >
                <IconComponent 
                  size={action.iconSize || 24} 
                  color={action.iconColor || '#1a1a1a'} 
                />
              </TouchableOpacity>
            );
          })}
          {/* User Avatar */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile') }
            accessibilityLabel="Go to profile"
          >
            <Image
              source={avatarUrl && typeof avatarUrl === 'string' && avatarUrl.length > 0 && !avatarUrl.startsWith('file:///')
                ? { uri: avatarUrl }
                : require('../assets/default-avatar.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <NotificationBell />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    // paddingTop is now handled dynamically with safe area insets
    // paddingTop: безопаснаяЗонаСверху(), 
    paddingBottom: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50, 
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 3, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5, 
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backButton: {
    padding: 5, 
  },
  title: {
    fontSize: 18,
    fontWeight: '600', 
    color: '#1a1a1a',
    textAlign: 'center',
  },
  actionButton: {
    padding: 8, 
    marginLeft: 8, 
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarButton: {
    padding: 4,
    marginRight: 8,
  },
});

function безопаснаяЗонаСверху() {
  const { Platform, StatusBar } = require('react-native');
  return Platform.OS === 'android' ? StatusBar.currentHeight || 10 : (Platform.OS === 'ios' ? 20 : 10);
}