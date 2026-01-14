import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export default function TrackingScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [tracking, setTracking] = useState(false);
  const [routeHistory, setRouteHistory] = useState<LocationData[]>([]);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
  });
  
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    requestPermissions();
    return () => {
      stopTracking();
    };
  }, []);

  async function requestPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for GPS tracking');
      return;
    }

    // Request background permission for continuous tracking
    if (Platform.OS !== 'web') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Background Permission', 'Background location is recommended for accurate tracking');
      }
    }

    // Get initial location
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      timestamp: currentLocation.timestamp,
      speed: currentLocation.coords.speed || 0,
      heading: currentLocation.coords.heading || 0,
    });
  }

  async function startTracking() {
    setTracking(true);
    startTime.current = Date.now();
    setRouteHistory([]);
    setStats({ distance: 0, duration: 0, avgSpeed: 0 });

    // Start watching location
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, // Update every 3 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (newLocation) => {
        const locationData: LocationData = {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          timestamp: newLocation.timestamp,
          speed: newLocation.coords.speed || 0,
          heading: newLocation.coords.heading || 0,
        };

        setLocation(locationData);
        setRouteHistory(prev => {
          const newHistory = [...prev, locationData];
          updateStats(newHistory);
          return newHistory;
        });

        // Center map on current location
        mapRef.current?.animateToRegion({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);

        // Save to database for real-time tracking by clients
        saveLocationToDatabase(locationData);
      }
    );
  }

  function stopTracking() {
    setTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }

  function updateStats(history: LocationData[]) {
    if (history.length < 2) return;

    let totalDistance = 0;
    for (let i = 1; i < history.length; i++) {
      totalDistance += calculateDistance(
        history[i - 1].latitude,
        history[i - 1].longitude,
        history[i].latitude,
        history[i].longitude
      );
    }

    const duration = (Date.now() - startTime.current) / 1000 / 60; // minutes
    const avgSpeed = duration > 0 ? (totalDistance / duration) * 60 : 0; // km/h

    setStats({
      distance: totalDistance,
      duration: Math.round(duration),
      avgSpeed: Math.round(avgSpeed),
    });
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function saveLocationToDatabase(locationData: LocationData) {
    if (!activeDeliveryId) return;

    try {
      await supabase
        .from('delivery_tracking')
        .insert({
          delivery_id: activeDeliveryId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed,
          heading: locationData.heading,
          recorded_at: new Date(locationData.timestamp).toISOString(),
        });
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.latitude || 39.9612,
          longitude: location?.longitude || -82.9988,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {/* Current Location Marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Current Location"
          />
        )}

        {/* Route History */}
        {routeHistory.length > 1 && (
          <Polyline
            coordinates={routeHistory.map(l => ({
              latitude: l.latitude,
              longitude: l.longitude,
            }))}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Stats Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.distance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.duration}</Text>
          <Text style={styles.statLabel}>min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.avgSpeed}</Text>
          <Text style={styles.statLabel}>km/h</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(location?.speed || 0)}</Text>
          <Text style={styles.statLabel}>current</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!tracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startTracking}
          >
            <Text style={styles.buttonText}>▶ Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopTracking}
          >
            <Text style={styles.buttonText}>⏹ Stop Tracking</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Indicator */}
      {tracking && (
        <View style={styles.trackingIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.trackingText}>GPS TRACKING ACTIVE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    flex: 1,
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  controls: {
    padding: 15,
    backgroundColor: '#0f172a',
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trackingIndicator: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  trackingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
