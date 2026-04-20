# CN6035 — Theatre Seat Reservation App: Design Spec
**Date:** 2026-03-31
**Course:** CN6035 Mobile & Distributed Systems
**Approach:** Approach 2 — Full Polish

---

## Context

Mobile app για κράτηση θέσεων σε θεατρικές παραστάσεις. Stack: React Native (Expo) + Node.js/Express + MariaDB + JWT. Το project είναι σε μεγάλο βαθμό υλοποιημένο. Αυτό το spec καλύπτει τα gaps που απομένουν για να καλυφθούν 100% οι απαιτήσεις της εργασίας.

**Constraints:**
- Live demo μέσω Expo Go σε iPhone
- Μόνος φοιτητής
- Απλό JWT (όχι Keycloak/OIDC)
- Παράδοση: Week 13

---

## Current State

### Τι είναι ήδη υλοποιημένο ✅
- Database: `users`, `theatres`, `shows`, `showtimes`, `seats`, `reservations`
- Backend routes: `/register`, `/login`, `/theatres`, `/shows`, `/showtimes/:id/seats`, `/reservations` (POST/PUT/DELETE), `/reservations/my`
- JWT middleware
- Frontend screens: Login, Register, TheatreList, ShowList, ShowDetail, Reservation, Profile
- Search σε theatres και shows
- Seat grid visualization με κατηγορίες (VIP/Standard/Economy)
- Cancel reservation στο ProfileScreen

### Gaps που καλύπτει αυτό το spec
1. Endpoint `/user/reservations` (απαίτηση εργασίας, υπάρχει ως `/reservations/my`)
2. UI για "Αλλαγή Θέσης" στο ProfileScreen (backend υπάρχει, λείπει frontend)
3. `config.js` για εύκολη αλλαγή IP πριν demo
4. Expo SDK 54 compatibility fix
5. `README.md` για GitHub (απαίτηση εργασίας)

---

## Section 1: Backend Changes

### 1.1 Προσθήκη `/user/reservations` endpoint

**Αρχείο:** `backend/server.js`

Προσθήκη νέου route mount:
```js
app.use('/api/user', reservationRoutes);
```

Αυτό εκθέτει το `GET /api/user/reservations` (το `/my` route του reservationRoutes) χωρίς να σπάει το υπάρχον `/api/reservations/my`.

**Γιατί:** Η εργασία απαιτεί ρητά το path `/user/reservations`.

---

## Section 2: Frontend Changes

### 2.1 `src/config.js` — Κεντρικό API URL

**Νέο αρχείο:** `frontend/src/config.js`
```js
export const API_URL = 'http://YOUR_IP:3000/api';
```

`api.js` διαβάζει από εκεί. Πριν το demo: αλλαγή μόνο αυτής της γραμμής.

### 2.2 ProfileScreen — "Αλλαγή Θέσης"

Προσθήκη κουμπιού "Αλλαγή Θέσης" δίπλα στο "Ακύρωση" για confirmed + future κρατήσεις.

**Flow:**
1. User πατά "Αλλαγή Θέσης"
2. Modal ανοίγει με seat grid (ίδιο component με ReservationScreen)
3. User επιλέγει νέα θέση → `PUT /api/reservations/:id` με `{ new_seat_id }`
4. Alert επιτυχίας → refresh λίστας

### 2.3 Register Success Feedback

Μετά από επιτυχή εγγραφή: Alert "Εγγραφή επιτυχής! Συνδεθείτε." → navigate to Login.

---

## Section 3: DevOps & Παράδοση

### 3.1 Expo SDK Fix

Ενημέρωση `package.json` για SDK 54 με `--legacy-peer-deps`. Επαλήθευση ότι το Expo Go φορτώνει την εφαρμογή.

### 3.2 README.md

**Αρχείο:** `README.md` στη ρίζα του project.

Περιεχόμενο:
- Περιγραφή εφαρμογής
- Tech stack
- Οδηγίες εγκατάστασης (backend + frontend + database)
- API endpoints
- Screenshots (προαιρετικά)

### 3.3 GitHub

Repo structure:
```
CN6035/
├── backend/
├── frontend/
├── database/
└── README.md
```

---

## Demo Flow (Live)

1. XAMPP ανοιχτό → MariaDB running
2. `npm run dev` στο backend terminal
3. iPhone Hotspot ON → PC συνδεδεμένο σε hotspot
4. Αλλαγή IP στο `config.js`
5. `npx expo start` → scan QR με Expo Go
6. Demo: Register → Login → Browse theatres → Select show → Pick showtime → Reserve seat → Profile → Cancel/Change

---

## Evaluation Coverage

| Κριτήριο | Βαθμός | Κάλυψη |
|----------|--------|--------|
| UI/UX | 10% | ✅ Consistent dark theme, Greek UI |
| Functionality | 15% | ✅ Όλα τα CRUD operations |
| User Feedback | 5% | ✅ Alerts σε όλες τις actions |
| Backend Architecture | 10% | ✅ Routes/middleware separation |
| Security (JWT) | 5% | ✅ JWT σε protected routes |
| DB Integration | 5% | ✅ mysql2 pool, transactions |
| DB Structure | 10% | ✅ FK, indexes, proper relations |
| DB Queries | 10% | ✅ JOINs, transactions, FOR UPDATE |
| **Σύνολο** | **70%** | ✅ |
