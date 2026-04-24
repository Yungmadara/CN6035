# Multi-Seat Booking + Category Pricing + Booking Reference

**Date:** 2026-04-24
**Project:** CN6035 Theatre Reservation App
**Status:** Approved by user

## Context

Η εφαρμογή υποστηρίζει κράτηση **μίας θέσης τη φορά**, με ενιαία τιμή ανά showtime (ανεξαρτήτως κατηγορίας VIP/Standard/Economy), και κάθε κράτηση εμφανίζεται σαν ξεχωριστό entry στο Profile. Αυτό δεν ταιριάζει με πραγματικές εφαρμογές κρατήσεων (Viva, More, Ticketmaster), όπου:

- Ο χρήστης επιλέγει **πολλαπλές θέσεις** σε ένα booking
- **Κατηγορία θέσης επηρεάζει την τιμή** (VIP πιο ακριβή)
- Κάθε booking έχει **μοναδικό κωδικό αναφοράς** για εντοπισμό/εξαργύρωση

Ο στόχος: να βελτιωθεί η εμπειρία του app ώστε να μοιάζει με παραγωγική εφαρμογή στην παρουσίαση της εργασίας, χωρίς να θιχτεί η βασική αρχιτεκτονική (client → REST API → MariaDB).

## Goals & Non-Goals

### Goals
1. **Multi-seat selection**: Ο χρήστης επιλέγει 1-10 θέσεις πριν το checkout σε **ένα transaction**.
2. **Category pricing**: VIP = base × 1.5, Standard = base × 1.0, Economy = base × 0.6.
3. **Booking reference**: Ενιαίος κωδικός ανά group κρατήσεων (format `BK-YYYYMMDD-XXXX`).
4. **Atomicity**: Αν έστω μία θέση δεν είναι διαθέσιμη, rollback όλο το booking.
5. **Backward-friendly UI**: Το Profile συνεχίζει να δουλεύει — απλά εμφανίζει grouped bookings αντί για individual seats.

### Non-Goals
- Real payment gateway
- Email confirmation
- Cart που κρατάει seats από διαφορετικά showtimes
- Schema-level bookings table (χρησιμοποιούμε το reference σαν logical group key)
- Price snapshotting (δεν αποθηκεύουμε price/seat στο reservation — υπολογίζεται δυναμικά)

## Architecture

```
┌─────────────┐    POST /reservations    ┌──────────────┐
│  iPhone     │    {showtime_id,         │  Backend     │
│  (Expo Go)  │─── seat_ids: [1,2,3]} ──▶│  Node/Express│
│             │                           │              │
│             │◀── {reference, count, ───│              │
│             │      totalPrice}          │              │
└─────────────┘                           └──────┬───────┘
                                                 │ Transaction:
                                                 │  1. SELECT FOR UPDATE
                                                 │  2. Validate availability
                                                 │  3. Generate reference
                                                 │  4. INSERT N rows
                                                 │  5. UPDATE seats
                                                 │  6. UPDATE showtime
                                                 ▼
                                          ┌──────────────┐
                                          │ Railway MySQL│
                                          │  reservations│
                                          │  (+ref col)  │
                                          └──────────────┘
```

## Database Changes

```sql
ALTER TABLE reservations
  ADD COLUMN reservation_reference VARCHAR(20) AFTER seat_id;

CREATE INDEX idx_reservation_reference
  ON reservations(reservation_reference);
```

- **New column**: `reservation_reference VARCHAR(20)` — nullable για backward compat, αλλά νέες εγγραφές θα πάντα έχουν τιμή
- **Index**: ταχεία αναζήτηση στο `GROUP BY reference` του Profile

Το `database/schema.sql` και το `database/railway-setup.sql` θα ενημερωθούν ώστε το column να δημιουργείται εξαρχής σε fresh installs.

## Backend Changes

### Νέο util: `backend/src/utils/pricing.js`

```js
const CATEGORY_MULTIPLIERS = { VIP: 1.5, Standard: 1.0, Economy: 0.6 };

function seatPrice(basePrice, category) {
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(basePrice * mult * 100) / 100;
}

function generateReference() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${date}-${rand}`;
}

module.exports = { seatPrice, generateReference, CATEGORY_MULTIPLIERS };
```

### `backend/src/routes/reservations.js` — `POST /`

**Πριν:**
```js
router.post('/', authMiddleware, async (req, res) => {
  const { showtime_id, seat_id } = req.body;
  // Single seat logic
});
```

**Μετά:**
```js
router.post('/', authMiddleware, async (req, res) => {
  // Accept both old {seat_id} and new {seat_ids} για ασφαλή migration
  const { showtime_id } = req.body;
  const seat_ids = req.body.seat_ids || (req.body.seat_id ? [req.body.seat_id] : []);

  if (!showtime_id || seat_ids.length === 0) {
    return res.status(400).json({ message: 'showtime_id και seat_ids απαιτούνται' });
  }
  if (seat_ids.length > 10) {
    return res.status(400).json({ message: 'Μέγιστο 10 θέσεις ανά κράτηση' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock all seats
    const [seats] = await conn.query(
      `SELECT seat_id, category, is_available FROM seats
       WHERE seat_id IN (?) AND showtime_id = ? FOR UPDATE`,
      [seat_ids, showtime_id]
    );

    if (seats.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Δεν βρέθηκαν κάποιες θέσεις' });
    }
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: `${unavailable.length} θέσεις δεν είναι διαθέσιμες` });
    }

    const [[showtime]] = await conn.query(
      'SELECT price FROM showtimes WHERE showtime_id = ?', [showtime_id]
    );
    const basePrice = parseFloat(showtime.price);
    const reference = generateReference();

    // Insert N reservations with shared reference
    const insertValues = seat_ids.map(sid => [req.user.userId, showtime_id, sid, reference]);
    await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, seat_id, reservation_reference) VALUES ?',
      [insertValues]
    );

    // Mark seats unavailable
    await conn.query(
      'UPDATE seats SET is_available = FALSE WHERE seat_id IN (?)', [seat_ids]
    );

    // Decrement available_seats
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [seat_ids.length, showtime_id]
    );

    await conn.commit();

    const totalPrice = seats.reduce((sum, s) => sum + seatPrice(basePrice, s.category), 0);
    res.status(201).json({
      message: 'Κράτηση επιτυχής',
      reference,
      count: seat_ids.length,
      totalPrice: Math.round(totalPrice * 100) / 100
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});
```

### `backend/src/routes/reservations.js` — `GET /my, /reservations`

Προσθήκη `r.reservation_reference` στο SELECT και στο response. Κανένα GROUP BY στο backend — το frontend κάνει το grouping (πιο flexible για UI).

```sql
SELECT r.reservation_id, r.status, r.created_at,
       r.reservation_reference,
       s.title AS show_title, t.name AS theatre_name,
       st.date, st.time, st.room, st.price AS base_price,
       se.seat_id, se.seat_number, se.category
FROM reservations r
JOIN showtimes st ON r.showtime_id = st.showtime_id
JOIN shows s ON st.show_id = s.show_id
JOIN theatres t ON s.theatre_id = t.theatre_id
JOIN seats se ON r.seat_id = se.seat_id
WHERE r.user_id = ?
ORDER BY st.date DESC, r.reservation_reference
```

Note: Το `base_price` επιστρέφεται ώστε το frontend να υπολογίζει per-seat price.

### PUT/DELETE endpoints

**No changes για τώρα** — παραμένουν per-reservation. Ο χρήστης ακυρώνει/αλλάζει μία θέση τη φορά ακόμα κι αν αποτελεί μέρος booking με πολλές θέσεις.

## Frontend Changes

### `frontend/src/screens/ReservationScreen.js`

**State:**
```js
const [selectedSeats, setSelectedSeats] = useState([]);  // array of seat objects
// (replaces: const [selectedSeat, setSelectedSeat] = useState(null))
```

**Seat toggle:**
```js
const toggleSeat = (seat) => {
  const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
  if (isSelected) {
    setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
  } else {
    if (selectedSeats.length >= 10) {
      Alert.alert('Όριο', 'Μπορείτε να κλείσετε έως 10 θέσεις ανά κράτηση');
      return;
    }
    setSelectedSeats([...selectedSeats, seat]);
  }
};
```

**Pricing helper (frontend):**
```js
// frontend/src/utils/pricing.js
export const CATEGORY_MULTIPLIERS = { VIP: 1.5, Standard: 1.0, Economy: 0.6 };

export function seatPrice(basePrice, category) {
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(basePrice * mult * 100) / 100;
}
```

**Price breakdown panel** (νέο component στο ReservationScreen):
```jsx
<View style={styles.summary}>
  {['VIP', 'Standard', 'Economy'].map(cat => {
    const seatsInCat = selectedSeats.filter(s => s.category === cat);
    if (seatsInCat.length === 0) return null;
    const unitPrice = seatPrice(showtime.price, cat);
    return (
      <Text key={cat}>
        {seatsInCat.length}× {cat} (€{unitPrice.toFixed(2)}) = €{(seatsInCat.length * unitPrice).toFixed(2)}
      </Text>
    );
  })}
  <View style={styles.divider} />
  <Text style={styles.total}>Σύνολο: €{totalPrice.toFixed(2)}</Text>
</View>
```

**Confirm call:**
```js
await api.post('/reservations', {
  showtime_id: showtimeId,
  seat_ids: selectedSeats.map(s => s.seat_id)
});
// response: {reference, count, totalPrice}
Alert.alert('Επιτυχία! 🎉', `Κρατήθηκαν ${count} θέσεις.\nΚωδικός: ${reference}`, ...);
```

### `frontend/src/screens/ProfileScreen.js`

**Group reservations by reference:**
```js
const groupedBookings = reservations.reduce((acc, r) => {
  const ref = r.reservation_reference || `single-${r.reservation_id}`;
  if (!acc[ref]) acc[ref] = { ...r, seats: [] };
  acc[ref].seats.push({
    reservation_id: r.reservation_id,
    seat_id: r.seat_id,
    seat_number: r.seat_number,
    category: r.category
  });
  return acc;
}, {});
const bookings = Object.values(groupedBookings);
```

**Booking card:**
```
┌──────────────────────────────────────────────┐
│ BK-20260424-A7X3           [Επερχόμενη]      │
│ Αντιγόνη — Εθνικό Θέατρο                     │
│ 📅 05/05/2026  🕐 20:00  🎭 Κεντρική Σκηνή   │
│                                               │
│ Θέσεις (3):                                  │
│   A1 (VIP) €37.50  [Αλλαγή] [Ακύρωση]        │
│   A2 (VIP) €37.50  [Αλλαγή] [Ακύρωση]        │
│   B3 (Standard) €25.00  [Αλλαγή] [Ακύρωση]   │
│                                               │
│ Σύνολο: €100.00                              │
└──────────────────────────────────────────────┘
```

## Data Flow — End-to-End

1. **User επιλέγει 3 θέσεις** (A1 VIP, A2 VIP, B3 Standard)
2. UI υπολογίζει breakdown: `2×€37.50 + 1×€25.00 = €100.00`
3. User πατάει "Επιβεβαίωση" → `POST /api/reservations {showtime_id: 1, seat_ids: [11,12,27]}`
4. Backend transaction:
   - `SELECT ... FOR UPDATE` — lock rows
   - Validate όλες available
   - `generateReference()` → `BK-20260424-A7X3`
   - `INSERT` 3 rows
   - `UPDATE seats SET is_available=FALSE`
   - `UPDATE showtimes SET available_seats -= 3`
   - `COMMIT`
5. Response: `{reference: "BK-20260424-A7X3", count: 3, totalPrice: 100}`
6. UI: Success alert με το reference
7. Navigate σε Profile → GET /my → βλέπει το grouped booking

## Error Handling

| Σενάριο | Response |
|---------|----------|
| Κενό `seat_ids` | 400 "seat_ids απαιτούνται" |
| `seat_ids.length > 10` | 400 "Μέγιστο 10 θέσεις" |
| Κάποια θέση μη διαθέσιμη | 409 "N θέσεις δεν είναι διαθέσιμες" + rollback |
| Race condition (άλλος χρήστης έκλεισε μεσοδρομίς) | Αποτρέπεται από `FOR UPDATE` + validation |
| Λάθος `showtime_id` | 404 "Δεν βρέθηκαν κάποιες θέσεις" |

## Testing Plan

### Backend (manual με curl)
```bash
# 1. Register + login για token
curl -X POST .../api/register -d '{"name":"Test","email":"t@t.com","password":"123"}'
curl -X POST .../api/login -d '{"email":"t@t.com","password":"123"}' # grab token

# 2. Multi-seat booking
curl -X POST .../api/reservations \
  -H "Authorization: Bearer <token>" \
  -d '{"showtime_id":1, "seat_ids":[11,12,27]}'
# Expected: {reference: "BK-...", count: 3, totalPrice: 100}

# 3. Verify group στο Profile
curl .../api/user/reservations -H "Authorization: Bearer <token>"
# Expected: 3 rows, όλα με ίδιο reservation_reference

# 4. Concurrency test (προσπάθησε να κλείσεις ίδιο seat)
curl -X POST .../api/reservations \
  -d '{"showtime_id":1, "seat_ids":[11, 99]}'
# Expected: 409 — και seat 11 + 99 ΠΑΡΑΜΕΝΟΥΝ διαθέσιμες (rollback)
```

### Frontend (iPhone + Expo Go)
1. Άνοιξε app → login με existing user
2. Theatre → Show → Showtime → Seats
3. Επίλεξε 3 θέσεις διαφορετικών κατηγοριών → verify breakdown
4. Επίλεξε 11η → alert "Μέγιστο 10 θέσεις"
5. Αποεπίλεξε 1 → breakdown updates
6. Confirm → success alert με reference
7. Profile → ένα booking card με 3 θέσεις + reference
8. Cancel μία θέση → card τώρα δείχνει 2 θέσεις

## Critical Files

| Αρχείο | Αλλαγή |
|--------|--------|
| `database/schema.sql` | `ADD COLUMN reservation_reference` |
| `database/railway-setup.sql` | Regenerate με το νέο column |
| `backend/src/utils/pricing.js` | **ΝΕΟ** — multiplier constants + helpers |
| `backend/src/routes/reservations.js` | POST δέχεται array, generates reference; GET επιστρέφει reference |
| `frontend/src/utils/pricing.js` | **ΝΕΟ** — frontend copy των multipliers |
| `frontend/src/screens/ReservationScreen.js` | Multi-select state + toggle + price panel |
| `frontend/src/screens/ProfileScreen.js` | Group by reference + display |

## Verification Checklist

- [ ] Schema migration εκτελέστηκε στο Railway (`ALTER TABLE` ή re-import)
- [ ] `POST /reservations` δέχεται `seat_ids` array και επιστρέφει `reference`
- [ ] `GET /my` επιστρέφει όλα τα reservations με `reservation_reference`
- [ ] ReservationScreen: tap σε θέση → toggle, όχι replace
- [ ] ReservationScreen: price breakdown ενημερώνεται live
- [ ] ReservationScreen: max 10 seats
- [ ] ProfileScreen: bookings grouped by reference, κάθε card δείχνει όλες τις θέσεις
- [ ] Concurrency: 2 users που προσπαθούν ίδιο seat → ένας κάνει, άλλος παίρνει 409
- [ ] Git committed + pushed
