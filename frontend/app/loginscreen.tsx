import { useAuth } from '@/context/AuthContext'; // <-- Import du hook Auth
import { API_BASE_URL } from '@env';
import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

console.log(API_BASE_URL);

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login } = useAuth();  // récupère la fonction login du contexte

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, user } = res.data;

      login(user, token);  // met à jour le contexte, ça déclenchera la navigation conditionnelle
      
      Alert.alert('Connexion réussie', `Bienvenue ${user.username}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.response?.data?.message || 'Une erreur est survenue');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    color:'black',
    marginBottom: 16,
    padding: 12,
    borderRadius: 6,
  },
});