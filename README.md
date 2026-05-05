# CN6035 — Theatre Seat Reservation App

> Mobile εφαρμογή για κρατήσεις θέσεων σε θεατρικές παραστάσεις, αναπτυγμένη για το μάθημα **CN6035 — Mobile & Distributed Systems**.

Πρόκειται για ένα ολοκληρωμένο 3-tier κατανεμημένο σύστημα: ένας React Native mobile client επικοινωνεί με ένα Node.js/Express REST API, το οποίο αποθηκεύει δεδομένα σε MySQL βάση. Η authentication γίνεται με **JWT**, και ολόκληρο το backend (API + DB) είναι **deployed στο cloud (Railway)**, οπότε η εφαρμογή μπορεί να τρέξει από οποιοδήποτε δίκτυο χωρίς τοπική εγκατάσταση backend.

---

## 📑 Πίνακας Περιεχομένων
1. [Tech Stack](#tech-stack)
2. [Live Backend](#live-backend)
3. [Δομή Project](#δομή-project)
4. [Λειτουργικότητα](#λειτουργικότητα)
5. [Εγκατάσταση](#εγκατάσταση)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Troubleshooting](#troubleshooting)
9. [Αρχιτεκτονική Σχεδίαση](#αρχιτεκτονική-σχεδίαση)

---

## Tech Stack

| Layer | Τεχνολογία |
|-------|-------------|
| **Mobile** | React Native (Expo SDK 54) |
| **Backend** | Node.js + Express |
| **Database** | MySQL 8.0 (συμβατό με MariaDB) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Secure Storage** | expo-secure-store (iOS Keychain / Android Keystore) |
| **HTTP Client** | Axios με JWT interceptor |
| **Navigation** | React Navigation (Stack) |
| **Hosting** | Railway (auto-deploy από GitHub) |
| **Tools** | Git, Postman, Expo Go, Python (seed generator) |

---

## Live Backend

Το backend τρέχει 24/7 στο Railway:

🌐 **https://cn6035-production.up.railway.app**

Δοκίμασε:
```bash
curl https://cn6035-production.up.railway.app/             # health check
curl https://cn6035-production.up.railway.app/api/theatres # public API
```

---

## Δομή Project

```
CN6035/
├── backend/                          # Node.js REST API
│   ├── server.js                     # Express entry point + route mounting
│   ├── package.json
│   ├── .env.example                  # Template για env vars
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MySQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /register, /login
│   │   │   ├── theatres.js           # GET /theatres
│   │   │   ├── shows.js              # GET /shows + /shows/:id/showtimes
│   │   │   ├── seats.js              # GET /showtimes/:id/seats (JWT)
│   │   │   └── reservations.js       # POST/PUT/DELETE/GET (JWT)
│   │   └── utils/
│   │       └── pricing.js            # Category multipliers + reference codes
│   └── import-to-railway.js          # Φορτώνει schema+seed στο Railway MySQL
│
├── frontend/                         # React Native (Expo) app
│   ├── App.js                        # Root component
│   ├── app.json                      # Expo config
│   └── src/
│       ├── config.js                 # API_URL (Railway ή localhost)
│       ├── services/
│       │   └── api.js                # Axios instance με JWT interceptor
│       ├── context/
│       │   └── AuthContext.js        # Global auth state (user/token/login/logout)
│       ├── navigation/
│       │   └── AppNavigator.js       # Stack Navigator (auth-gated)
│       ├── utils/
│       │   └── pricing.js            # Frontend mirror των backend multipliers
│       └── screens/
│           ├── LoginScreen.js
│           ├── RegisterScreen.js
│           ├── TheatreListScreen.js  # Hero + stats + filters + list
│           ├── ShowListScreen.js
│           ├── ShowDetailScreen.js
│           ├── ReservationScreen.js  # Multi-seat selection + breakdown
│           └── ProfileScreen.js      # Tabs + grouped bookings + manage
│
├── database/
│   ├── schema.sql                    # CREATE TABLE statements
│   ├── seed.sql                      # 6 theatres + 14 shows + 20 showtimes + 2880 seats
│   ├── generate-seed.py              # Python script που παράγει το seed.sql
│   └── railway-setup.sql             # Combined DROP + schema + seed για Railway
│
├── presentation/
│   └── generate-pptx.py              # Python script που παράγει το PowerPoint
│
├── CN6035_Presentation.pptx          # 12-slide παρουσίαση
└── README.md                         # Αυτό το αρχείο
```

---

## Λειτουργικότητα

### Χρήστης
- ✅ **Εγγραφή / Σύνδεση** με email + password
- ✅ **JWT 7-ημερών** σε encrypted secure storage
- ✅ Auto-login μετά από restart του app

### Περιήγηση
- ✅ **Λίστα θεάτρων** με hero banner, stats, filters (Τραγωδία/Κωμωδία/Αρχαία/Σαίξπηρ)
- ✅ **Αναζήτηση** ανά όνομα θεάτρου ή τοποθεσία
- ✅ **Λεπτομέρειες παράστασης** με σκηνοθέτη, ηθοποιούς, διάρκεια, age rating
- ✅ **Showtimes** με ημερομηνία, ώρα, αίθουσα, τιμή
- ✅ **Pull-to-refresh** σε λίστες

### Κρατήσεις
- ✅ **Multi-seat selection** (μέχρι 10 θέσεις ανά κράτηση)
- ✅ **3 κατηγορίες θέσεων**: VIP / Standard / Economy με διαφορετικές τιμές
- ✅ **Live price breakdown** ανά κατηγορία + σύνολο
- ✅ **Atomic transaction** στο backend — είτε ΟΛΕΣ ή ΚΑΜΙΑ
- ✅ **Booking reference code** (π.χ. `BK-20260424-A7F3C2`)
- ✅ **Concurrency safety**: SELECT FOR UPDATE locks αποτρέπουν διπλή κράτηση
- ✅ Validation: positive integers, no duplicates, max 10

### Διαχείριση
- ✅ **Tabs**: Επερχόμενες / Ιστορικό
- ✅ **Grouped bookings** (μία κάρτα ανά reference με όλες τις θέσεις)
- ✅ **Per-seat actions**: αλλαγή θέσης (modal) ή ακύρωση
- ✅ **Smart tab placement**: μερικώς ακυρωμένες future κρατήσεις παραμένουν στις Επερχόμενες
- ✅ **Strikethrough** στις ακυρωμένες θέσεις μέσα σε ενεργό booking

---

## Εγκατάσταση

### Προαπαιτούμενα
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **Expo Go** app στο iPhone/Android ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Git** ([git-scm.com](https://git-scm.com))
- *Προαιρετικά*: XAMPP για τοπική MySQL (αν δεν θες να χρησιμοποιήσεις Railway)

### 1. Clone

```bash
git clone https://github.com/Yungmadara/CN6035.git
cd CN6035
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Δημιούργησε `backend/.env` με βάση το `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=theatre_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. Database (μόνο για local development)

**Επιλογή A — XAMPP (τοπικά):**
1. Start XAMPP → Apache + MySQL
2. phpMyAdmin → SQL tab → εκτέλεση `database/schema.sql`
3. SQL tab → εκτέλεση `database/seed.sql`

**Επιλογή B — Skip (χρήση Railway):**
- Άσε το `frontend/src/config.js` να δείχνει στο Railway URL (default)
- Δεν χρειάζεται καθόλου τοπική βάση

### 4. Run Backend (μόνο αν θες local)

```bash
cd backend
npm run dev
# → Server running on port 3000
```

### 5. Frontend Setup

```bash
cd ../frontend
npm install --legacy-peer-deps
```

Στο `frontend/src/config.js` διάλεξε API target:

```js
// Local backend:
export const API_URL = 'http://YOUR_LAN_IP:3000/api';

// Railway (default):
export const API_URL = 'https://cn6035-production.up.railway.app/api';
```

Για να βρεις το LAN IP σου: `ipconfig` (Windows) ή `ifconfig` (macOS/Linux) — IPv4 address.

### 6. Run Frontend

```bash
npx expo start
```

Σκάναρε το QR με Expo Go στο κινητό σου.

> ⚠️ **iPhone και PC πρέπει να είναι στο ίδιο WiFi** για να λειτουργεί το LAN. Αν το δίκτυο έχει AP isolation (συχνό σε εταιρικά WiFi), δοκίμασε:
> - `npx expo start --tunnel` (αργό αλλά λειτουργεί από παντού)
> - Ή προσωπικό hotspot από το κινητό σου

---

## API Reference

| Method | Endpoint | Auth | Body / Query | Response |
|--------|----------|------|--------------|----------|
| POST   | `/api/register`           | —   | `{name, email, password}` | `{message, userId}` |
| POST   | `/api/login`              | —   | `{email, password}` | `{token, user}` |
| GET    | `/api/theatres`           | —   | `?search=text` | `[{theatre_id, name, location, show_count, next_show_date, ...}]` |
| GET    | `/api/theatres/:id`       | —   | — | `{theatre_id, name, location, description}` |
| GET    | `/api/shows`              | —   | `?theatreId=X&title=Y&date=Z` | `[{show_id, title, theatre_name, ...}]` |
| GET    | `/api/shows/:id`          | —   | — | `{show_id, title, description, ...}` |
| GET    | `/api/shows/:id/showtimes`| —   | — | `[{showtime_id, date, time, room, price, ...}]` |
| GET    | `/api/showtimes/:id/seats`| JWT | — | `[{seat_id, seat_number, category, is_available}]` |
| POST   | `/api/reservations`       | JWT | `{showtime_id, seat_ids: [1,2,3]}` | `{reference, count, totalPrice}` |
| PUT    | `/api/reservations/:id`   | JWT | `{new_seat_id}` | `{message}` |
| DELETE | `/api/reservations/:id`   | JWT | — | `{message}` |
| GET    | `/api/user/reservations`  | JWT | — | `[{reservation_id, reservation_reference, seat_number, ...}]` |
| GET    | `/api/reservations/my`    | JWT | — | _alias του παραπάνω_ |

### Παραδείγματα

**Register:**
```bash
curl -X POST https://cn6035-production.up.railway.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Γιώργος","email":"giorgos@test.com","password":"123456"}'
```

**Login + Multi-seat booking:**
```bash
TOKEN=$(curl -s -X POST .../api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"giorgos@test.com","password":"123456"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -X POST .../api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":1, "seat_ids":[1,2,3]}'
# → {"reference":"BK-20260424-A7F3C2","count":3,"totalPrice":112.5}
```

---

## Database Schema

```
users (user_id PK, name, email UNIQUE, password [bcrypt], created_at)

theatres (theatre_id PK, name, location, description)

shows (show_id PK,
       theatre_id FK → theatres ON DELETE CASCADE,
       title, description, duration, age_rating)

showtimes (showtime_id PK,
           show_id FK → shows ON DELETE CASCADE,
           date, time, room,
           total_seats, available_seats,  -- denormalized counter
           price)                          -- base = Standard

seats (seat_id PK,
       showtime_id FK → showtimes ON DELETE CASCADE,
       seat_number, category, is_available)

reservations (reservation_id PK,
              user_id FK → users ON DELETE CASCADE,
              showtime_id FK → showtimes ON DELETE CASCADE,
              seat_id FK → seats ON DELETE CASCADE,
              reservation_reference,    -- group key (e.g. BK-20260424-A7F3C2)
              status [confirmed|cancelled],
              created_at,
              INDEX idx_reservation_reference)
```

### Seed Data

- **6 θέατρα**: Εθνικό, Βρετάνια, ΚΘΒΕ, Λυκαβηττού, Ηρώδειο, Πειραιά
- **14 παραστάσεις** με πραγματικούς σκηνοθέτες (Λιβαθινός, Χουβαρδάς, Τερζόπουλος…) και ηθοποιούς
- **20 showtimes** σε Απρίλιο–Ιούνιο 2026
- **2880 θέσεις** (144 ανά showtime: 2 σειρές VIP × 12 + 6 σειρές Standard × 12 + 4 σειρές Economy × 12)

Παράγονται προγραμματιστικά από το `database/generate-seed.py`.

---

## Troubleshooting

### "Network error" στο iPhone
- **Στο σπίτι**: βεβαιώσου ότι το iPhone είναι στο ίδιο WiFi με το PC
- **Στη δουλειά / public WiFi**: συχνά υπάρχει AP isolation που μπλοκάρει — λύσεις:
  - `npx expo start --tunnel` (μέσω ngrok)
  - Άνοιξε hotspot από κινητό και σύνδεσε σε αυτό
  - Εναλλακτικά, βάλε `API_URL` στο Railway URL — δεν χρειάζεται LAN

### "Cannot read properties of undefined (reading 'body')" στο Expo tunnel
- Γνωστό bug @expo/ngrok με SDK 54
- Workaround: `npm install -g @expo/ngrok` global

### Foreign key error κατά την κράτηση
- Συμβαίνει αν το JWT δείχνει σε χρήστη που έχει διαγραφεί (π.χ. μετά από DB reset)
- **Λύση**: Logout από το app + Register ξανά

### Ο backend τρέχει αλλά τα requests βγάζουν 502 στο Railway
- Πιθανώς λάθος `PORT` στα env vars — βεβαιώσου ότι ταιριάζει με το target port του domain
- Έλεγξε τα Deploy Logs στο Railway dashboard

### "Theatres: 0" από API
- Η βάση είναι άδεια — τρέξε `node backend/import-to-railway.js "<MYSQL_PUBLIC_URL>"`
- Ή για local: εκτέλεσε `database/schema.sql` + `database/seed.sql` σε phpMyAdmin

---

## Αρχιτεκτονική Σχεδίαση

### 3-Tier Distribution

```
┌─────────────┐    HTTPS    ┌──────────────┐  internal  ┌──────────────┐
│  iPhone     │ ◄────────►  │  Node API    │ ◄────────► │  MySQL       │
│  (Expo Go)  │  JSON       │  (Express)   │  (TCP/SQL) │  (Railway)   │
└─────────────┘             └──────────────┘            └──────────────┘
   React Native               Railway service              Railway DB
   - JWT in secure store      - JWT middleware              - 6 tables
   - Axios interceptor        - mysql2 pool                 - FK CASCADE
   - Stack navigation         - bcrypt + JWT                - Indexes
```

### Concurrency Strategy

Όταν 2+ χρήστες προσπαθούν να κρατήσουν την ίδια θέση:

1. Όλες οι requests φτάνουν στο `POST /api/reservations`
2. Καθεμία ξεκινά transaction με `BEGIN`
3. Εκτελεί `SELECT ... FOR UPDATE` στις requested seats
4. **MySQL serialize-άρει** τα requests μέσω row-level locks
5. Πρώτο COMMIT επιτυγχάνει
6. Δεύτερο: το `is_available = TRUE` δεν ισχύει πια → 409 Conflict

Αποτέλεσμα: **garantied no double-booking**, χωρίς application-level locking ή queue.

### Auth Flow

1. POST /login → bcrypt.compare → jwt.sign → επιστρέφει token
2. Frontend: SecureStore.setItemAsync('token', ...)
3. Σε κάθε API call, axios interceptor προσθέτει `Authorization: Bearer ...`
4. Backend authMiddleware: jwt.verify → req.user
5. Logout: SecureStore.deleteItemAsync

### Pricing Strategy

- Base price ανά showtime αποθηκεύεται στη βάση (= Standard tier)
- VIP × 1.5, Economy × 0.6 — multipliers ορίζονται ΜΟΝΟ στο backend
- Frontend έχει mirror copy ΜΟΝΟ για live preview στο UI
- Η αυθεντική τιμή πάντα υπολογίζεται server-side στο POST /reservations

---

## Άδεια Χρήσης

Academic project για το CN6035 — Mobile & Distributed Systems. Δεν προορίζεται για production χρήση.

## Συγγραφέας

Yungmadara — github.com/Yungmadara
