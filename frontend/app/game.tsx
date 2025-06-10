import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@env";
import axios from "axios";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState("")

  // 🔁 Récupère l'état actuel de la partie
  const fetchGameState = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/games/${gameId}/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentQuestion(res.data.currentQuestion);
      setGameStatus(res.data.status)
      console.log(currentQuestion)
    } catch (error) {
      console.error("Erreur récupération question :", error);
      Alert.alert("Erreur", "Impossible de charger la question.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  if (!gameId || !token) return;

  const interval = setInterval(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/games/${gameId}/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const nextQuestion = res.data.currentQuestion;

      // Vérifie si la question a changé
      if (!currentQuestion || nextQuestion?.id !== currentQuestion.id) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null); // Réinitialise réponse
        setFeedback(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur polling état de la partie :", error);
    }
  }, 3000); // toutes les 3 secondes

  return () => clearInterval(interval); // Nettoyage quand le composant se démonte
}, [gameId, token, currentQuestion]);

  const handleAnswer = async (selectedIndex: number) => {
  if (!currentQuestion) return;

  console.log(`index sélectionné : ${selectedIndex}\n Question actuelle : ${Number(currentQuestion.id)}`);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/games/${gameId}/answer`,
      {
        gameId: Number(gameId),
        questionId: Number(currentQuestion.id),
        selectedIndex: Number(selectedIndex),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const isCorrect = res.data.answer.isCorrect; // Assure-toi que `answer.isCorrect` est bien ce que ton backend retourne
    setSelectedAnswer(String(selectedIndex)); // utilise bien l’index sélectionné ici
    setFeedback(isCorrect ? "Bonne réponse !" : "Mauvaise réponse...");

    setTimeout(async () => {
      setSelectedAnswer(null);
      setFeedback(null);
      await fetchGameState();
    }, 2000);
  } catch (error) {
    console.error("Erreur lors de la soumission :", error);
    Alert.alert("Erreur", "Impossible d'envoyer la réponse.");
  }
};

  if (isLoading || !currentQuestion) {
    if (gameStatus=="finished"){
      return <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Terminé</Text>
      </SafeAreaView>
    }
    else{
      return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Chargement...</Text>
        </SafeAreaView>
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{currentQuestion.question}</Text>

      <View style={styles.answersContainer}>
        {console.log(`Question actuelle :  ${currentQuestion}`)}
        {currentQuestion.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={`option-${index}`} // ✅ Clé unique par index
            
            style={[
              styles.answerButton,
              selectedAnswer === option&& {
                backgroundColor:
                  option=== selectedAnswer && feedback
                    ? feedback === "Bonne réponse !"
                      ? "green"
                      : "red"
                    : "#444",
              },
            ]}
            onPress={() => handleAnswer(index)}
            disabled={!!selectedAnswer}
          >
            <Text style={styles.answerText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 30 },
  answersContainer: { gap: 12 },
  answerButton: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
  },
  answerText: { color: "white", fontSize: 16 },
  feedback: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});