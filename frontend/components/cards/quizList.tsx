import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@env';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
const { width, height } = Dimensions.get('window');
const QuizList = () => {
  const { token } = useAuth(); // récupère le token depuis le contexte
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  console.log(token);

  const fetchQuizzes = async () => {
    try { // ⚠️ adapte en fonction de la structure réelle
      const response = await axios.get(`${API_BASE_URL}/api/quizzes/getAll`, {
        headers: {
          Authorization: `Bearer ${token}`, // 🔐 Auth header
        },
      });
      setQuizzes(response.data);
    } catch (err) {
      console.error('Erreur API:', err);
      setError("Erreur lors du chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (error) return <Text style={{ marginTop: 50, color: 'red' }}>{error}</Text>;

  return (
    <FlatList
      data={quizzes}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card}
          onPress={() => router.push(`../quiz/${item.id}`)} // 👈 navigation dynamique
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text>Aucun quiz disponible.</Text>}
      horizontal={true}
    />
  );
};

export default QuizList;

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal:10,
    height:0.15 * height,
    width : 0.3 * width
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    color: '#555',
    marginTop: 4,
  },
});