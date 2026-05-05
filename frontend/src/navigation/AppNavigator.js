// ============================================================
//  AppNavigator — Stack Navigation
// ============================================================
//
//  Το root navigation component του app. Χρησιμοποιεί
//  React Navigation Stack Navigator για να δείξει διαφορετικά
//  screens ανάλογα με το αν ο χρήστης είναι logged-in.
//
//  Auth-gating logic:
//   • Αν user === null → public stack (Login / Register)
//   • Αν user        → main app stack (Theatres / Shows / ...)
//
//  Όλα τα screens μοιράζονται ίδιο dark theme για συνέπεια.
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Import όλων των screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TheatreListScreen from '../screens/TheatreListScreen';
import ShowListScreen from '../screens/ShowListScreen';
import ShowDetailScreen from '../screens/ShowDetailScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

// Default styling για όλα τα headers (dark theme + gold accent)
const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },     // dark navy background
  headerTintColor: '#e0c068',                      // gold για back button + title
  headerTitleStyle: { fontWeight: 'bold' },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Splash-like state ενώ φορτώνουμε το JWT από secure store.
  // Χωρίς αυτό, ο user θα έβλεπε για ένα flash την οθόνη Login
  // πριν γίνει auto-login.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#e0c068" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // ── Public stack — μη συνδεδεμένος χρήστης ───────────
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Σύνδεση' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Εγγραφή' }} />
          </>
        ) : (
          // ── Authenticated stack — main flow του app ──────────
          <>
            {/* Hero banner του TheatreListScreen δουλεύει σαν header,
                οπότε το default header απενεργοποιείται. */}
            <Stack.Screen name="Theatres" component={TheatreListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Shows" component={ShowListScreen} options={{ title: 'Παραστάσεις' }} />
            <Stack.Screen name="ShowDetail" component={ShowDetailScreen} options={{ title: 'Λεπτομέρειες' }} />
            <Stack.Screen name="Reservation" component={ReservationScreen} options={{ title: 'Κράτηση Θέσης' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Προφίλ' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
