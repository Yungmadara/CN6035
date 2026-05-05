// ============================================================
//  API Service — Axios Instance
// ============================================================
//
//  Δημιουργεί ένα προκαθορισμένο Axios client με:
//   • baseURL από το config.js (Railway ή localhost)
//   • timeout 10 δευτερολέπτων (αποφεύγουμε hangs σε αργό δίκτυο)
//   • Request interceptor που αυτόματα προσθέτει το JWT token
//     από το expo-secure-store σε κάθε request.
//
//  Έτσι, όλα τα screens κάνουν api.get('/theatres') χωρίς να
//  ασχολούνται με headers, base URL, ή token storage.
// ============================================================

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

// ── Δημιουργία axios instance ──────────────────────────────
const api = axios.create({
  baseURL: API_URL,    // π.χ. https://cn6035-production.up.railway.app/api
  timeout: 10000,      // 10 sec — απαντήσεις πρέπει να έρθουν ή να γίνει abort
});

// ── Request Interceptor: αυτόματο JWT attach ───────────────
//
// Τρέχει ΠΡΙΝ από κάθε request. Διαβάζει το token που έχει
// αποθηκευτεί στο expo-secure-store (encrypted keychain στο iOS
// / Android Keystore) και το βάζει στο Authorization header.
//
// Έτσι ένα call όπως api.post('/reservations', ...) στέλνει
// αυτόματα: "Authorization: Bearer eyJhbGc..."
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
