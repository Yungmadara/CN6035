import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε όλα τα πεδία');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Σφάλμα', 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Σφάλμα', 'Οι κωδικοί δεν ταιριάζουν');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Σφάλμα', 'Μη έγκυρη διεύθυνση email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/register', { name, email, password });
      Alert.alert(
        '✅ Επιτυχής Εγγραφή',
        `Καλώς ήρθατε, ${name}! Ο λογαριασμός σας δημιουργήθηκε.`,
        [{ text: 'Σύνδεση', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      Alert.alert('Σφάλμα', err.response?.data?.message || 'Αποτυχία εγγραφής');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.icon}>🎭</Text>
        <Text style={styles.title}>Δημιουργία Λογαριασμού</Text>
        <Text style={styles.subtitle}>Εγγραφείτε για να κάνετε κρατήσεις</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ονοματεπώνυμο</Text>
          <TextInput
            style={styles.input}
            placeholder="π.χ. Γιώργος Παπαδόπουλος"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
          />
        </View>

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
            placeholder="Τουλάχιστον 6 χαρακτήρες"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Επιβεβαίωση Κωδικού</Text>
          <TextInput
            style={[styles.input, confirmPassword && password !== confirmPassword && styles.inputError]}
            placeholder="Επαναλάβετε τον κωδικό"
            placeholderTextColor="#555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorText}>Οι κωδικοί δεν ταιριάζουν</Text>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Δημιουργία...' : 'Εγγραφή'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Έχετε ήδη λογαριασμό; <Text style={styles.linkBold}>Σύνδεση</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#1a1a2e' },
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, color: '#e0c068', fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 28, textAlign: 'center' },
  inputGroup: { width: '100%', marginBottom: 14 },
  label: { color: '#ccc', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    width: '100%', backgroundColor: '#16213e', color: '#fff',
    borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#0f3460',
  },
  inputError: { borderColor: '#ff6b6b' },
  errorText: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  button: {
    width: '100%', backgroundColor: '#e0c068',
    borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16, marginTop: 8,
  },
  buttonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#aaa', marginTop: 8, fontSize: 14 },
  linkBold: { color: '#e0c068', fontWeight: 'bold' },
});
