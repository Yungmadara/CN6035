# Multi-Seat Booking + Category Pricing + Booking Reference — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Μετατροπή του single-seat reservation flow σε multi-seat με category-based pricing και μοναδικό booking reference ανά group κρατήσεων.

**Architecture:** Atomic transaction στο backend που inserts N rows με κοινό `reservation_reference`, frontend multi-select UI με price breakdown, grouped display στο Profile.

**Tech Stack:** Node.js/Express, MySQL2 (Railway), React Native (Expo SDK 54), JWT auth.

**Project note:** Δεν υπάρχει automated test framework. Verification γίνεται με **curl** για backend και **manual iPhone testing** για frontend.

---

## File Structure

**New files:**
- `backend/src/utils/pricing.js` — Category multipliers + generateReference helper
- `frontend/src/utils/pricing.js` — Frontend copy των multipliers

**Modified files:**
- `database/schema.sql` — Add `reservation_reference` column + index
- `database/railway-setup.sql` — Regenerate (θα παραχθεί από bash command)
- `backend/src/routes/reservations.js` — POST accepts `seat_ids` array + GET returns reference
- `frontend/src/screens/ReservationScreen.js` — Multi-select + breakdown panel
- `frontend/src/screens/ProfileScreen.js` — Grouping by reference

**Unchanged (για reference):**
- `backend/server.js`, `backend/src/config/db.js`, `backend/src/middleware/auth.js`
- `frontend/src/services/api.js`, `frontend/src/context/AuthContext.js`
- All other screens

---

## Task 1: Schema migration — add reservation_reference column

**Files:**
- Modify: `database/schema.sql`
- Regenerate: `database/railway-setup.sql`

- [ ] **Step 1.1: Edit schema.sql — add column and index to reservations**

Open `database/schema.sql`, find the `CREATE TABLE reservations` block. Replace it with:

```sql
CREATE TABLE reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  showtime_id    INT NOT NULL,
  seat_id        INT NOT NULL,
  reservation_reference VARCHAR(20),
  status         ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE CASCADE,
  INDEX idx_reservation_reference (reservation_reference)
);
```

- [ ] **Step 1.2: Regenerate railway-setup.sql**

Run (Bash, from repo root):

```bash
cd database && {
  echo "-- CN6035 Theatre Reservation - Railway combined DROP + schema + seed"
  echo ""
  echo "-- Drop tables in reverse order (respect foreign keys)"
  echo "DROP TABLE IF EXISTS reservations;"
  echo "DROP TABLE IF EXISTS seats;"
  echo "DROP TABLE IF EXISTS showtimes;"
  echo "DROP TABLE IF EXISTS shows;"
  echo "DROP TABLE IF EXISTS theatres;"
  echo "DROP TABLE IF EXISTS users;"
  echo ""
  tail -n +7 schema.sql
  echo ""
  tail -n +5 seed.sql
} > railway-setup.sql
```

Expected: file updated, no errors.

- [ ] **Step 1.3: Import to Railway MySQL**

> ⚠️ **Data loss warning:** Το railway-setup.sql έχει `DROP TABLE IF EXISTS` στην αρχή, άρα **όλοι οι υπάρχοντες users + reservations θα σβηστούν**. Η βάση επιστρέφει σε fresh seed state. Αν το iPhone έχει ήδη JWT token, θα πρέπει να κάνει logout + re-register μετά.

Run:
```bash
cd backend && node import-to-railway.js "mysql://USER:PASSWORD@HOST:PORT/railway"
```

Expected output:
```
Connected to roundhouse.proxy.rlwy.net:43402. Running setup SQL...
Import complete. Tables + seed data loaded.
```

- [ ] **Step 1.4: Verify new column exists**

Run:
```bash
cd backend && node -e "
const mysql = require('mysql2/promise');
(async () => {
  const url = new URL('mysql://USER:PASSWORD@HOST:PORT/railway');
  const conn = await mysql.createConnection({
    host: url.hostname, port: parseInt(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  });
  const [cols] = await conn.query('SHOW COLUMNS FROM reservations');
  console.log(cols.map(c => c.Field).join(', '));
  await conn.end();
})();
"
```

Expected output includes `reservation_reference`:
```
reservation_id, user_id, showtime_id, seat_id, reservation_reference, status, created_at
```

- [ ] **Step 1.5: Commit**

```bash
git add database/schema.sql database/railway-setup.sql
git commit -m "db: add reservation_reference column with index"
```

---

## Task 2: Backend pricing utility

**Files:**
- Create: `backend/src/utils/pricing.js`

- [ ] **Step 2.1: Create the utility file**

Create `backend/src/utils/pricing.js`:

```js
// Category multipliers applied to showtime.price (base = Standard)
const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,
  Standard: 1.0,
  Economy: 0.6,
};

function seatPrice(basePrice, category) {
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(basePrice * mult * 100) / 100;
}

function generateReference() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${y}${m}${day}-${rand}`;
}

module.exports = { CATEGORY_MULTIPLIERS, seatPrice, generateReference };
```

- [ ] **Step 2.2: Smoke test the utility**

Run:
```bash
cd backend && node -e "
const { seatPrice, generateReference } = require('./src/utils/pricing');
console.log('VIP of 25:', seatPrice(25, 'VIP'));         // 37.5
console.log('Standard of 25:', seatPrice(25, 'Standard')); // 25
console.log('Economy of 25:', seatPrice(25, 'Economy'));   // 15
console.log('Unknown cat:', seatPrice(25, 'Unknown'));      // 25
console.log('Reference sample:', generateReference());
"
```

Expected output:
```
VIP of 25: 37.5
Standard of 25: 25
Economy of 25: 15
Unknown cat: 25
Reference sample: BK-20260424-XXXX (random)
```

- [ ] **Step 2.3: Commit**

```bash
git add backend/src/utils/pricing.js
git commit -m "backend: add pricing utility with category multipliers"
```

---

## Task 3: Backend POST /reservations — accept seat_ids array

**Files:**
- Modify: `backend/src/routes/reservations.js:30-69` (the POST handler)

- [ ] **Step 3.1: Replace POST handler**

Open `backend/src/routes/reservations.js`. Find the existing POST `/` handler (the one that starts with `router.post('/', authMiddleware, async (req, res) => {`) and replace it entirely with:

```js
const { seatPrice, generateReference } = require('../utils/pricing');

// POST /api/reservations — multi-seat booking in atomic transaction
router.post('/', authMiddleware, async (req, res) => {
  const { showtime_id } = req.body;
  // Accept both {seat_ids: [...]} (new) and {seat_id: ...} (backward compat)
  const seat_ids = Array.isArray(req.body.seat_ids)
    ? req.body.seat_ids
    : (req.body.seat_id ? [req.body.seat_id] : []);

  if (!showtime_id || seat_ids.length === 0) {
    return res.status(400).json({ message: 'showtime_id and seat_ids are required' });
  }
  if (seat_ids.length > 10) {
    return res.status(400).json({ message: 'Maximum 10 seats per reservation' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock requested seats
    const [seats] = await conn.query(
      'SELECT seat_id, category, is_available FROM seats WHERE seat_id IN (?) AND showtime_id = ? FOR UPDATE',
      [seat_ids, showtime_id]
    );

    if (seats.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Some seats were not found' });
    }
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: `${unavailable.length} seat(s) not available` });
    }

    // Get base price for the showtime
    const [[showtime]] = await conn.query(
      'SELECT price FROM showtimes WHERE showtime_id = ?',
      [showtime_id]
    );
    if (!showtime) {
      await conn.rollback();
      return res.status(404).json({ message: 'Showtime not found' });
    }
    const basePrice = parseFloat(showtime.price);
    const reference = generateReference();

    // Insert N reservations with shared reference
    const insertRows = seat_ids.map(sid => [req.user.userId, showtime_id, sid, reference]);
    await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, seat_id, reservation_reference) VALUES ?',
      [insertRows]
    );

    // Mark seats unavailable
    await conn.query(
      'UPDATE seats SET is_available = FALSE WHERE seat_id IN (?)',
      [seat_ids]
    );

    // Decrement available_seats
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [seat_ids.length, showtime_id]
    );

    await conn.commit();

    const totalPrice = seats.reduce((sum, s) => sum + seatPrice(basePrice, s.category), 0);
    res.status(201).json({
      message: 'Reservation created',
      reference,
      count: seat_ids.length,
      totalPrice: Math.round(totalPrice * 100) / 100,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});
```

**Important:** The `const { seatPrice, generateReference } = require('../utils/pricing');` line goes at the **top of the file** with the other imports (after `const pool = require('../config/db');`), not inside the handler. Remove any duplicate require if present.

- [ ] **Step 3.2: Commit and deploy**

```bash
git add backend/src/routes/reservations.js
git commit -m "backend: POST /reservations accepts seat_ids array with atomic transaction"
git push
```

Railway auto-deploys από το GitHub push. Περίμενε ~60s για το deploy.

- [ ] **Step 3.3: Register a test user (get token)**

```bash
curl -s -X POST https://cn6035-production.up.railway.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"PlanTest","email":"plantest@test.com","password":"123456"}'
```

Expected: `{"message":"User registered successfully",...}` (ή 400 αν το email υπάρχει ήδη).

Login:
```bash
curl -s -X POST https://cn6035-production.up.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"plantest@test.com","password":"123456"}'
```

Copy the `token` from response. Save as variable:
```bash
TOKEN="eyJhbGci...<paste full token>"
```

- [ ] **Step 3.4: Verify multi-seat booking works**

Find 3 seat IDs:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://cn6035-production.up.railway.app/api/showtimes/1/seats" \
  | python -c "import sys, json; d=json.load(sys.stdin); print([s['seat_id'] for s in d[:3]])"
```

Expected: `[1, 2, 3]` (or similar 3 ids).

Book those 3 seats:
```bash
curl -s -X POST https://cn6035-production.up.railway.app/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":1, "seat_ids":[1,2,3]}'
```

Expected:
```json
{"message":"Reservation created","reference":"BK-20260424-XXXX","count":3,"totalPrice":112.5}
```

(112.5 = 3×37.5 if all VIP, or different if mixed — note A1/A2/A3 are row A = VIP).

- [ ] **Step 3.5: Verify concurrency rejection**

Try booking the same seats again:
```bash
curl -s -X POST https://cn6035-production.up.railway.app/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":1, "seat_ids":[1,2,3]}'
```

Expected: `{"message":"3 seat(s) not available"}` (HTTP 409).

- [ ] **Step 3.6: Verify max 10 enforcement**

```bash
curl -s -X POST https://cn6035-production.up.railway.app/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":2, "seat_ids":[145,146,147,148,149,150,151,152,153,154,155]}'
```

Expected: `{"message":"Maximum 10 seats per reservation"}` (HTTP 400). (Seat IDs 145-155 για showtime 2 — έχει 144 seats/showtime ξεκινώντας από ID 145 για showtime 2.)

---

## Task 4: Backend GET — include reservation_reference in response

**Files:**
- Modify: `backend/src/routes/reservations.js` (the GET handler for `/my` and `/reservations`)

- [ ] **Step 4.1: Update SELECT clause in GET handler**

Find the block in `backend/src/routes/reservations.js`:
```js
router.get(['/my', '/reservations'], authMiddleware, async (req, res) => {
```

Replace the inner query with:

```js
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.status, r.created_at,
              r.reservation_reference,
              r.showtime_id,
              s.title AS show_title, t.name AS theatre_name,
              st.date, st.time, st.room, st.price AS base_price,
              se.seat_id, se.seat_number, se.category
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       JOIN seats se ON r.seat_id = se.seat_id
       WHERE r.user_id = ?
       ORDER BY st.date DESC, r.reservation_reference`,
      [req.user.userId]
    );
```

**Also add `price` alias** (keep `price` for backward compat since ProfileScreen uses `item.price`):

```js
       ...st.price AS base_price, st.price AS price,
```

Final SELECT becomes:
```sql
SELECT r.reservation_id, r.status, r.created_at,
       r.reservation_reference,
       r.showtime_id,
       s.title AS show_title, t.name AS theatre_name,
       st.date, st.time, st.room, st.price AS base_price, st.price AS price,
       se.seat_id, se.seat_number, se.category
FROM reservations r
...
```

- [ ] **Step 4.2: Commit and deploy**

```bash
git add backend/src/routes/reservations.js
git commit -m "backend: return reservation_reference and showtime_id in GET /my"
git push
```

Περίμενε ~60s για Railway deploy.

- [ ] **Step 4.3: Verify response includes reference**

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://cn6035-production.up.railway.app/api/user/reservations \
  | python -c "import sys, json; d=json.load(sys.stdin); print(f'Count: {len(d)}'); print(f'First: ref={d[0][\"reservation_reference\"]}, seat={d[0][\"seat_number\"]}') if d else None"
```

Expected: 3 rows, all with same `reservation_reference` (e.g., `BK-20260424-A7X3`).

---

## Task 5: Frontend pricing utility

**Files:**
- Create: `frontend/src/utils/pricing.js`

- [ ] **Step 5.1: Create file**

Create `frontend/src/utils/pricing.js`:

```js
// Category multipliers mirror backend/src/utils/pricing.js
export const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,
  Standard: 1.0,
  Economy: 0.6,
};

export function seatPrice(basePrice, category) {
  const base = parseFloat(basePrice) || 0;
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(base * mult * 100) / 100;
}

export function formatEuro(amount) {
  return `€${amount.toFixed(2)}`;
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/utils/pricing.js
git commit -m "frontend: add pricing utility matching backend multipliers"
```

---

## Task 6: ReservationScreen — multi-select + price breakdown

**Files:**
- Modify: `frontend/src/screens/ReservationScreen.js` (full replacement του relevant sections)

- [ ] **Step 6.1: Add pricing import**

At the top of `ReservationScreen.js`, after the existing imports, add:

```js
import { seatPrice, formatEuro } from '../utils/pricing';
```

- [ ] **Step 6.2: Replace state**

Find:
```js
const [selectedSeat, setSelectedSeat] = useState(null);
```

Replace with:
```js
const [selectedSeats, setSelectedSeats] = useState([]);
const MAX_SEATS = 10;
```

- [ ] **Step 6.3: Add toggle handler (replace setSelectedSeat calls)**

After the `getCategoryColor` function, add:

```js
const toggleSeat = (seat) => {
  const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
  if (isSelected) {
    setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
  } else {
    if (selectedSeats.length >= MAX_SEATS) {
      Alert.alert('Όριο θέσεων', `Μπορείτε να επιλέξετε έως ${MAX_SEATS} θέσεις ανά κράτηση`);
      return;
    }
    setSelectedSeats([...selectedSeats, seat]);
  }
};
```

- [ ] **Step 6.4: Update renderSeat to use array selection**

Replace the existing `renderSeat`:

```js
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
```

- [ ] **Step 6.5: Replace handleConfirm and confirmBooking**

Replace both functions:

```js
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
```

- [ ] **Step 6.6: Replace the selectedInfo block with price breakdown**

Find in the JSX:
```jsx
{selectedSeat && (
  <View style={styles.selectedInfo}>
    <Text style={styles.selectedText}>
      Επιλεγμένη: {selectedSeat.seat_number} ({selectedSeat.category})
    </Text>
  </View>
)}
```

Replace with:

```jsx
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
```

- [ ] **Step 6.7: Update confirm button disabled state**

Find:
```jsx
<TouchableOpacity
  style={[styles.confirmBtn, !selectedSeat && styles.confirmBtnDisabled]}
  onPress={handleConfirm}
  disabled={!selectedSeat || booking}
>
  <Text style={styles.confirmBtnText}>
    {booking ? 'Επεξεργασία...' : 'Επιβεβαίωση Κράτησης'}
  </Text>
</TouchableOpacity>
```

Replace with:
```jsx
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
```

- [ ] **Step 6.8: Add new styles**

In the `StyleSheet.create({...})` block at bottom of file, add (right before the closing `});`):

```js
  selectedHeader: { color: '#e0c068', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  breakdownLine: { color: '#fff', fontSize: 13, marginBottom: 3 },
  divider: { height: 1, backgroundColor: '#0f3460', marginVertical: 6 },
  totalLine: { color: '#e0c068', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
```

Also change the existing `selectedInfo` style from `alignItems: 'center'` to `alignItems: 'flex-start'`:

Find:
```js
selectedInfo: {
  backgroundColor: '#16213e', borderRadius: 8,
  padding: 12, marginBottom: 16, alignItems: 'center',
},
```

Replace with:
```js
selectedInfo: {
  backgroundColor: '#16213e', borderRadius: 8,
  padding: 12, marginBottom: 16, alignItems: 'stretch',
},
```

- [ ] **Step 6.9: Commit**

```bash
git add frontend/src/screens/ReservationScreen.js
git commit -m "frontend: ReservationScreen supports multi-select with price breakdown"
```

---

## Task 7: ProfileScreen — group reservations by reference

**Files:**
- Modify: `frontend/src/screens/ProfileScreen.js`

- [ ] **Step 7.1: Add pricing import**

Add at the top (after existing imports):

```js
import { seatPrice, formatEuro } from '../utils/pricing';
```

- [ ] **Step 7.2: Add grouping logic**

Find the filter block:
```js
const upcomingReservations = reservations.filter(
  r => r.status === 'confirmed' && isFuture(r.date)
);
const pastReservations = reservations.filter(
  r => r.status === 'cancelled' || !isFuture(r.date)
);
```

**Replace** with grouping-aware logic:

```js
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

const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
const cancelledReservations = reservations.filter(r => r.status === 'cancelled');

const upcomingBookings = groupBookings(confirmedReservations.filter(r => isFuture(r.date)));
const pastBookings = groupBookings([
  ...cancelledReservations,
  ...confirmedReservations.filter(r => !isFuture(r.date)),
]);

// Keep legacy names for stats row (count individual seat reservations, not bookings)
const upcomingReservations = confirmedReservations.filter(r => isFuture(r.date));
const pastReservations = [
  ...cancelledReservations,
  ...confirmedReservations.filter(r => !isFuture(r.date)),
];
```

- [ ] **Step 7.3: Update displayedReservations to use bookings**

Find:
```js
const displayedReservations = activeTab === 'upcoming' ? upcomingReservations : pastReservations;
```

Replace with:
```js
const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
```

- [ ] **Step 7.4: Rewrite renderReservation as renderBooking**

Find the entire `renderReservation` function (starts with `const renderReservation = ({ item }) => {`) and replace:

```js
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
```

- [ ] **Step 7.5: Update FlatList to use bookings**

Find:
```jsx
<FlatList
  data={displayedReservations}
  keyExtractor={(item) => item.reservation_id.toString()}
  renderItem={renderReservation}
```

Replace with:
```jsx
<FlatList
  data={displayedBookings}
  keyExtractor={(item, index) => item.reference || `fallback-${index}`}
  renderItem={renderBooking}
```

- [ ] **Step 7.6: Add new styles**

At the bottom of the `StyleSheet.create({...})` block (before closing `});`), add:

```js
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
```

- [ ] **Step 7.7: Commit**

```bash
git add frontend/src/screens/ProfileScreen.js
git commit -m "frontend: ProfileScreen groups reservations by booking reference"
```

---

## Task 8: End-to-end iPhone testing

**Files:** None (manual testing)

- [ ] **Step 8.1: Start Expo**

Run:
```bash
cd frontend && npx expo start
```

Scan QR με Expo Go στο iPhone.

- [ ] **Step 8.2: Test happy path — multi-seat booking**

1. Login με υπάρχοντα user (ή register νέο)
2. Theatre → Show → Showtime
3. Επίλεξε 3 θέσεις: 1 από VIP, 1 από Standard, 1 από Economy
4. Verify bottom panel δείχνει:
   ```
   Επιλογή (3/10)
   1× VIP (€37.50) = €37.50
   1× Standard (€25.00) = €25.00
   1× Economy (€15.00) = €15.00
   ━━━━━━━━━━━━
   Σύνολο: €77.50
   ```
5. Πάτα το κουμπί "Κράτηση 3 θέσεων"
6. Πάτα "Επιβεβαίωση" στο alert
7. Verify success alert με reference κωδικό (π.χ. `BK-20260424-XXXX`)
8. Tap "OK" → μεταφορά στο Profile

- [ ] **Step 8.3: Verify Profile grouping**

Στο Profile:
1. Το tab "Επερχόμενες" δείχνει ένα card
2. Το card έχει:
   - Τίτλο παράστασης
   - Reference code (🎫 BK-...)
   - Ημερομηνία, ώρα, αίθουσα
   - 3 γραμμές θέσεων (μία για κάθε seat) με τιμές
   - Σύνολο στο κάτω μέρος
3. Κάθε γραμμή θέσης έχει "Αλλαγή" και "Ακύρωση" κουμπιά

- [ ] **Step 8.4: Test seat cancellation**

1. Στο card, πάτα "Ακύρωση" σε μία θέση (π.χ. την Economy)
2. Confirm alert
3. Verify ότι το card τώρα δείχνει την θέση με [ακυρώθηκε] και strikethrough
4. Verify ότι το "Σύνολο" αντικαθρεφτίζει τη νέα τιμή (χωρίς την ακυρωμένη)

- [ ] **Step 8.5: Test seat change**

1. Στο ίδιο card, πάτα "Αλλαγή" σε μία active θέση
2. Στο modal, επίλεξε νέα θέση
3. Confirm
4. Verify ότι το card ενημερώνεται με τη νέα θέση

- [ ] **Step 8.6: Test max 10 limit**

1. Πήγαινε σε νέο showtime
2. Επίλεξε 10 θέσεις
3. Προσπάθησε να επιλέξεις την 11η
4. Verify alert "Μπορείτε να επιλέξετε έως 10 θέσεις"

- [ ] **Step 8.7: Test empty selection**

1. Αποεπίλεξε όλες τις θέσεις
2. Verify κουμπί εμφανίζει "Επιλέξτε θέσεις" και είναι disabled

---

## Task 9: Final push

**Files:** None

- [ ] **Step 9.1: Verify git status is clean**

```bash
git status
```

Expected: "nothing to commit, working tree clean" ή μόνο untracked files (π.χ. node_modules, που αγνοούνται).

- [ ] **Step 9.2: Push to GitHub**

```bash
git push
```

Expected: όλα τα commits πάνε στο origin/main. Railway αυτόματα τα ανιχνεύει αλλά επειδή backend αλλαγές ήδη pushed (στα Tasks 3, 4), δεν χρειάζεται redeploy.

- [ ] **Step 9.3: Verify on public URL one last time**

```bash
curl -s https://cn6035-production.up.railway.app/api/theatres | python -c "import sys,json; print(f'Theatres: {len(json.load(sys.stdin))}')"
```

Expected: `Theatres: 6`

---

## Verification Summary

| Verification | Method | Location |
|--------------|--------|----------|
| Schema updated | `SHOW COLUMNS` Node script | Task 1.4 |
| Pricing helper works | `node -e` test | Task 2.2 |
| POST accepts array | curl | Task 3.4 |
| Concurrency protection | curl | Task 3.5 |
| Max 10 enforcement | curl | Task 3.6 |
| GET returns reference | curl | Task 4.3 |
| Multi-select UI | iPhone | Task 8.2 |
| Price breakdown | iPhone | Task 8.2 |
| Profile grouping | iPhone | Task 8.3 |
| Cancel single seat | iPhone | Task 8.4 |
| Change seat | iPhone | Task 8.5 |
| Max 10 UI limit | iPhone | Task 8.6 |

---

## Rollback Plan

Αν κάτι σπάσει στο production (Railway):
1. `git revert <commit-sha>` για το backend change
2. `git push` για να γίνει auto-redeploy στο Railway
3. Το schema change είναι backward compatible (nullable column), άρα δεν χρειάζεται DB rollback

Αν η βάση έχει corruptive state:
1. Τρέξε ξανά `node backend/import-to-railway.js "<URL>"` — θα DROP/RECREATE τα tables
