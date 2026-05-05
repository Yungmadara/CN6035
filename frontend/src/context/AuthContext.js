// ============================================================
//  AuthContext — Global Authentication State
// ============================================================
//
//  React Context που προσφέρει στις screens:
//    • user      — current logged-in user object (ή null)
//    • token     — JWT (ή null)
//    • loading   — true ενώ φορτώνουμε από secure store
//    • login()   — αποθηκεύει credentials + ενημερώνει state
//    • logout()  — διαγράφει credentials + καθαρίζει state
//
//  Persistence: τα credentials αποθηκεύονται στο expo-secure-store
//  (iOS Keychain / Android Keystore). Έτσι ο user μένει logged-in
//  μετά από restart του app μέχρι να κάνει manual logout ή να
//  λήξει το JWT.
//
//  Χρήση σε components:
//    const { user, login, logout } = useAuth();
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // { id, name, email } ή null
  const [token, setToken] = useState(null);   // JWT string ή null
  const [loading, setLoading] = useState(true); // true ενώ διαβάζουμε από secure store

  // Στο mount, δοκιμάζουμε να φορτώσουμε υπάρχοντα session.
  // Αν υπάρχει, ο user "συνδέεται αυτόματα".
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to load auth', err);
    } finally {
      // Set loading=false είτε με success είτε με failure → άνοιγμα app
      setLoading(false);
    }
  };

  // Καλείται από LoginScreen / RegisterScreen μετά από επιτυχή απάντηση API
  const login = async (tokenValue, userData) => {
    // Persist σε encrypted storage ώστε να επιβιώνει το app restart
    await SecureStore.setItemAsync('token', tokenValue);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  // Καλείται από ProfileScreen όταν ο user πατήσει "Έξοδος"
  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — απλοποιεί το useContext(AuthContext) σε όλα τα screens
export const useAuth = () => useContext(AuthContext);
