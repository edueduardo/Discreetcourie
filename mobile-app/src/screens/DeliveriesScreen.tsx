import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Delivery {
  id: string;
  tracking_code: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  price: number;
  created_at: string;
  client_name?: string;
}

export default function DeliveriesScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const statusColors: Record<string, string> = {
    pending: '#eab308',
    confirmed: '#3b82f6',
    in_transit: '#8b5cf6',
    delivered: '#22c55e',
    failed: '#ef4444',
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, searchQuery, activeFilter]);

  async function fetchDeliveries() {
    setRefreshing(true);
    
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        clients (name)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formattedDeliveries = data.map(d => ({
        ...d,
        client_name: d.clients?.name || 'Unknown',
      }));
      setDeliveries(formattedDeliveries);
    }
    
    setRefreshing(false);
  }

  function filterDeliveries() {
    let filtered = deliveries;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(d => d.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.tracking_code?.toLowerCase().includes(query) ||
        d.client_name?.toLowerCase().includes(query) ||
        d.delivery_address?.toLowerCase().includes(query)
      );
    }

    setFilteredDeliveries(filtered);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetail', { delivery: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.trackingCode}>{item.tracking_code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#64748b' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>📍 From:</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.pickup_address || 'N/A'}</Text>
        </View>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>🎯 To:</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.clientName}>👤 {item.client_name}</Text>
        <Text style={styles.price}>${item.price?.toFixed(2) || '0.00'}</Text>
      </View>

      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search deliveries..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.key && styles.filterTextActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Deliveries List */}
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDelivery}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchDeliveries} tintColor="#3b82f6" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No deliveries found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    color: '#64748b',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  deliveryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingCode: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    color: '#64748b',
    fontSize: 12,
    width: 50,
  },
  addressText: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  clientName: {
    color: '#94a3b8',
    fontSize: 14,
  },
  price: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
});
