import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, FlatList
} from 'react-native';
import api from '../services/api';

export default function ReservationScreen({ route, navigation }) {
  const { showtimeId, showtime, showTitle } = route.params;
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const res = await api.get(`/showtimes/${showtimeId}/seats`);
      setSeats(res.data);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση θέσεων');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSeat) {
      Alert.alert('Επιλέξτε θέση', 'Παρακαλώ επιλέξτε μια θέση για να συνεχίσετε');
      return;
    }

    Alert.alert(
      'Επιβεβαίωση Κράτησης',
      `Θέλετε να κλείσετε τη θέση ${selectedSeat.seat_number} (${selectedSeat.category}) για €${parseFloat(showtime.price).toFixed(2)};`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        { text: 'Επιβεβαίωση', onPress: confirmBooking }
      ]
    );
  };

  const confirmBooking = async () => {
    setBooking(true);
    try {
      await api.post('/reservations', { showtime_id: showtimeId, seat_id: selectedSeat.seat_id });
      Alert.alert('Επιτυχία! 🎉', 'Η κράτησή σας καταχωρήθηκε!', [
        { text: 'OK', onPress: () => navigation.navigate('Profile') }
      ]);
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.error || err.response?.data?.message || err.message || 'Αποτυχία κράτησης');
    } finally {
      setBooking(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'VIP': return '#ffd700';
      case 'Standard': return '#4ade80';
      case 'Economy': return '#60a5fa';
      default: return '#aaa';
    }
  };

  const renderSeat = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.seat,
        !item.is_available && styles.seatTaken,
        selectedSeat?.seat_id === item.seat_id && styles.seatSelected,
        { borderColor: getCategoryColor(item.category) }
      ]}
      onPress={() => item.is_available && setSelectedSeat(item)}
      disabled={!item.is_available}
    >
      <Text style={[styles.seatText, !item.is_available && styles.seatTextTaken]}>
        {item.seat_number}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e0c068" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.showTitle}>{showTitle}</Text>
        <Text style={styles.infoText}>📅 {new Date(showtime.date).toLocaleDateString('el-GR')}  🕐 {showtime.time.slice(0, 5)}</Text>
        <Text style={styles.infoText}>🏟 {showtime.room}  💰 €{parseFloat(showtime.price).toFixed(2)}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ffd700' }]} />
          <Text style={styles.legendText}>VIP</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} />
          <Text style={styles.legendText}>Standard</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#60a5fa' }]} />
          <Text style={styles.legendText}>Economy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#555' }]} />
          <Text style={styles.legendText}>Κατειλημμένη</Text>
        </View>
      </View>

      <Text style={styles.stageText}>— ΣΚΗΝΗ —</Text>

      <FlatList
        data={seats}
        keyExtractor={(item) => item.seat_id.toString()}
        renderItem={renderSeat}
        numColumns={5}
        scrollEnabled={false}
        contentContainerStyle={styles.seatGrid}
      />

      {selectedSeat && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedText}>
            Επιλεγμένη: {selectedSeat.seat_number} ({selectedSeat.category})
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.confirmBtn, !selectedSeat && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!selectedSeat || booking}
      >
        <Text style={styles.confirmBtnText}>
          {booking ? 'Επεξεργασία...' : 'Επιβεβαίωση Κράτησης'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  infoCard: {
    backgroundColor: '#16213e', borderRadius: 10,
    padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#e0c068',
  },
  showTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  infoText: { color: '#aaa', fontSize: 14, marginBottom: 4 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: '#ccc', fontSize: 12 },
  stageText: { color: '#e0c068', textAlign: 'center', marginBottom: 16, fontSize: 14, letterSpacing: 4 },
  seatGrid: { alignItems: 'center', paddingBottom: 20 },
  seat: {
    width: 52, height: 40, margin: 4, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#16213e', borderWidth: 2,
  },
  seatTaken: { backgroundColor: '#333', borderColor: '#555' },
  seatSelected: { backgroundColor: '#e0c068' },
  seatText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  seatTextTaken: { color: '#555' },
  selectedInfo: {
    backgroundColor: '#16213e', borderRadius: 8,
    padding: 12, marginBottom: 16, alignItems: 'center',
  },
  selectedText: { color: '#e0c068', fontSize: 16 },
  confirmBtn: {
    backgroundColor: '#e0c068', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 30,
  },
  confirmBtnDisabled: { backgroundColor: '#555' },
  confirmBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
});
