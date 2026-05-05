// ============================================================
//  App.js — Root Component
// ============================================================
//
//  Entry point του Expo / React Native app. Wrap-άρει το
//  AppNavigator μέσα στο AuthProvider ώστε όλα τα screens να
//  έχουν access στο user/token state μέσω useAuth().
//
//  Tree:
//    <AuthProvider>
//      <AppNavigator>
//        <NavigationContainer>
//          <Stack.Navigator>
//            ... screens ...
// ============================================================

// Required για να δουλέψουν τα swipe gestures του React Navigation
import 'react-native-gesture-handler';

import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
