import React from "react";
import { StyleSheet, Text, View, Button, Alert } from "react-native";
import { useAuth } from "@/context/AuthContext"; // Assure-toi que ce chemin est correct
import { useRouter } from "expo-router";

const Account = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/loginpage"); // Redirige vers la page de login
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
      Alert.alert("Erreur", "La déconnexion a échoué.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon compte</Text>
      <Button title="Se déconnecter" onPress={handleLogout} color="#d9534f" />
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
