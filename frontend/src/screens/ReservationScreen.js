import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, FlatList
} from 'react-native';
import api from '../services/api';
import { seatPrice, formatEuro } from '../utils/pricing';

export default function ReservationScreen({ route, navigation }) {
  const { showtimeId, showtime, showTitle } = route.params;
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const MAX_SEATS = 10;
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

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Επιλέξτε θέση', 'Παρακαλώ επιλέξτε τουλάχιστον μία θέση');
      return;
    }
    const basePrice = parseFloat(showtime.price);
    const totalPrice = selectedSeats.reduce(
      (sum, s) => sum + seatPrice(basePrice, s.category), 0
    );
    const seatList = selectedSeats.map(s => `${s.seat_number} (${s.category})`).join(', ');
    Alert.alert(
      'Επιβεβαίωση Κράτησης',
      `${selectedSeats.length} θέσεις: ${seatList}\n\nΣύνολο: ${formatEuro(totalPrice)}`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        { text: 'Επιβεβαίωση', onPress: confirmBooking }
      ]
    );
  };

  const confirmBooking = async () => {
    setBooking(true);
    try {
      const res = await api.post('/reservations', {
        showtime_id: showtimeId,
        seat_ids: selectedSeats.map(s => s.seat_id),
      });
      const { reference, count, totalPrice } = res.data;
      setSelectedSeats([]);
      Alert.alert(
        'Επιτυχία! 🎉',
        `Κρατήθηκαν ${count} θέσεις\nΚωδικός: ${reference}\nΣύνολο: ${formatEuro(totalPrice)}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
      );
    } catch (err) {
      Alert.alert(
        'Σφάλμα',
        err.response?.data?.error || err.response?.data?.message || err.message || 'Αποτυχία κράτησης'
      );
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

  const toggleSeat = (seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.seat_id === seat.seat_id);
      if (isSelected) {
        return prev.filter(s => s.seat_id !== seat.seat_id);
      }
      if (prev.length >= MAX_SEATS) {
        Alert.alert('Όριο θέσεων', `Μπορείτε να επιλέξετε έως ${MAX_SEATS} θέσεις ανά κράτηση`);
        return prev;
      }
      return [...prev, seat];
    });
  };

  const renderSeat = ({ item }) => {
    const isSelected = selectedSeats.some(s => s.seat_id === item.seat_id);
    return (
      <TouchableOpacity
        style={[
          styles.seat,
          !item.is_available && styles.seatTaken,
          isSelected && styles.seatSelected,
          { borderColor: getCategoryColor(item.category) }
        ]}
        onPress={() => item.is_available && toggleSeat(item)}
        disabled={!item.is_available}
      >
        <Text style={[styles.seatText, !item.is_available && styles.seatTextTaken]}>
          {item.seat_number}
        </Text>
      </TouchableOpacity>
    );
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

      <View style={styles.stage}>
        <Text style={styles.stageText}>— ΣΚΗΝΗ —</Text>
      </View>

      <Text style={styles.sectionHeader}>ΠΛΑΤΕΙΑ VIP</Text>
      <FlatList
        data={seats.filter(s => s.category === 'VIP')}
        keyExtractor={(item) => item.seat_id.toString()}
        renderItem={renderSeat}
        numColumns={12}
        scrollEnabled={false}
        contentContainerStyle={styles.seatGrid}
      />

      <Text style={styles.sectionHeader}>ΠΛΑΤΕΙΑ STANDARD</Text>
      <FlatList
        data={seats.filter(s => s.category === 'Standard')}
        keyExtractor={(item) => item.seat_id.toString()}
        renderItem={renderSeat}
        numColumns={12}
        scrollEnabled={false}
        contentContainerStyle={styles.seatGrid}
      />

      <Text style={styles.sectionHeader}>ΕΞΩΣΤΗΣ ECONOMY</Text>
      <FlatList
        data={seats.filter(s => s.category === 'Economy')}
        keyExtractor={(item) => item.seat_id.toString()}
        renderItem={renderSeat}
        numColumns={12}
        scrollEnabled={false}
        contentContainerStyle={styles.seatGrid}
      />

      {selectedSeats.length > 0 && (() => {
        const basePrice = parseFloat(showtime.price);
        const total = selectedSeats.reduce(
          (sum, s) => sum + seatPrice(basePrice, s.category), 0
        );
        return (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedHeader}>
              Επιλογή ({selectedSeats.length}/{MAX_SEATS})
            </Text>
            {['VIP', 'Standard', 'Economy'].map(cat => {
              const seatsInCat = selectedSeats.filter(s => s.category === cat);
              if (seatsInCat.length === 0) return null;
              const unit = seatPrice(basePrice, cat);
              const line = seatsInCat.length * unit;
              return (
                <Text key={cat} style={styles.breakdownLine}>
                  {seatsInCat.length}× {cat} ({formatEuro(unit)}) = {formatEuro(line)}
                </Text>
              );
            })}
            <View style={styles.divider} />
            <Text style={styles.totalLine}>Σύνολο: {formatEuro(total)}</Text>
          </View>
        );
      })()}

      <TouchableOpacity
        style={[styles.confirmBtn, selectedSeats.length === 0 && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={selectedSeats.length === 0 || booking}
      >
        <Text style={styles.confirmBtnText}>
          {booking
            ? 'Επεξεργασία...'
            : selectedSeats.length === 0
              ? 'Επιλέξτε θέσεις'
              : `Κράτηση ${selectedSeats.length} θέσεων`}
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
  stage: {
    backgroundColor: '#0f3460', borderRadius: 4, paddingVertical: 6,
    marginBottom: 16,
    borderTopWidth: 3, borderTopColor: '#e0c068',
  },
  stageText: { color: '#e0c068', textAlign: 'center', fontSize: 13, letterSpacing: 4, fontWeight: 'bold' },
  sectionHeader: {
    color: '#e0c068', fontSize: 11, fontWeight: 'bold',
    letterSpacing: 2, marginTop: 8, marginBottom: 6, textAlign: 'center',
  },
  seatGrid: { alignItems: 'center', paddingBottom: 4 },
  seat: {
    width: 22, height: 22, margin: 1.5, borderRadius: 3,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#16213e', borderWidth: 1.5,
  },
  seatTaken: { backgroundColor: '#333', borderColor: '#555' },
  seatSelected: { backgroundColor: '#e0c068', borderColor: '#e0c068' },
  seatText: { color: '#fff', fontSize: 7, fontWeight: 'bold' },
  seatTextTaken: { color: '#555' },
  selectedInfo: {
    backgroundColor: '#16213e', borderRadius: 8,
    padding: 12, marginBottom: 16, alignItems: 'stretch',
  },
  selectedText: { color: '#e0c068', fontSize: 16 },
  selectedHeader: { color: '#e0c068', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  breakdownLine: { color: '#fff', fontSize: 13, marginBottom: 3 },
  divider: { height: 1, backgroundColor: '#0f3460', marginVertical: 6 },
  totalLine: { color: '#e0c068', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  confirmBtn: {
    backgroundColor: '#e0c068', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 30,
  },
  confirmBtnDisabled: { backgroundColor: '#555' },
  confirmBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
});
