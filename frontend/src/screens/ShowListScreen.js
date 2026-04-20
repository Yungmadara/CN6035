import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import api from '../services/api';

export default function ShowListScreen({ route, navigation }) {
  const { theatreId, theatreName } = route.params;
  const [shows, setShows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShows();
    navigation.setOptions({ title: theatreName || 'Παραστάσεις' });
  }, []);

  const fetchShows = async (searchTerm = '') => {
    setLoading(true);
    try {
      const res = await api.get('/shows', {
        params: { theatreId, title: searchTerm || undefined }
      });
      setShows(res.data);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση παραστάσεων');
    } finally {
      setLoading(false);
    }
  };

  const renderShow = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ShowDetail', { showId: item.show_id, showTitle: item.title })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>⏱ {item.duration} λεπτά</Text>
        <Text style={styles.metaText}>🔞 {item.age_rating}</Text>
      </View>
      {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση παράστασης..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchShows(search)}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchShows(search)}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e0c068" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shows}
          keyExtractor={(item) => item.show_id.toString()}
          renderItem={renderShow}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>Δεν βρέθηκαν παραστάσεις</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  searchRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#16213e', color: '#fff',
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  searchBtn: {
    backgroundColor: '#e0c068', borderRadius: 8,
    padding: 12, justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { fontSize: 18 },
  card: {
    backgroundColor: '#16213e', borderRadius: 10,
    padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e0c068',
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  metaText: { color: '#e0c068', fontSize: 13 },
  cardDesc: { color: '#888', fontSize: 13 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
