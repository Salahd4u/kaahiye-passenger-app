import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  // Expo Router owns navigation via the `app/` directory; this component is a
  // lightweight fallback for environments that mount App.tsx directly.
  const auth = useAuthStore.getState();

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {auth.isAuthenticated && <Text>Welcome to Kaahiye Rider</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
