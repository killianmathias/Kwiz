import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const QuizDetail = ({ route }) => {
  const { quiz } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{quiz.title}</Text>
      <Text style={styles.description}>{quiz.description}</Text>
      {/* Tu peux aussi afficher quiz.questions ici */}
    </View>
  );
};

export default QuizDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 10,
    fontSize: 16,
  },
});