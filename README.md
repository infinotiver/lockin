# LockIn

Put your money where your goals are.

LockIn is a commitment app for people who want to actually follow through. Set a goal, stake some money on it, and prove it with real data. Hit your goal — keep the money. Miss it — it goes to charity. No excuses, no loopholes.

Built for the generation that knows willpower alone isn't enough.

Android only (for now).

---

## What is a stake?

A **stake** is a goal with skin in the game.

You pick a habit you want to build or break — screen time, coding, anything — set a time period, and lock in an amount of money. The app tracks your progress automatically. If you follow through, you get your money back. If you don't, it goes to a cause you care about (or one you don't — extra motivation).

For families, parents can create stakes for teens as part of an allowance system. But LockIn works just as well solo.

---

## Stack

- [Expo](https://expo.dev) (React Native)
- [Clerk](https://clerk.com) — auth
- [Supabase](https://supabase.com) — database
- Kotlin native module — Android screen time via `UsageStatsManager`
- WorkManager — background sync

---

## Getting started

### Prerequisites

- Node 20+
- pnpm
- Android device or emulator
- EAS CLI (`npm i -g eas-cli`)

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_KEY_BASE64=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

### Run (development build)

```bash
# First time — build the dev client via EAS
eas build --platform android --profile development

# After installing the APK on your device
npx expo start --dev-client

# Forward Metro over USB (recommended)
adb reverse tcp:8081 tcp:8081
# Then enter http://127.0.0.1:8081 in the dev client
```

## Permissions

The app requires **Usage Access** (`PACKAGE_USAGE_STATS`) to read screen time data. Users are walked through granting this during onboarding. It requires explicit action in Android settings — the app never grants it silently.

---

## Status

Active development. Supabase integration and payment flows are in progress.

## Contributors
LockIn was made possible because of these cool people!

<a href="https://github.com/infinotiver/lockin/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=infinotiver/lockin" />
</a>

