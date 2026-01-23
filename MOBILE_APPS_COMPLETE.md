# 📱 Mobile Apps Implementation Guide

**Status**: ✅ READY FOR DEVELOPMENT
**SEMANA**: 6
**Apps**: 3 (Driver, Customer, Admin)
**Features**: 12 total
**Platform**: React Native + Expo
**Target**: iOS + Android

---

## 📦 Apps Overview

### 1. Driver Mobile App (6 features)
**Package**: `mobile/apps/driver`
**Users**: Delivery drivers
**Purpose**: Manage deliveries, navigation, and real-time updates

#### Features:
1. **GPS Real-Time Tracking**
   - Background location updates
   - Live tracking for customers
   - Route navigation with turn-by-turn

2. **Photo Upload (Proof of Delivery)**
   - Camera integration
   - Gallery access
   - Image compression
   - Upload to Supabase Storage

3. **Digital Signature Capture**
   - Signature pad
   - Customer name + timestamp
   - Save as image
   - Attach to delivery

4. **Push Notifications**
   - New delivery assignments
   - Route changes
   - Customer messages
   - Emergency alerts

5. **Offline Mode**
   - Local SQLite database
   - Queue actions for sync
   - Works without internet
   - Auto-sync when online

6. **Delivery Management**
   - Accept/reject deliveries
   - Update status (picked up, in transit, delivered)
   - View delivery details
   - Contact customer

---

### 2. Customer Mobile App (4 features)
**Package**: `mobile/apps/customer`
**Users**: End customers
**Purpose**: Track orders, book deliveries, manage account

#### Features:
1. **Real-Time Tracking**
   - Live map with driver location
   - ETA countdown
   - Driver photo & name
   - Contact driver button

2. **New Booking**
   - Quick address search (Google Places)
   - Package details form
   - Price calculation
   - Payment integration (Stripe)

3. **Mobile Payment (Apple Pay/Google Pay)**
   - Stripe payment sheet
   - Saved payment methods
   - Receipt generation
   - Payment history

4. **Push Notifications**
   - Order status updates
   - Driver nearby alerts
   - Delivery completed
   - Promotional messages

---

### 3. Admin Mobile App (2 features)
**Package**: `mobile/apps/admin`
**Users**: Business administrators
**Purpose**: Monitor operations on-the-go

#### Features:
1. **Operations Dashboard**
   - Live delivery count
   - Active drivers
   - Revenue today
   - Pending deliveries
   - Quick stats

2. **Quick Actions**
   - Assign delivery to driver
   - Update delivery status
   - Contact driver/customer
   - View alerts
   - Emergency broadcast

---

## 🏗️ Architecture

```
mobile/
├── package.json                 # Shared dependencies
├── tsconfig.json               # TypeScript config
├── .gitignore                  # Git ignore
│
├── shared/                     # Shared code across all apps
│   ├── api/                    # API client (Supabase)
│   │   ├── auth.ts
│   │   ├── deliveries.ts
│   │   ├── drivers.ts
│   │   └── customers.ts
│   ├── components/             # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── MapView.tsx
│   ├── utils/                  # Utility functions
│   │   ├── location.ts
│   │   ├── storage.ts
│   │   └── notifications.ts
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── apps/
│   ├── driver/                 # Driver App
│   │   ├── app.json
│   │   ├── App.tsx
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── DeliveryListScreen.tsx
│   │   │   ├── DeliveryDetailScreen.tsx
│   │   │   ├── NavigationScreen.tsx
│   │   │   ├── PhotoCaptureScreen.tsx
│   │   │   └── SignatureScreen.tsx
│   │   └── navigation/
│   │       └── AppNavigator.tsx
│   │
│   ├── customer/               # Customer App
│   │   ├── app.json
│   │   ├── App.tsx
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── NewBookingScreen.tsx
│   │   │   ├── TrackingScreen.tsx
│   │   │   ├── PaymentScreen.tsx
│   │   │   └── HistoryScreen.tsx
│   │   └── navigation/
│   │       └── AppNavigator.tsx
│   │
│   └── admin/                  # Admin App
│       ├── app.json
│       ├── App.tsx
│       ├── screens/
│       │   ├── LoginScreen.tsx
│       │   ├── DashboardScreen.tsx
│       │   └── QuickActionsScreen.tsx
│       └── navigation/
│           └── AppNavigator.tsx
│
└── docs/
    ├── SETUP.md
    ├── DRIVER_APP.md
    ├── CUSTOMER_APP.md
    └── ADMIN_APP.md
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install

# Install EAS CLI for builds
npm install -g eas-cli
```

### 2. Configure Environment

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
EXPO_PUBLIC_API_URL=https://your-domain.com/api
```

### 3. Configure Expo Projects

```bash
# Login to Expo
eas login

# Create Expo projects for each app
cd apps/driver && eas build:configure
cd apps/customer && eas build:configure
cd apps/admin && eas build:configure
```

### 4. Run Development

```bash
# Driver app
npm run driver

# Customer app
npm run customer

# Admin app
npm run admin
```

### 5. Build for Production

```bash
# Android
npm run build:driver:android
npm run build:customer:android

# iOS (requires Apple Developer account)
npm run build:driver:ios
npm run build:customer:ios
```

---

## 📱 Key Features Implementation

### GPS Tracking (Driver App)

```typescript
// apps/driver/services/LocationService.ts
import * as Location from 'expo-location'
import { supabase } from '@/shared/api/client'

export class LocationService {
  static async startTracking(driverId: string) {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return

    // Start location updates
    await Location.startLocationUpdatesAsync('background-location', {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 50, // 50 meters
      foregroundService: {
        notificationTitle: 'Delivery Active',
        notificationBody: 'Tracking your location',
      },
    })
  }

  static async updateLocation(lat: number, lng: number, driverId: string) {
    await supabase
      .from('drivers')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', driverId)
  }
}
```

### Photo Capture (Driver App)

```typescript
// apps/driver/screens/PhotoCaptureScreen.tsx
import { Camera } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'

export default function PhotoCaptureScreen({ deliveryId }) {
  const [hasPermission, setHasPermission] = useState(false)
  const cameraRef = useRef(null)

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      })

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('delivery-photos')
        .upload(`${deliveryId}/${Date.now()}.jpg`, photo.base64, {
          contentType: 'image/jpeg',
        })

      if (!error) {
        // Save photo URL to delivery
        await supabase
          .from('deliveries')
          .update({ proof_photo: data.path })
          .eq('id', deliveryId)
      }
    }
  }

  return (
    <Camera ref={cameraRef} style={{ flex: 1 }}>
      <Button onPress={takePicture} title="Capture" />
    </Camera>
  )
}
```

### Digital Signature (Driver App)

```typescript
// apps/driver/screens/SignatureScreen.tsx
import SignatureCanvas from 'react-native-signature-canvas'

export default function SignatureScreen({ deliveryId }) {
  const handleSignature = async (signature: string) => {
    // signature is base64 image
    const { data } = await supabase.storage
      .from('signatures')
      .upload(`${deliveryId}/signature.png`, signature, {
        contentType: 'image/png',
      })

    await supabase
      .from('deliveries')
      .update({
        signature_url: data.path,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
  }

  return (
    <SignatureCanvas
      onOK={handleSignature}
      descriptionText="Sign here"
      clearText="Clear"
      confirmText="Confirm"
      webStyle={`.m-signature-pad {box-shadow: none; border: 1px solid #e8e8e8;}`}
    />
  )
}
```

### Push Notifications

```typescript
// shared/utils/notifications.ts
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  return token
}

// Save token to user profile
export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId)
}
```

### Real-Time Tracking (Customer App)

```typescript
// apps/customer/screens/TrackingScreen.tsx
import MapView, { Marker, Polyline } from 'react-native-maps'
import { useEffect, useState } from 'react'

export default function TrackingScreen({ deliveryId }) {
  const [delivery, setDelivery] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)

  useEffect(() => {
    // Subscribe to delivery updates
    const subscription = supabase
      .channel('delivery-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          setDelivery(payload.new)
        }
      )
      .subscribe()

    // Subscribe to driver location updates
    const driverSub = supabase
      .channel('driver-location')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          setDriverLocation({
            latitude: payload.new.current_lat,
            longitude: payload.new.current_lng,
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      driverSub.unsubscribe()
    }
  }, [deliveryId])

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: delivery?.pickup_lat || 0,
        longitude: delivery?.pickup_lng || 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* Pickup marker */}
      <Marker
        coordinate={{
          latitude: delivery?.pickup_lat,
          longitude: delivery?.pickup_lng,
        }}
        title="Pickup"
        pinColor="green"
      />

      {/* Delivery marker */}
      <Marker
        coordinate={{
          latitude: delivery?.delivery_lat,
          longitude: delivery?.delivery_lng,
        }}
        title="Delivery"
        pinColor="red"
      />

      {/* Driver location */}
      {driverLocation && (
        <Marker coordinate={driverLocation} title="Driver">
          <Image source={require('../assets/car-icon.png')} />
        </Marker>
      )}
    </MapView>
  )
}
```

### Offline Mode (Driver App)

```typescript
// shared/utils/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

interface QueuedAction {
  id: string
  type: 'update_status' | 'upload_photo' | 'add_signature'
  data: any
  timestamp: number
}

export class OfflineQueue {
  static QUEUE_KEY = '@offline_queue'

  static async addToQueue(action: QueuedAction) {
    const queue = await this.getQueue()
    queue.push(action)
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }

  static async getQueue(): Promise<QueuedAction[]> {
    const data = await AsyncStorage.getItem(this.QUEUE_KEY)
    return data ? JSON.parse(data) : []
  }

  static async processQueue() {
    const isConnected = await NetInfo.fetch().then(
      (state) => state.isConnected
    )

    if (!isConnected) return

    const queue = await this.getQueue()

    for (const action of queue) {
      try {
        // Process each action based on type
        switch (action.type) {
          case 'update_status':
            await supabase
              .from('deliveries')
              .update({ status: action.data.status })
              .eq('id', action.data.deliveryId)
            break
          // ... handle other action types
        }

        // Remove from queue after successful processing
        await this.removeFromQueue(action.id)
      } catch (error) {
        console.error('Failed to process action:', error)
      }
    }
  }

  static async removeFromQueue(actionId: string) {
    const queue = await this.getQueue()
    const updated = queue.filter((a) => a.id !== actionId)
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(updated))
  }
}

// Start processing queue when app becomes online
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    OfflineQueue.processQueue()
  }
})
```

---

## 💰 Cost Estimate

- **Expo Account**: Free (for development)
- **EAS Build**: $29/month (for unlimited builds)
- **Apple Developer**: $99/year (for iOS)
- **Google Play**: $25 one-time (for Android)
- **Push Notifications**: Free (Expo Push)
- **Storage (Supabase)**: Included in existing plan

**Total Monthly**: ~$30 (+ $124/year for stores)

---

## 📊 Features Matrix

| Feature | Driver App | Customer App | Admin App |
|---------|-----------|--------------|-----------|
| GPS Tracking | ✅ | ✅ | ✅ (View) |
| Photo Upload | ✅ | ❌ | ❌ |
| Signature | ✅ | ❌ | ❌ |
| Push Notifications | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ❌ | ❌ |
| Real-time Updates | ✅ | ✅ | ✅ |
| Payments | ❌ | ✅ | ❌ |
| Dashboard | ❌ | ❌ | ✅ |

---

## 🔒 Security

- **Authentication**: Supabase Auth with JWT
- **API Communication**: HTTPS only
- **Local Storage**: Encrypted with Expo SecureStore
- **Push Tokens**: Stored securely in database
- **Location Data**: Only shared with authorized users
- **Photo/Signature**: Uploaded to private Supabase bucket

---

## 🎯 Next Steps

1. ✅ Project structure created
2. ⏳ Implement shared components
3. ⏳ Build Driver App screens
4. ⏳ Build Customer App screens
5. ⏳ Build Admin App screens
6. ⏳ Test on iOS + Android
7. ⏳ Submit to App Store + Play Store
8. ⏳ Deploy backend APIs

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

---

**Created**: 2026-01-23
**Status**: Ready for Implementation
**Est. Development Time**: 2-3 weeks per app
