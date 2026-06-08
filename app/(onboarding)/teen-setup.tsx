import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Pressable } from 'react-native'

const teenSetup = () => {
  const router = useRouter();
  return (
    <View>
      <Text></Text>
      <Pressable
        onPress={() => { router.navigate('/(onboarding)') }}
      >
      <Text>index</Text>
      </Pressable>
    </View>
  )
}

export default teenSetup
