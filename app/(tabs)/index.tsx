import { View, Text, Pressable } from 'react-native'
import { useColors } from '@/hooks/useColors'
import { useAuth } from '@clerk/clerk-expo';

const HomeScreen = () => {
  const colors = useColors();
  const { signOut } = useAuth();
  return (
    <View style={{backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color: colors.text }}> Placeholder </Text>
      <Pressable
        onPress={ () => signOut() }
      >
        <Text style={{color: colors.text}}> Sign Out </Text>
      </Pressable>
    </View>
  )
}

export default HomeScreen
