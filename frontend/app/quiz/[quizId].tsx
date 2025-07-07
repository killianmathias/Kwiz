import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizDetail() {
  const { quizId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [quiz, setQuiz] = useState<any>(null);
  const [quizUser, setQuizUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/quiz/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuiz(res.data.quiz);
      } catch (error) {
        console.error("Erreur lors de la récupération du quiz :", error);
      }
    };

    if (quizId && token) fetchQuiz();
  }, [quizId, token]);

  useEffect(() => {
    const fetchQuizCreator = async () => {
      if (!quiz) return;

      try {
        const userId = quiz.userId;
        const userRes = await axios.post(
          `${API_BASE_URL}/auth/getUser/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setQuizUser(userRes.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du créateur du quiz :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (quiz && token) fetchQuizCreator();
  }, [quiz, token]);

  if (loading || !quiz || !quizUser) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        style={styles.image}
        source={require("../../assets/images/pixar.png")}
      />
      <ThemedText type="title" style={styles.title}>
        {quiz.title}
      </ThemedText>
      <Text style={styles.subtitle}>
        Questions : {quiz.questions?.length || 0}
      </Text>
      <ThemedText type="subtitle">Créé par : {quizUser.username}</ThemedText>
      <Button title="Jouer"></Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center" },
  title: { margin: 20 },
  subtitle: { fontSize: 18, marginTop: 10, color: "white" },
  image: { width: "100%", height: "40%", borderRadius: 24 },
});
