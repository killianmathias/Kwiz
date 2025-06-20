import QuizList from '@/components/cards/quizList';
import Header from '@/components/Header';
import { Dimensions, SafeAreaView, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.pageContainer}>
        <Header/>
        <QuizList/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  pageContainer:{
    width : width,
    height : height,
  }
});
