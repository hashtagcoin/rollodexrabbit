import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';

export default function Welcome() {
  const navigation = useNavigation();
  
  // Reset scroll position when screen is focused
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    });

    return unsubscribe;
  }, [navigation]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1974&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Rollodex</Text>
        <Text style={styles.subtitle}>
          Connect with NDIS services, find accessible housing, and join a community that understands you.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1974&auto=format&fit=crop' }}
                style={styles.featureImage}
              />
            </View>
            <Text style={styles.featureTitle}>Find Services</Text>
            <Text style={styles.featureText}>Discover and book NDIS services that match your needs</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop' }}
                style={styles.featureImage}
              />
            </View>
            <Text style={styles.featureTitle}>Housing</Text>
            <Text style={styles.featureText}>Explore accessible housing options in your area</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop' }}
                style={styles.featureImage}
              />
            </View>
            <Text style={styles.featureTitle}>Community</Text>
            <Text style={styles.featureText}>Connect with others and share experiences</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/sign-up')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    flex: 1,
    padding: 24,
    marginTop: -40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    overflow: 'hidden',
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttons: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});