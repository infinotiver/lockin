import { View, Text, Pressable } from 'react-native'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { useRouter } from 'expo-router'

const onboarding = () => {
  const [loading, setLoading] = useState(true)
  const isLoaded = true;
  const router = useRouter();
  const onPressPlaceholder = () => {
    // if (isLoaded) {
    //   setLoading(false)
    // }
    // else if (!isLoaded) {
    //   setLoading(true)
    // }
    router.navigate('/(auth)/sign-in')
  }

  return (
    <View>
      <Text>Placeholder</Text>
      <Button
        onPress={onPressPlaceholder}
        label='Teen setup'
        loadingLabel='Loading...'
        loading={loading}
        disabled={!isLoaded}
        fullWidth
      />
    </View>
  )
}

export default onboarding
