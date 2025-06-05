import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from './ThemedText'

const Header = () => {
  return (
    <View>
      <ThemedText type='title'>Header</ThemedText>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({})