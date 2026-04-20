import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TheatreListScreen from '../screens/TheatreListScreen';
import ShowListScreen from '../screens/ShowListScreen';
import ShowDetailScreen from '../screens/ShowDetailScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#e0c068',
  headerTitleStyle: { fontWeight: 'bold' },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

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
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Σύνδεση' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Εγγραφή' }} />
          </>
        ) : (
          <>
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
