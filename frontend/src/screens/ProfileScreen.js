import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
  Modal, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { seatPrice, formatEuro } from '../utils/pricing';

export default function ProfileScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [changeSeatModal, setChangeSeatModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [newSeat, setNewSeat] = useState(null);
  const { user, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [])
  );

  const fetchReservations = async () => {
    try {
      const res = await api.get('/user/reservations');
      setReservations(res.data);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση κρατήσεων');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isFuture = (dateStr) => new Date(dateStr) > new Date();

  // Group reservations by reference (null ref → synthetic group per reservation)
  const groupBookings = (reservationList) => {
    const groups = {};
    for (const r of reservationList) {
      const key = r.reservation_reference || `single-${r.reservation_id}`;
      if (!groups[key]) {
        groups[key] = {
          reference: r.reservation_reference,
          show_title: r.show_title,
          theatre_name: r.theatre_name,
          date: r.date,
          time: r.time,
          room: r.room,
          base_price: parseFloat(r.base_price || r.price || 0),
          showtime_id: r.showtime_id,
          status: r.status,
          seats: [],
        };
      }
      groups[key].seats.push({
        reservation_id: r.reservation_id,
        seat_id: r.seat_id,
        seat_number: r.seat_number,
        category: r.category,
        status: r.status,
      });
    }
    return Object.values(groups);
  };

  // Group all reservations first, then decide tab per booking
  const allBookings = groupBookings(reservations);

  const upcomingBookings = allBookings.filter(
    b => isFuture(b.date) && b.seats.some(s => s.status === 'confirmed')
  );
  const pastBookings = allBookings.filter(
    b => !isFuture(b.date) || b.seats.every(s => s.status === 'cancelled')
  );

  // Keep legacy names for stats row (count individual seat reservations, not bookings)
  const upcomingReservations = reservations.filter(
    r => r.status === 'confirmed' && isFuture(r.date)
  );
  const pastReservations = reservations.filter(
    r => r.status === 'cancelled' || !isFuture(r.date)
  );

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancel = (reservationId) => {
    Alert.alert(
      'Ακύρωση Κράτησης',
      'Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτή την κράτηση;',
      [
        { text: 'Όχι', style: 'cancel' },
        { text: 'Ακύρωση', style: 'destructive', onPress: () => cancelReservation(reservationId) }
      ]
    );
  };

  const cancelReservation = async (reservationId) => {
    try {
      await api.delete(`/reservations/${reservationId}`);
      Alert.alert('Επιτυχία', 'Η κράτηση ακυρώθηκε');
      fetchReservations();
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.message || 'Αποτυχία ακύρωσης');
    }
  };

  const openChangeSeat = async (reservation) => {
    setSelectedReservation(reservation);
    setNewSeat(null);
    setLoadingSeats(true);
    setChangeSeatModal(true);
    try {
      const res = await api.get(`/showtimes/${reservation.showtime_id}/seats`);
      setAvailableSeats(res.data.filter(s => s.is_available));
    } catch (err) {
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η φόρτωση θέσεων');
      setChangeSeatModal(false);
    } finally {
      setLoadingSeats(false);
    }
  };

  const confirmChangeSeat = async () => {
    if (!newSeat) {
      Alert.alert('Επιλέξτε θέση', 'Παρακαλώ επιλέξτε νέα θέση');
      return;
    }
    try {
      await api.put(`/reservations/${selectedReservation.reservation_id}`, { new_seat_id: newSeat.seat_id });
      Alert.alert('Επιτυχία', 'Η θέση άλλαξε επιτυχώς');
      setChangeSeatModal(false);
      fetchReservations();
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.message || 'Αποτυχία αλλαγής θέσης');
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

  const renderBooking = ({ item }) => {
    const isPast = !isFuture(item.date);
    const anyCancelled = item.seats.some(s => s.status === 'cancelled');
    const allCancelled = item.seats.every(s => s.status === 'cancelled');
    const totalPrice = item.seats
      .filter(s => s.status === 'confirmed')
      .reduce((sum, s) => sum + seatPrice(item.base_price, s.category), 0);

    return (
      <View style={[styles.card, (isPast || allCancelled) && styles.pastCard]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.showTitle}>{item.show_title}</Text>
            {item.reference && (
              <Text style={styles.reference}>🎫 {item.reference}</Text>
            )}
          </View>
          <Text style={[
            styles.status,
            allCancelled ? styles.cancelled : styles.confirmed,
          ]}>
            {allCancelled ? '❌ Ακυρωμένη' : '✅ Επιβεβαιωμένη'}
          </Text>
        </View>
        <Text style={styles.detail}>🏛 {item.theatre_name}</Text>
        <Text style={styles.detail}>📅 {new Date(item.date).toLocaleDateString('el-GR')}  🕐 {item.time.slice(0, 5)}</Text>
        <Text style={styles.detail}>🏟 {item.room}</Text>

        <View style={styles.seatsContainer}>
          <Text style={styles.seatsHeader}>Θέσεις ({item.seats.length}):</Text>
          {item.seats.map((s) => {
            const price = seatPrice(item.base_price, s.category);
            const isCancelled = s.status === 'cancelled';
            return (
              <View key={s.reservation_id} style={styles.seatRow}>
                <Text style={[styles.seatInfo, isCancelled && styles.cancelledSeat]}>
                  💺 {s.seat_number} ({s.category}) — {formatEuro(price)}
                  {isCancelled ? ' [ακυρώθηκε]' : ''}
                </Text>
                {!isPast && !isCancelled && (
                  <View style={styles.seatActions}>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => openChangeSeat({
                        reservation_id: s.reservation_id,
                        showtime_id: item.showtime_id,
                        show_title: item.show_title,
                      })}
                    >
                      <Text style={styles.smallBtnText}>Αλλαγή</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.smallBtnDanger]}
                      onPress={() => handleCancel(s.reservation_id)}
                    >
                      <Text style={[styles.smallBtnText, { color: '#ff6b6b' }]}>Ακύρωση</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {totalPrice > 0 && (
          <Text style={styles.bookingTotal}>Σύνολο: {formatEuro(totalPrice)}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Έξοδος</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{upcomingReservations.length}</Text>
          <Text style={styles.statLabel}>Επερχόμενες</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{pastReservations.length}</Text>
          <Text style={styles.statLabel}>Παλαιότερες</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{reservations.length}</Text>
          <Text style={styles.statLabel}>Σύνολο</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Επερχόμενες ({upcomingReservations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Ιστορικό ({pastReservations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#e0c068" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayedBookings}
          keyExtractor={(item, index) => item.reference || `fallback-${index}`}
          renderItem={renderBooking}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReservations(); }}
              tintColor="#e0c068"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{activeTab === 'upcoming' ? '🎭' : '📋'}</Text>
              <Text style={styles.empty}>
                {activeTab === 'upcoming' ? 'Δεν έχετε επερχόμενες κρατήσεις' : 'Δεν υπάρχει ιστορικό κρατήσεων'}
              </Text>
            </View>
          }
        />
      )}

      {/* Change Seat Modal */}
      <Modal visible={changeSeatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Αλλαγή Θέσης</Text>
            <Text style={styles.modalSubtitle}>{selectedReservation?.show_title}</Text>

            {loadingSeats ? (
              <ActivityIndicator size="large" color="#e0c068" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.seatScroll}>
                <View style={styles.seatGrid}>
                  {availableSeats.map((seat) => (
                    <TouchableOpacity
                      key={seat.seat_id}
                      style={[
                        styles.seat,
                        { borderColor: getCategoryColor(seat.category) },
                        newSeat?.seat_id === seat.seat_id && styles.seatSelected,
                      ]}
                      onPress={() => setNewSeat(seat)}
                    >
                      <Text style={styles.seatText}>{seat.seat_number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {availableSeats.length === 0 && (
                  <Text style={styles.empty}>Δεν υπάρχουν διαθέσιμες θέσεις</Text>
                )}
              </ScrollView>
            )}

            {newSeat && (
              <Text style={styles.selectedInfo}>
                Επιλεγμένη: {newSeat.seat_number} ({newSeat.category})
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setChangeSeatModal(false)}>
                <Text style={styles.modalCancelText}>Κλείσιμο</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmChangeSeat}>
                <Text style={styles.modalConfirmText}>Επιβεβαίωση</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16213e', borderRadius: 12,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#0f3460',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#e0c068', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#1a1a2e', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userEmail: { color: '#aaa', fontSize: 12, marginTop: 2 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ff6b6b' },
  logoutText: { color: '#ff6b6b', fontSize: 12, fontWeight: 'bold' },
  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#16213e',
    borderRadius: 12, padding: 14, marginBottom: 14,
    justifyContent: 'space-around', alignItems: 'center',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { color: '#e0c068', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#0f3460' },
  // Tabs
  tabs: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#16213e', alignItems: 'center',
    borderWidth: 1, borderColor: '#0f3460',
  },
  activeTab: { backgroundColor: '#e0c068', borderColor: '#e0c068' },
  tabText: { color: '#aaa', fontSize: 13, fontWeight: 'bold' },
  activeTabText: { color: '#1a1a2e' },
  // Cards
  card: { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 12 },
  pastCard: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  showTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  status: { fontSize: 12 },
  confirmed: { color: '#4ade80' },
  cancelled: { color: '#ff6b6b' },
  detail: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  changeSeatBtn: {
    flex: 1, backgroundColor: '#0f3460', borderRadius: 6,
    padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e0c068',
  },
  changeSeatBtnText: { color: '#e0c068', fontWeight: 'bold', fontSize: 13 },
  cancelBtn: { flex: 1, backgroundColor: '#ff6b6b', borderRadius: 6, padding: 8, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  // Empty state
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  empty: { color: '#888', textAlign: 'center', fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#16213e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalTitle: { color: '#e0c068', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { color: '#aaa', fontSize: 14, marginBottom: 16 },
  seatScroll: { maxHeight: 250 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  seat: {
    width: 52, height: 40, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderWidth: 2,
  },
  seatSelected: { backgroundColor: '#e0c068' },
  seatText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  selectedInfo: { color: '#e0c068', textAlign: 'center', marginVertical: 10, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn: { flex: 1, backgroundColor: '#333', borderRadius: 8, padding: 12, alignItems: 'center' },
  modalCancelText: { color: '#aaa', fontWeight: 'bold' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#e0c068', borderRadius: 8, padding: 12, alignItems: 'center' },
  modalConfirmText: { color: '#1a1a2e', fontWeight: 'bold' },
  reference: { color: '#e0c068', fontSize: 12, fontWeight: '600', marginTop: 2 },
  seatsContainer: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#0f3460' },
  seatsHeader: { color: '#aaa', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  seatRow: { marginBottom: 8 },
  seatInfo: { color: '#fff', fontSize: 13, marginBottom: 4 },
  cancelledSeat: { color: '#666', textDecorationLine: 'line-through' },
  seatActions: { flexDirection: 'row', gap: 6 },
  smallBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5,
    backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#e0c068',
  },
  smallBtnDanger: { borderColor: '#ff6b6b33' },
  smallBtnText: { color: '#e0c068', fontSize: 11, fontWeight: 'bold' },
  bookingTotal: {
    color: '#e0c068', fontSize: 15, fontWeight: 'bold',
    textAlign: 'right', marginTop: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#0f3460',
  },
});
