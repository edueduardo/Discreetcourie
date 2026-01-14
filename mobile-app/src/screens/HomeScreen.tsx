import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Stats {
  todayDeliveries: number;
  pendingDeliveries: number;
  completedToday: number;
  revenueToday: number;
}

export default function HomeScreen({ navigation }: any) {
  const [stats, setStats] = useState<Stats>({
    todayDeliveries: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    revenueToday: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setRefreshing(true);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch deliveries
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (deliveries) {
      const todayDeliveries = deliveries.filter(d => 
        new Date(d.created_at) >= today
      );
      const pending = deliveries.filter(d => 
        ['pending', 'confirmed', 'in_transit'].includes(d.status)
      );
      const completed = deliveries.filter(d => 
        d.status === 'delivered' && new Date(d.created_at) >= today
      );
      const revenue = completed.reduce((sum, d) => sum + (d.price || 0), 0);

      setStats({
        todayDeliveries: todayDeliveries.length,
        pendingDeliveries: pending.length,
        completedToday: completed.length,
        revenueToday: revenue,
      });

      setRecentDeliveries(deliveries.slice(0, 5));
    }

    setRefreshing(false);
  }

  const statusColors: Record<string, string> = {
    pending: '#eab308',
    confirmed: '#3b82f6',
    in_transit: '#8b5cf6',
    delivered: '#22c55e',
    failed: '#ef4444',
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#3b82f6" />
      }
    >
      <Text style={styles.greeting}>Welcome back! 👋</Text>
      <Text style={styles.subtitle}>Here's your overview</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#eab308' }]}>{stats.pendingDeliveries}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>${stats.revenueToday}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>New Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Tracking')}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Start GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Send SMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Deliveries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Deliveries</Text>
        {recentDeliveries.length > 0 ? (
          recentDeliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.deliveryCard}
              onPress={() => navigation.navigate('DeliveryDetail', { delivery })}
            >
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryCode}>{delivery.tracking_code}</Text>
                <Text style={styles.deliveryAddress} numberOfLines={1}>
                  {delivery.delivery_address || 'No address'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[delivery.status] || '#64748b' }]}>
                <Text style={styles.statusText}>{delivery.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent deliveries</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 15,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  deliveryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryCode: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deliveryAddress: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
});
