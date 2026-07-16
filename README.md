# NUVO Frontend

NUVO is an Expo + React Native finance app focused on budgeting, transaction tracking, analytics, receipt scanning, and LUNA-powered guidance.

This repository contains the mobile frontend, including navigation flows, reusable glassmorphism UI primitives, Redux state, RTK Query data access, and a local in-memory mock backend for offline UI development.

## Stack

- Expo 57
- React Native 0.86
- React 19
- TypeScript
- React Navigation 7
- Redux Toolkit + RTK Query
- Redux Persist
- NativeWind + Tailwind CSS
- Reanimated, Gesture Handler, Bottom Sheet, SVG, Lottie

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Xcode or Android Studio for simulator/emulator workflows
- Expo CLI via `npx expo`

### Install

```bash
npm install
```

### Configure Environment

Copy the example environment file and adjust values if needed:

```bash
cp .env.example .env
```

Default local development uses the in-memory mock backend:

```env
EXPO_PUBLIC_API_MODE=mock
```

To point the app at a real backend instead:

```env
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Run

```bash
npm start
```

Useful scripts:

- `npm run ios`
- `npm run android`
- `npm run web`

## App Flow

The app boots through `App.tsx`, wraps the tree with shared providers, and renders the root navigator.

- `src/providers/AppProviders.tsx` wires fonts, Redux, persistence, safe areas, gesture handling, and bottom sheets.
- `src/navigation/RootNavigator.tsx` switches between auth, onboarding, and the main authenticated app.
- `src/navigation/MainTabNavigator.tsx` exposes five top-level areas: Home, Transactions, Scan, Analytics, and LUNA.

Authentication and onboarding state are derived from persisted Redux state.

## Feature Areas

- `src/features/auth`: welcome, login, register, onboarding, biometrics
- `src/features/home`: dashboard, spend health, quick actions
- `src/features/transactions`: transaction list and transaction-related flows
- `src/features/scan`: receipt scanning and transaction confirmation
- `src/features/analytics`: cash flow, reports, trend and category drilldowns
- `src/features/luna`: advisor chat, goals, insights, savings opportunities
- `src/features/settings`: profile, security, notifications, subscriptions, stop-loss settings
- `src/features/alerts`: alert detail views

## Data Layer

The app uses RTK Query for network access under `src/store/api`.

- In `mock` mode, endpoints execute against `src/mocks/mockServer.ts` and local fixtures.
- In `live` mode, endpoints call the configured backend base URL.
- Persisted slices currently include auth and UI state.

This setup makes it possible to build and test most UI flows without a running backend.

## UI and Styling

- Shared primitives live in `src/components/ui`.
- Higher-level cards and charts live in `src/components/cards` and `src/components/charts`.
- Design tokens are centralized in `src/theme/tokens.ts`.
- Global utility styling is configured through NativeWind and `global.css`.

The visual language is a dark, glassmorphism-based interface with Manrope as the primary typeface.

## Project Structure

```text
.
├── App.tsx
├── assets/
├── src/
│   ├── components/
│   ├── constants/
│   ├── features/
│   ├── hooks/
│   ├── mocks/
│   ├── navigation/
│   ├── providers/
│   ├── store/
│   ├── theme/
│   ├── types/
│   └── utils/
├── global.css
└── tailwind.config.js
```

## Notes

- Expo configuration lives in `app.json`.
- The app is currently configured with a custom URI scheme: `nuvo://`.
- The repository includes a local mock server to keep frontend work unblocked.
- If you are updating Expo-specific behavior, use the Expo 57 documentation to match the installed SDK.