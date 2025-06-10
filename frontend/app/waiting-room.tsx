import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@env';
import axios from 'axios';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function WaitingRoom() {
  const { gameId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [nbJoueurs, setNbJoueurs] =useState(1)
  const navigation = useNavigation()

  useEffect(() => {
  if (!gameId || !token) return;

  console.log("Polling gameId:", gameId);
  const intervalId = setInterval(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/games/${gameId}/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gameState = res.data;
      setNbJoueurs(gameState.players.length);

      // 💡 Si 2 joueurs présents et partie pas démarrée → on la démarre
      if (gameState.players.length === 2 && gameState.status !== 'started') {
        try {
          await axios.post(
            `${API_BASE_URL}/api/games/${gameId}/start`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Partie démarrée automatiquement !");
        } catch (startError) {
          console.error("Erreur lors du démarrage automatique :", startError);
        }
      }

      // 🔁 Quand la partie est démarrée, on redirige
      if (gameState.status === 'started' || gameState.currentQuestion) {
        clearInterval(intervalId);
        navigation.navigate("game", { gameId });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("En attente du démarrage de la partie...");
      } else {
        console.error("Erreur de polling :", error);
        clearInterval(intervalId);
        Alert.alert("Erreur", "Impossible de récupérer l'état de la partie.");
      }
    }
  }, 3000);

  return () => clearInterval(intervalId);
}, [gameId, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>En attente d’un adversaire...</Text>
      <Text style={styles.text}>Nombre de joueurs actuellement : {nbJoueurs}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  text: { marginTop: 20, fontSize: 18, color: 'white' },
});