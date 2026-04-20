import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import api from '../services/api';

export default function ShowDetailScreen({ route, navigation }) {
  const { showId, showTitle } = route.params;
  const [show, setShow] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowDetails();
    navigation.setOptions({ title: showTitle });
  }, []);

  const fetchShowDetails = async () => {
    try {
      const [showRes, showtimesRes] = await Promise.all([
        api.get(`/shows/${showId}`),
        api.get(`/shows/${showId}/showtimes`)
      ]);
      setShow(showRes.data);
      setShowtimes(showtimesRes.data);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e0c068" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {show && (
        <View style={styles.showInfo}>
          <Text style={styles.title}>{show.title}</Text>
          <Text style={styles.theatre}>🏛 {show.theatre_name} · {show.location}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>⏱ {show.duration} λεπτά</Text>
            <Text style={styles.metaText}>🔞 {show.age_rating}</Text>
          </View>
          {show.description ? <Text style={styles.description}>{show.description}</Text> : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>Διαθέσιμες Παραστάσεις</Text>

      {showtimes.length === 0 ? (
        <Text style={styles.empty}>Δεν υπάρχουν διαθέσιμες παραστάσεις</Text>
      ) : (
        showtimes.map((st) => (
          <TouchableOpacity
            key={st.showtime_id}
            style={[styles.showtimeCard, st.available_seats === 0 && styles.soldOut]}
            onPress={() => {
              if (st.available_seats === 0) {
                Alert.alert('Εξαντλήθηκαν', 'Δεν υπάρχουν διαθέσιμες θέσεις για αυτή την παράσταση');
                return;
              }
              navigation.navigate('Reservation', { showtimeId: st.showtime_id, showtime: st, showTitle });
            }}
          >
            <Text style={styles.showtimeDate}>
              📅 {new Date(st.date).toLocaleDateString('el-GR')}  🕐 {st.time.slice(0, 5)}
            </Text>
            <View style={styles.showtimeMeta}>
              <Text style={styles.metaText}>🏟 {st.room}</Text>
              <Text style={styles.metaText}>💺 {st.available_seats}/{st.total_seats} θέσεις</Text>
              <Text style={styles.price}>€{parseFloat(st.price).toFixed(2)}</Text>
            </View>
            {st.available_seats === 0 && <Text style={styles.soldOutText}>ΕΞΑΝΤΛΗΤΗΚΕ</Text>}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  showInfo: {
    backgroundColor: '#16213e', borderRadius: 12,
    padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#e0c068',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  theatre: { color: '#aaa', fontSize: 14, marginBottom: 10 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  metaText: { color: '#e0c068', fontSize: 13 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: '#e0c068', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  showtimeCard: {
    backgroundColor: '#16213e', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  soldOut: { opacity: 0.5 },
  showtimeDate: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  showtimeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#4ade80', fontWeight: 'bold', fontSize: 16 },
  soldOutText: { color: '#ff6b6b', fontWeight: 'bold', marginTop: 6 },
  empty: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 16 },
});
