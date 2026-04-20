import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε email και κωδικό');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      await login(res.data.token, res.data.user);
    } catch (err) {
      Alert.alert('Αποτυχία Σύνδεσης', err.response?.data?.message || 'Λάθος email ή κωδικός');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.icon}>🎭</Text>
        <Text style={styles.title}>Theatre Reservation</Text>
        <Text style={styles.subtitle}>Κρατήσεις Θεατρικών Παραστάσεων</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Σύνδεση</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Κωδικός</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Σύνδεση...' : 'Σύνδεση'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Δεν έχετε λογαριασμό; <Text style={styles.linkBold}>Εγγραφή</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#1a1a2e',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, color: '#e0c068', fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  card: {
    width: '100%', backgroundColor: '#16213e',
    borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#0f3460',
    marginBottom: 20,
  },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff',
    borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#0f3460',
  },
  button: {
    backgroundColor: '#e0c068', borderRadius: 8,
    padding: 14, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#aaa', fontSize: 14 },
  linkBold: { color: '#e0c068', fontWeight: 'bold' },
});
