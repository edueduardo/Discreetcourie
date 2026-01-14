# Discreet Courier Mobile App

React Native / Expo app for Discreet Courier drivers.

## Features

- 📱 **Login/Auth** - Supabase authentication
- 📊 **Dashboard** - Real-time stats from database
- 📦 **Deliveries** - View, filter, and manage deliveries
- 📍 **GPS Tracking** - Real-time location tracking with route history
- 🔔 **Push Notifications** - Receive delivery updates
- 🌙 **Dark Mode** - Professional dark theme

## Setup

```bash
# Install dependencies
npm install

# Start Expo
npm start

# Or run on specific platform
npm run android
npm run ios
```

## Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## GPS Tracking

The app includes real-time GPS tracking that:
- Tracks driver location every 3 seconds or 10 meters
- Shows route history on map
- Calculates distance, duration, and average speed
- Saves location to database for client visibility

## Push Notifications

Uses Expo Notifications for:
- New delivery assignments
- Status updates
- Client messages

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Project Structure

```
mobile-app/
├── App.tsx              # Main entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── src/
    ├── lib/
    │   └── supabase.ts  # Supabase client
    └── screens/
        ├── LoginScreen.tsx
        ├── HomeScreen.tsx
        ├── DeliveriesScreen.tsx
        ├── DeliveryDetailScreen.tsx
        ├── TrackingScreen.tsx
        └── ProfileScreen.tsx
```
