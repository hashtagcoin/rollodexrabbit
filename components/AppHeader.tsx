import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { router, useNavigation, usePathname } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Bell } from 'lucide-react-native';
import NotificationBell from './NotificationBell';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function AppHeader({
  title,
  showBackButton = true,
  onBackPress,
  rightElement,
}: AppHeaderProps) {
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

      // Get user profile to retrieve avatar
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

  // Custom back navigation handler
  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      // Use custom back handler if provided
      onBackPress();
      return;
    }

    // Check if we can go back in navigation history
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If we can't go back, determine what tab we're in and go to its main screen
      if (pathname.includes('/community')) {
        router.replace('/(tabs)/community');
      } else if (pathname.includes('/discover')) {
        router.replace('/(tabs)/discover');
      } else if (pathname.includes('/wallet')) {
        router.replace('/(tabs)/wallet');
      } else if (pathname.includes('/profile')) {
        router.replace('/(tabs)/profile');
      } else if (pathname.includes('/housing')) {
        router.replace('/(tabs)/housing');
      } else {
        // Default to home
        router.replace('/');
      }
    }
    
    // Reset scroll position
    setTimeout(() => {
      window.scrollTo?.(0, 0);
    }, 50);
  }, [navigation, pathname, onBackPress]);

  return (
    <View style={styles.header}>
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
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>

        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <NotificationBell />
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.replace('/(tabs)/profile')}
                accessibilityLabel="Profile"
                accessibilityHint="Navigate to your profile"
              >
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={styles.profilePlaceholder} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: 40,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
  },
});