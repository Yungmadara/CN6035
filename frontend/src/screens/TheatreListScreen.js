import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FILTERS = ['Όλα', 'Τραγωδία', 'Κωμωδία', 'Αρχαία', 'Σαίξπηρ'];

export default function TheatreListScreen({ navigation }) {
  const [theatres, setTheatres] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Όλα');
  const { logout, user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async (searchTerm = '') => {
    try {
      const [theatresRes, showsRes] = await Promise.all([
        api.get('/theatres', { params: { search: searchTerm } }),
        api.get('/shows'),
      ]);
      setTheatres(theatresRes.data);
      setAllShows(showsRes.data);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση δεδομένων');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => fetchData(search);

  const filteredTheatres = activeFilter === 'Όλα'
    ? theatres
    : theatres.filter(t =>
        allShows.some(s =>
          s.theatre_id === t.theatre_id &&
          (s.description + ' ' + s.title).toLowerCase().includes(activeFilter.toLowerCase())
        )
      );

  const uniqueCities = new Set(theatres.map(t => t.location.split(',')[0].trim())).size;

  const listHeader = (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.topBarBtnText}>👤 Προφίλ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topBarBtn, styles.topBarBtnLogout]} onPress={logout}>
          <Text style={[styles.topBarBtnText, { color: '#ff6b6b' }]}>Έξοδος</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroLabel}>🎭 ΚΑΛΩΣ ΗΡΘΑΤΕ</Text>
        <Text style={styles.heroGreeting}>Γεια σου, {user?.name}! 👋</Text>
        <Text style={styles.heroTagline}>Ανακαλύψτε θεατρικές παραστάσεις σε όλη την Ελλάδα</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{theatres.length}</Text>
          <Text style={styles.statLabel}>Θέατρα</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{uniqueCities}</Text>
          <Text style={styles.statLabel}>Πόλεις</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{allShows.length}</Text>
          <Text style={styles.statLabel}>Παραστάσεις</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση θεάτρου..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Θέατρα ({filteredTheatres.length})</Text>
    </View>
  );

  const renderTheatre = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Shows', { theatreId: item.theatre_id, theatreName: item.name })}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardIcon}>🏛</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardLocation}>📍 {item.location}</Text>
          {item.show_count > 0 && (
            <View style={styles.showCountBadge}>
              <Text style={styles.showCountText}>🎬 {item.show_count} παρ.</Text>
            </View>
          )}
        </View>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>

      {item.next_show_date && (
        <View style={styles.nextShowBadge}>
          <Text style={styles.nextShowText}>
            🎭 {item.next_show_title} · {new Date(item.next_show_date).toLocaleDateString('el-GR')}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Δείτε Παραστάσεις ›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e0c068" />
        <Text style={styles.loadingText}>Φόρτωση...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTheatres}
        keyExtractor={(item) => item.theatre_id.toString()}
        renderItem={renderTheatre}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(search); }}
            tintColor="#e0c068"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.empty}>Δεν βρέθηκαν θέατρα</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 16 },
  loadingContainer: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#e0c068', marginTop: 12, fontSize: 15 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 16, marginBottom: 12 },
  topBarBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#0f3460' },
  topBarBtnLogout: { borderColor: '#ff6b6b33' },
  topBarBtnText: { color: '#e0c068', fontSize: 13, fontWeight: '600' },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#16213e', borderRadius: 16,
    padding: 20, marginBottom: 14,
    borderTopWidth: 4, borderTopColor: '#e0c068',
    borderWidth: 1, borderColor: '#0f3460',
  },
  heroLabel: { color: '#e0c068', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  heroGreeting: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  heroTagline: { color: '#aaa', fontSize: 13, lineHeight: 20 },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#16213e',
    borderRadius: 12, padding: 14, marginBottom: 14,
    justifyContent: 'space-around', alignItems: 'center',
    borderWidth: 1, borderColor: '#0f3460',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { color: '#e0c068', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#0f3460' },

  // Search
  searchRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#16213e', color: '#fff',
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  searchBtn: {
    backgroundColor: '#e0c068', borderRadius: 8,
    padding: 12, justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { fontSize: 18 },

  // Filter chips
  chipsScroll: { marginBottom: 14 },
  chipsContainer: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#0f3460',
    backgroundColor: '#16213e',
  },
  chipActive: { backgroundColor: '#e0c068', borderColor: '#e0c068' },
  chipText: { color: '#aaa', fontSize: 13 },
  chipTextActive: { color: '#1a1a2e', fontWeight: 'bold' },

  sectionTitle: { color: '#e0c068', fontSize: 15, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },

  // Theatre card
  card: {
    backgroundColor: '#16213e', borderRadius: 14,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e0c068',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    overflow: 'hidden',
  },
  cardTop: { padding: 16 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', flex: 1, marginRight: 8 },
  cardIcon: { fontSize: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardLocation: { color: '#aaa', fontSize: 13, flex: 1 },
  showCountBadge: {
    backgroundColor: '#0f3460', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  showCountText: { color: '#e0c068', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { color: '#888', fontSize: 13, lineHeight: 18 },
  nextShowBadge: {
    backgroundColor: '#0f3460', marginHorizontal: 16,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    marginBottom: 12,
  },
  nextShowText: { color: '#e0c068', fontSize: 12 },
  cardFooter: {
    borderTopWidth: 1, borderTopColor: '#0f3460',
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'flex-end',
  },
  cardFooterText: { color: '#e0c068', fontSize: 13, fontWeight: '600' },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  empty: { color: '#888', fontSize: 15, textAlign: 'center' },
});
