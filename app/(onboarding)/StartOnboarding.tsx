import { View, Text, Animated } from 'react-native'
import { Button } from '@/components/ui/Button'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import commonTheme from '@/constants/theme'
import { useColors } from '@/hooks/useColors'
import { AuthCard } from '@/components/auth/AuthCard'
import { ViewWrapper } from '@/components/onboarding/ViewWrapper'
import { OnboardingTitle } from '@/components/onboarding/OnboardingTitle'

const StartOnboarding = () => {
  const router = useRouter()
  const colors = useColors()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleRoleSelect = async (role: 'individual' | 'teen') => {
    setLoading(true)
    try {
      // getToken() returns the current session JWT
      // this is what we send in the Authorization header so the server knows who we are
      const token = await getToken()

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const body = await res.json()
        console.error('Role API error:', res.status, body)
        throw new Error('Failed to set role')
      }

      // role is set in Clerk, now navigate to role-specific onboarding
      router.push(role === 'individual' ? '/(onboarding)/individual' : '/(onboarding)/teen')
    } catch (e) {
      console.error(e)
      // TODO: show error to user
    } finally {
      setLoading(false)
    }
  }

  return (
    <ViewWrapper>
      <Animated.Text
        style={[
          commonTheme.text.pageTitle,
          {
            color: colors.text,
            fontFamily: commonTheme.font.bold,
            fontSize: commonTheme.fontSize["8xl"],
            textAlign: 'center',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        Get started
      </Animated.Text>
      <AuthCard>
        <View style={{ gap: commonTheme.space.xs }}>
          <OnboardingTitle>Choose a role</OnboardingTitle>
          <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
            This determines what you can do in the app.
          </Text>
        </View>
        <Button
          onPress={() => handleRoleSelect('individual')}
          variant='secondary'
          label='Individual'
          loading={loading}
          disabled={loading}
          fullWidth
        />
        <Button
          onPress={() => handleRoleSelect('teen')}
          variant='secondary'
          label='Teen'
          loading={loading}
          disabled={loading}
          fullWidth
        />
      </AuthCard>
    </ViewWrapper>
  )
}

export default StartOnboarding
