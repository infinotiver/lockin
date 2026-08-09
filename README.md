<div align="center">
  <img src="assets\images\icon.png" alt="LockIn logo" width="120" />

# LockIn

  **Put your money where your goals are.**

  LockIn is a commitment app for people who want to actually follow through. Set a goal, stake some money on it and build habits.

  ![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)


https://github.com/user-attachments/assets/b6135005-e70a-4fcc-9482-1341d50e22fc

</div>

---

## What is a stake?

A **stake** is a goal.

You pick a habit you want to build or break — screen time, coding, anything — set a time period, and lock in an amount of money (currently, only android devices and screen-time stakes are supported). The app tracks your progress automatically. If you follow through, you get your money back. If you don't, it goes to a cause you care about (or one you don't — extra motivation).

For families, parents can create stakes for teens as part of an allowance system. But LockIn works just as well solo. (work in progress)

---


## Screenshots 
| | |
|---|---|
| <img src="https://github.com/user-attachments/assets/d43d3bd7-ba41-49cb-9b31-ca4fd42fcb78" width="360"/> | <img src="https://github.com/user-attachments/assets/5e679334-d300-4b4c-aa23-59ecb5b020a9" width="360"/> |
| <img width="360" src="https://github.com/user-attachments/assets/f1c5ec6d-804f-4e27-9f71-3ffc6eef9a95" /> | <img width="360" src="https://github.com/user-attachments/assets/08d68801-c967-4d36-8ff2-a83cba5584ec" />
## Stack
![Uploading Screenshot_20260804-223446_LockIn.jpg…]()
- [Expo](https://expo.dev) (React Native)
- [Clerk](https://clerk.com) — auth
- [Supabase](https://supabase.com) — database
- Kotlin native modules — android screen-time 

---

## Getting started

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

## Using the App

1. Sign in or create an account
2. Grant Usage Access permission — LockIn needs this to track your screen time automatically. (If you skip it, you can find the same guide anytime under **Settings → Screen time access** in the app.)
3. Create your first stake 
4. Be loyal to your goal (hopefully)
## Roadmap

### ✅ Implemented

- [x] Auth & onboarding (Clerk), with silent family auto-creation for individual users
- [x] Role promotion flow after email verification
- [x] Stake creation & tracking — raw `total_ms` persisted per day, pass/fail derived at runtime
- [x] Android screen time tracking via Kotlin native module 
- [x] Stake evaluator with correct fail/fetch-error/pass priority ordering across days
- [x] Settlements v1 (manual/honor system)
- [x] State-based `ConfirmDialog` (replacing `Alert.alert()`, for web compatibility)
- [x] Pull-to-refresh with dedicated `refreshing` state

### 🚧 In progress / known gaps

- [ ] Fix db schema type mismatches
- [ ] Make quests shareable or assignable to family members

### 🔭 Planned

- [ ] More flexible stake rules
- [ ] Real automatic payments 
- [ ] More stake types and goal templates to choose from
- [ ] Group/family stakes
- [ ] iOS support

---
## Contributors
LockIn was made possible because of these cool people!

<a href="https://github.com/infinotiver/lockin/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=infinotiver/lockin" />
</a>

