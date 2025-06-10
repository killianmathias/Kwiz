import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';



const { width, height } = Dimensions.get('window');
const Header = () => {
  const {user} = useAuth();

  return (
    <View style={styles.header_container}>
      <View style={styles.headerTextContainer}>
        <ThemedText type='subtitle' style={styles.headerText}>Ravi de vous revoir parmi nous {user?.username}</ThemedText>
      </View>
      <Image source={require('../assets/images/icon.png')} style={styles.headerImage}/>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  header_container: {
    width: '100%',
    height: 0.1 * height,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0.05 * width,
  },
  headerImage: {
    width: 0.15 * width,
    height: 0.15 * width,
  },
  headerTextContainer: {
    maxWidth: 0.6 * width,
    height: '100%',
    justifyContent: 'center',
    // flexWrap supprimé
  },
  headerText: {
    flexShrink: 1, // permet au texte de se réduire et wrap
    fontSize: 16,
  },
});