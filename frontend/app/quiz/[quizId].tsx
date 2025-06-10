import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@env';
import axios from 'axios';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizDetail() {
  const { quizId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/quizzes/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuiz(res.data);
      } catch (error) {
        console.error('Erreur lors de la récupération du quiz :', error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId && token) fetchQuiz();
  }, [quizId, token]);

const handleStartGame = async () => {
  try {
    // 1. Essayer de récupérer une partie existante en waiting pour ce quiz
    let game = null;
    try {
      const availableRes = await axios.get(
        `${API_BASE_URL}/api/games/available/${quizId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      game = availableRes.data;
    } catch (error) {
      // 404 => pas de partie dispo, on crée la partie ensuite
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        throw error; // autre erreur => on stop
      }
    }

    // 2. Si aucune partie dispo, on crée une nouvelle partie
    if (!game) {
      const createRes = await axios.post(
        `${API_BASE_URL}/api/games`,
        { quizId: Number(quizId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      game = createRes.data;
    }else{
      await axios.post(
        `${API_BASE_URL}/api/games/join`,
        {gameId : Number(game.id)},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }

    console.log("Partie trouvée ou créée :", game);
    
    // 3. Naviguer vers la salle d'attente avec l'id de la partie
    navigation.navigate('waiting-room', { gameId: game.id });

  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre ou créer une partie :", error);
    Alert.alert("Erreur", "Impossible de démarrer ou rejoindre la partie.");
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Quiz introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{quiz.title}</Text>
      <Text style={styles.subtitle}>Questions : {quiz.questions.length}</Text>
      <ThemedText type='subtitle'>Créé par : {quiz.userId}</ThemedText>

      <View style={{ marginTop: 20 }}>
        <Button title="Jouer au quiz" onPress={handleStartGame} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 18, marginTop: 10, color: 'white' },
});