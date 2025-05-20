import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';

export default function ServiceAgreementScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Service Agreement" showBackButton />
      <View style={styles.content}>
        <Text style={styles.title}>Service Agreement</Text>
        <Text style={styles.message}>
          Signature capture is not available on the web. Please use the mobile app to sign service agreements.
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
});
