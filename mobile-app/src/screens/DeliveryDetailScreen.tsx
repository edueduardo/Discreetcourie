import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const statusSteps = ['pending', 'confirmed', 'in_transit', 'delivered'];

export default function DeliveryDetailScreen({ route, navigation }: any) {
  const { delivery } = route.params;
  const [currentStatus, setCurrentStatus] = useState(delivery.status);
  const [updating, setUpdating] = useState(false);

  const statusColors: Record<string, string> = {
    pending: '#eab308',
    confirmed: '#3b82f6',
    in_transit: '#8b5cf6',
    delivered: '#22c55e',
    failed: '#ef4444',
  };

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    
    try {
      const updateData: any = { status: newStatus };
      
      // If marking as delivered, add timestamp and location
      if (newStatus === 'delivered') {
        const location = await Location.getCurrentPositionAsync({});
        updateData.delivered_at = new Date().toISOString();
        updateData.delivery_latitude = location.coords.latitude;
        updateData.delivery_longitude = location.coords.longitude;
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', delivery.id);

      if (error) throw error;

      setCurrentStatus(newStatus);
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  }

  function getNextStatus() {
    const currentIndex = statusSteps.indexOf(currentStatus);
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1];
    }
    return null;
  }

  const nextStatus = getNextStatus();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.trackingCode}>{delivery.tracking_code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[currentStatus] }]}>
          <Text style={styles.statusText}>{currentStatus}</Text>
        </View>
      </View>

      {/* Status Progress */}
      <View style={styles.progressContainer}>
        {statusSteps.map((step, index) => {
          const isCompleted = statusSteps.indexOf(currentStatus) >= index;
          const isCurrent = currentStatus === step;
          return (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                isCompleted && styles.progressDotCompleted,
                isCurrent && styles.progressDotCurrent,
              ]}>
                {isCompleted && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={[
                styles.progressLabel,
                isCompleted && styles.progressLabelCompleted,
              ]}>
                {step.replace('_', ' ')}
              </Text>
              {index < statusSteps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  isCompleted && styles.progressLineCompleted,
                ]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Pickup</Text>
          <Text style={styles.detailValue}>{delivery.pickup_address || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🎯 Delivery</Text>
          <Text style={styles.detailValue}>{delivery.delivery_address || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👤 Client</Text>
          <Text style={styles.detailValue}>{delivery.client_name || 'Unknown'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Price</Text>
          <Text style={[styles.detailValue, styles.priceText]}>
            ${delivery.price?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {delivery.special_instructions && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📝 Instructions</Text>
            <Text style={styles.detailValue}>{delivery.special_instructions}</Text>
          </View>
        )}

        {delivery.no_trace && (
          <View style={styles.noTraceBadge}>
            <Text style={styles.noTraceText}>🔒 NO-TRACE MODE ACTIVE</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {nextStatus && currentStatus !== 'delivered' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => updateStatus(nextStatus)}
            disabled={updating}
          >
            <Text style={styles.actionButtonText}>
              {updating ? 'Updating...' : `Mark as ${nextStatus.replace('_', ' ')}`}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Tracking')}
        >
          <Text style={styles.secondaryButtonText}>📍 Start GPS Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>📷 Take Photo Proof</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>💬 Send SMS Update</Text>
        </TouchableOpacity>

        {currentStatus !== 'delivered' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => {
              Alert.alert(
                'Mark as Failed',
                'Are you sure you want to mark this delivery as failed?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Yes, Mark Failed', onPress: () => updateStatus('failed'), style: 'destructive' },
                ]
              );
            }}
          >
            <Text style={styles.dangerButtonText}>❌ Mark as Failed</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  trackingCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCompleted: {
    backgroundColor: '#22c55e',
  },
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  checkMark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  progressLabelCompleted: {
    color: '#22c55e',
  },
  progressLine: {
    position: 'absolute',
    top: 15,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#334155',
    zIndex: -1,
  },
  progressLineCompleted: {
    backgroundColor: '#22c55e',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 5,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
  },
  priceText: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 20,
  },
  noTraceBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginTop: 10,
  },
  noTraceText: {
    color: '#ef4444',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
  },
});
