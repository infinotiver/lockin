import { Text, View } from '@/components/Themed'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'

export default function TabOneScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Successful</Text>
      <Pressable onPress={() => router.push('/(auth)/sign-up')}>
        <Text>Go to Sign Up</Text>
      </Pressable>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
