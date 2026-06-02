import { View, Text } from 'react-native'
import { Link } from 'expo-router'

const profile = () => {
  return (
    <View>
    <Text>
    HI
    <Link href="/(auth)/sign-up">Link</Link>
    </Text>

    </View>
  )
}

export default profile
