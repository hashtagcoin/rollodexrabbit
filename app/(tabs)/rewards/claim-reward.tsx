import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Gift as GiftIcon, Check, CircleAlert as AlertCircle, Wallet, ShieldCheck } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';

export default function ClaimRewardScreen() {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This is a mock function that would normally interact with your backend
  const handleClaim = async () => {
    try {
      setClaiming(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would call Supabase to:
      // 1. Update the user's points
      // 2. Record the claim in a transactions table
      // 3. Update the rewards table with the claimed status
      
      setClaimed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      console.error('Error claiming reward:', e);
    } finally {
      setClaiming(false);
    }
  };

  if (claimed) {
    return (
      <View style={styles.container}>
        <AppHeader title="Claim Reward" />

        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Check size={64} color="#4CD964" />
          </View>
          <Text style={styles.successTitle}>Reward Claimed!</Text>
          <Text style={styles.successDescription}>
            Your $10 service credit has been added to your wallet and is ready to use on your next booking.
          </Text>

          <View style={styles.walletInfoCard}>
            <Wallet size={24} color="#007AFF" />
            <Text style={styles.walletInfoText}>
              Your wallet has been credited with $10
            </Text>
          </View>

          <TouchableOpacity
            style={styles.walletButton}
            onPress={() => router.push('/wallet')}
          >
            <Text style={styles.walletButtonText}>View Your Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backToRewardsButton}
            onPress={() => router.push('/rewards')}
          >
            <Text style={styles.backToRewardsText}>Back to Rewards</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Claim Reward" />

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.rewardCard}>
          <View style={styles.rewardIconContainer}>
            <GiftIcon size={40} color="#FF9500" />
          </View>
          <Text style={styles.rewardTitle}>$10 Service Credit</Text>
          <Text style={styles.rewardDescription}>
            Use this credit on your next service booking
          </Text>
          
          <View style={styles.pointsRequired}>
            <Text style={styles.pointsText}>1000 points</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.termsContainer}>
            <Text style={styles.termsTitle}>Terms & Conditions:</Text>
            <Text style={styles.termsText}>
              • Credit valid for 90 days from claiming{'\n'}
              • Minimum booking value of $50 required{'\n'}
              • Cannot be combined with other offers{'\n'}
              • Valid for service bookings only, not housing
            </Text>
          </View>
        </View>
        
        <View style={styles.securityNote}>
          <View style={styles.securityIconContainer}>
            <ShieldCheck size={20} color="#007AFF" />
          </View>
          <Text style={styles.securityText}>
            This will deduct 1000 points from your rewards balance
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
          onPress={handleClaim}
          disabled={claiming}
        >
          <Text style={styles.claimButtonText}>
            {claiming ? 'Claiming...' : 'Claim Reward'}
          </Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3b30',
  },
  rewardCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  pointsRequired: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9500',
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    width: '100%',
    marginBottom: 24,
  },
  termsContainer: {
    width: '100%',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  securityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  claimButton: {
    height: 56,
    backgroundColor: '#FF9500',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e6f7e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  walletInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1f0ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    gap: 12,
  },
  walletInfoText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  walletButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  walletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backToRewardsButton: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToRewardsText: {
    fontSize: 16,
    color: '#666',
  },
});