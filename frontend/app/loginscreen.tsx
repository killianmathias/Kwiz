import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, userId } = res.data;
      console.log("User ID:", userId);

      const userRes = await axios.post(
        `${API_BASE_URL}/auth/getUser/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = userRes.data;
      login(user, token);

      Alert.alert("Connecté", `Bienvenue ${user.username}`);
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.message || "Erreur inconnue");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    color: "white",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
});
