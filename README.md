# CN6035 — Theatre Seat Reservation App

Mobile application for theatre seat reservations, developed for the CN6035 Mobile & Distributed Systems course.

## Tech Stack

- **Frontend:** React Native (Expo SDK 54)
- **Backend:** Node.js + Express
- **Database:** MariaDB (via XAMPP)
- **Authentication:** JWT (JSON Web Tokens)

## Project Structure

```
CN6035/
├── backend/          # Node.js REST API
├── frontend/         # React Native (Expo) app
├── database/         # SQL schema and seed data
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18+)
- XAMPP (MariaDB)
- Expo Go app (iOS/Android)

### 1. Database Setup

1. Start XAMPP → Start Apache & MySQL
2. Open phpMyAdmin → SQL tab
3. Run `database/schema.sql`
4. Run `database/seed.sql`

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
```

Edit `src/config.js` and set your machine's local IP:
```js
export const API_URL = 'http://YOUR_IP:3000/api';
```

Then start Expo:
```bash
npx expo start
```

Scan the QR code with Expo Go on your device.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Register new user |
| POST | `/api/login` | No | Login, returns JWT |
| GET | `/api/theatres` | No | List all theatres |
| GET | `/api/shows` | No | List shows (filter by theatreId, title, date) |
| GET | `/api/shows/:id/showtimes` | No | Showtimes for a show |
| GET | `/api/showtimes/:id/seats` | Yes | Seat availability |
| POST | `/api/reservations` | Yes | Create reservation |
| PUT | `/api/reservations/:id` | Yes | Change seat |
| DELETE | `/api/reservations/:id` | Yes | Cancel reservation |
| GET | `/api/user/reservations` | Yes | User's reservations |

## Features

- User registration and login with JWT authentication
- Browse theatres and performances
- Search by theatre name, location, or show title
- View show details and available showtimes
- Interactive seat selection (VIP / Standard / Economy)
- Reservation management: create, change seat, cancel
- User profile with reservation history
