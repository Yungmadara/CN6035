// ============================================================
//  API Configuration
// ============================================================
//
//  Ορίζει το base URL του REST API που καλεί το mobile app.
//
//  ΔΥΟ ΠΕΡΙΠΤΩΣΕΙΣ ΧΡΗΣΗΣ:
//
//  1. Local development (backend τρέχει στο laptop σου):
//     export const API_URL = 'http://YOUR_LAN_IP:3000/api';
//     • YOUR_LAN_IP = IPv4 του PC (δες με `ipconfig`, π.χ. 192.168.1.137)
//     • Το iPhone και το PC πρέπει να είναι στο ίδιο WiFi
//     • Ξεκινάμε backend με: cd backend && npm run dev
//
//  2. Production (backend στο Railway, προσβάσιμο από παντού):
//     export const API_URL = 'https://cn6035-production.up.railway.app/api';
//     • Δεν χρειάζεται τοπικό backend ούτε XAMPP
//     • iPhone/PC μπορούν να είναι σε διαφορετικά δίκτυα
// ============================================================

export const API_URL = 'https://cn6035-production.up.railway.app/api';
