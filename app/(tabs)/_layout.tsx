import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Tabs, usePathname } from 'expo-router'; 
import { House, User, Users, Search, Wallet } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { navigateToTab, resetScrollPosition, TabName } from '../../lib/navigationHelpers';

export default function TabLayout() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const initialRenderRef = useRef(true);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        setUserName(profile?.full_name);
        setUserRole(profile?.role || 'participant');
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }

    loadUserProfile();
  }, []);

  // Reset scroll when navigating between tabs
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Reset scroll position when path changes
    resetScrollPosition();
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000',
          height: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitle: () => null,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e1e1e1',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
          tabBarButton: (props) => (
            <Pressable {...props} onPress={() => navigateToTab('index')} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          tabBarButton: (props) => (
            <Pressable {...props} onPress={() => navigateToTab('discover')} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarButton: (props) => (
            <Pressable {...props} onPress={() => navigateToTab('community')} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
          tabBarButton: (props) => (
            <Pressable {...props} onPress={() => navigateToTab('wallet')} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarButton: (props) => (
            <Pressable {...props} onPress={() => navigateToTab('profile')} />
          ),
        }}
      />
      
      {/* Hidden tabs - still accessible via routing but not shown in tab bar */}
      <Tabs.Screen
        name="housing"
        options={{
          href: null, // This prevents the tab from showing in the tab bar
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null, // This prevents the tab from showing in the tab bar
        }}
      />
      <Tabs.Screen
        name="provider"
        options={{
          href: null, // This prevents the tab from showing in the tab bar
        }}
      />
      {/* Removed the chat tab as it's a standalone route, not a tab */}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  name: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
});